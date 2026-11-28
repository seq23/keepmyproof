import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { codeProblems, releaseNotes, preparedTrack, sentTrack, listingChanges, shotsDiffer, HIGHEST_BUILT, run, sendStops, shotUploadUrl, playCaller, PACKAGE } from '../scripts/store/play-release.mjs';
import { knownHere } from '../scripts/release-gate.mjs';
import play from '../store/google-play.json';

// Play as it stood on 27 Nov 2026 (status read): production serves 4, internal holds 4 and a draft of 5.
const live = (extra: object[] = []) => [
  { track: 'production', releases: [{ name: '1.0', versionCodes: ['4'], status: 'completed' }] },
  { track: 'internal', releases: [{ versionCodes: ['5'], status: 'draft' }, { versionCodes: ['4'], status: 'completed' }, ...extra] },
];
const withSix = live([{ versionCodes: ['6'], status: 'draft' }]);

test('only a code above 5 that is on the internal track and above what production serves may be released', () => {
  assert.deepEqual(codeProblems(withSix, '6'), []);
  assert.equal(HIGHEST_BUILT, 5);
  // vc5 was built 27 Nov and never sent: it may not be used again, even though it sits on internal.
  assert.match(codeProblems(live(), '5').join(), /not above 5/);
  assert.match(codeProblems(live(), '4').join(), /not above 5.*production already serves/);
  assert.match(codeProblems(live(), '6').join(), /not on the internal track/);
  assert.match(codeProblems(withSix, 'six').join(), /not a whole number/);
  assert.match(codeProblems(withSix, '').join(), /not a whole number/);
  // Production already serving a higher code refuses a lower one.
  const ahead = [{ track: 'production', releases: [{ versionCodes: ['9'], status: 'completed' }] }, ...withSix.slice(1)];
  assert.match(codeProblems(ahead, '6').join(), /production already serves versionCode 9/);
  // A failed read (no tracks) is never a clear.
  assert.match(codeProblems([], '6').join(), /no releases at all/);
});

test('release notes: every language present, none over Play\'s 500 characters, and the repo file passes', () => {
  const notes = JSON.parse(readFileSync(new URL('../store/play-release-notes.json', import.meta.url), 'utf8'));
  const out = releaseNotes(notes);
  assert.deepEqual(out.map(n => n.language), ['en-US', 'es-US', 'zh-CN', 'ko-KR']);
  assert.throws(() => releaseNotes({ ...notes, ko: '' }), /ko: no release notes/);
  assert.throws(() => releaseNotes({ ...notes, es: 'x'.repeat(501) }), /es: 501 characters/);
  assert.equal(releaseNotes({ ...notes, es: 'é'.repeat(500) })[1].text.length, 500);
});

test('prepare keeps what production serves and adds one draft; send needs that draft and makes it the one completed release', () => {
  const prod = live()[0];
  const notes = [{ language: 'en-US', text: 'x' }];
  const prepared = preparedTrack(prod, '6', notes);
  assert.deepEqual(prepared.releases.map(r => [r.versionCodes, r.status]), [[['4'], 'completed'], [['6'], 'draft']]);
  assert.equal(prepared.releases[1].name, '1.0 (6)');
  // An older draft is replaced, never kept beside the new one.
  const stale = { ...prod, releases: [...prod.releases, { versionCodes: ['5'], status: 'draft' }] };
  assert.deepEqual(preparedTrack(stale, '6', notes).releases.map(r => r.status), ['completed', 'draft']);
  const sent = sentTrack(prepared, '6');
  assert.deepEqual(sent.releases.map(r => [r.versionCodes, r.status]), [[['6'], 'completed']]);
  assert.deepEqual(sent.releases[0].releaseNotes, notes);
  assert.throws(() => sentTrack(prod, '6'), /NO_PRODUCTION_DRAFT/);
  assert.throws(() => sentTrack(prepared, '7'), /NO_PRODUCTION_DRAFT/);
  // Already completed (sent once) is not a draft: send refuses to resend it.
  assert.throws(() => sentTrack({ releases: [{ versionCodes: ['6'], status: 'completed' }] }, '6'), /NO_PRODUCTION_DRAFT/);
});

test('listing changes: only fields that differ, and a language Play does not list yet is added whole', () => {
  const wanted = play.listings;
  const same = Object.values(wanted).map(w => ({ language: w.locale, title: w.title, shortDescription: w.short, fullDescription: w.full }));
  assert.deepEqual(listingChanges(same, wanted), []);
  const changed = listingChanges(same.map(l => l.language === 'en-US' ? { ...l, fullDescription: 'old' } : l).filter(l => l.language !== 'ko-KR'), wanted);
  assert.deepEqual(changed.map(c => [c.locale, c.fields]), [['en-US', ['fullDescription']], ['ko-KR', ['new language', 'title', 'shortDescription', 'fullDescription']]]);
  assert.equal(changed[0].body.fullDescription, wanted.en.full);
});

test('screenshots differ unless Play holds exactly the repo images in order', () => {
  assert.equal(shotsDiffer(['a', 'b', 'c'], ['a', 'b', 'c']), false);
  assert.equal(shotsDiffer(['b', 'a', 'c'], ['a', 'b', 'c']), true);
  assert.equal(shotsDiffer(['a', 'b'], ['a', 'b', 'c']), true);
  assert.equal(shotsDiffer([], ['a', 'b', 'c']), true);
});

// A fake Play: one store of tracks, listings, details and screenshots; an edit copies it and a commit writes it back.
type Call = [string, string, unknown?, { url?: string; type?: string }?];
function fakePlay(o: { failOn?: (c: Call) => boolean; dropOnCommit?: boolean } = {}) {
  const wanted = play.listings;
  const store = {
    tracks: [{ track: 'production', releases: [{ name: '1.0', versionCodes: ['4'], status: 'completed' }] },
      { track: 'internal', releases: [{ versionCodes: ['6'], status: 'draft' }, { versionCodes: ['4'], status: 'completed' }] }] as any[],
    listings: [{ language: 'en-US', title: wanted.en.title, shortDescription: wanted.en.short, fullDescription: 'old' }] as any[],
    details: { contactEmail: 'old@example.invalid' } as any,
    shots: { 'en-US': ['old1', 'old2', 'old3', 'old4'] } as Record<string, string[]>,
  };
  const edits: Record<string, any> = {}; let n = 1000000;
  const calls: Call[] = [];
  const call = async (method: string, path: string, body?: unknown, opt?: { url?: string; type?: string }) => {
    const c: Call = [method, opt?.url ?? path, body, opt]; calls.push(c);
    if (o.failOn?.(c)) throw Error(`NAMED STOP [PLAY_API] ${method} ${path} answered HTTP 503: unreachable`);
    const url = opt?.url;
    if (method === 'POST' && path === '' && !url) { const id = String(++n); edits[id] = structuredClone(store); return { id }; }
    if (url) { const [, id, loc] = /edits\/(\d+)\/listings\/([^/]+)\/phoneScreenshots\?uploadType=media$/.exec(url)!; edits[id].shots[loc].push(createHash('sha256').update(body as Buffer).digest('hex')); return { image: {} }; }
    const [, id, rest = ''] = /^\/(\d+)(.*)$/.exec(path)!;
    const e = edits[id];
    if (method === 'DELETE' && rest === '') { delete edits[id]; return null; }
    if (rest === ':commit') { if (!o.dropOnCommit) Object.assign(store, structuredClone(e)); delete edits[id]; return {}; }
    if (rest === '/tracks') return { tracks: e.tracks };
    if (rest === '/listings') return { listings: e.listings };
    if (rest === '/details') { if (method === 'PATCH') Object.assign(e.details, body); return e.details; }
    if (rest === '/tracks/production') { e.tracks = [body, ...e.tracks.filter((t: any) => t.track !== 'production')]; return body; }
    let m = /^\/listings\/([^/]+)\/phoneScreenshots$/.exec(rest);
    if (m) { if (method === 'DELETE') { e.shots[m[1]!] = []; return null; } return { images: (e.shots[m[1]!] ?? []).map((sha256: string) => ({ sha256 })) }; }
    m = /^\/listings\/([^/]+)$/.exec(rest);
    if (m && method === 'PUT') { e.listings = [...e.listings.filter((l: any) => l.language !== m![1]), body]; if (!e.shots[m[1]!]) e.shots[m[1]!] = []; return body; }
    throw Error(`fake Play: no route ${method} ${path}`);
  };
  return { store, edits, calls, call };
}
const shotBytes = [Buffer.from('one'), Buffer.from('two'), Buffer.from('three')];
const files = { wanted: play.listings, notes: JSON.parse(readFileSync(new URL('../store/play-release-notes.json', import.meta.url), 'utf8')),
  shotBytes, shotHashes: shotBytes.map(b => createHash('sha256').update(b).digest('hex')), contactEmail: 'support@keepmyproof.com' };
const clear = async () => [];
const quiet = { log: () => {} };
const writes = (calls: Call[]) => calls.filter(([m, p, , o]) => m !== 'GET' && !(m === 'POST' && p === '' && !o?.url) && !(m === 'DELETE' && /^\/\d+$/.test(p)));

test('send runs the release gate first: any stop it raises opens no edit and sends nothing', async () => {
  for (const code of ['DEVICE_RELEASE_GATE_PENDING', 'PRICE_RECHECK_PENDING', 'LEGAL_URLS_UNREACHABLE', 'SUPPORT_ADDRESS_NOT_ON_DOMAIN']) {
    const p = fakePlay(), lines: string[] = [];
    const exit = await run('send', '6', { call: p.call, files, gate: async () => [{ code, why: 'x' }], log: l => lines.push(l) });
    assert.equal(exit, 2, code);
    assert.deepEqual(p.calls, [], `${code}: Play was called`);
    assert.match(lines.join('\n'), new RegExp(`NAMED STOP \\[${code}\\][\\s\\S]*nothing was sent to Play`));
  }
  // The real gate is stops() at the upload stage, keeping every stop this Mac can judge (all but the EAS-only key).
  const all = Object.keys((await import('../scripts/release-gate.mjs')).STOP_WORDS).map(code => ({ code, why: 'x' }));
  assert.deepEqual((await sendStops(async () => all)).map(s => s.code), knownHere(false, 'upload'));
  assert.ok(knownHere(false, 'upload').includes('DEVICE_RELEASE_GATE_PENDING') && knownHere(false, 'upload').includes('SUPPORT_ADDRESS_NOT_ON_DOMAIN'));
});

test('send with Play unreachable commits nothing and says so; a failure mid-send deletes the edit', async () => {
  const down = fakePlay({ failOn: () => true });
  await assert.rejects(run('send', '6', { call: down.call, files, gate: clear, ...quiet }), /HTTP 503[\s\S]*nothing was committed to Play/);
  assert.ok(!down.calls.some(([, p]) => p.endsWith(':commit')));
  const p = fakePlay();
  await run('prepare', '6', { call: p.call, files, ...quiet });
  const mid = fakePlay({ failOn: ([m, p]) => m === 'POST' && p.includes('uploadType=media') });
  Object.assign(mid.store, structuredClone(p.store));
  const before = structuredClone(mid.store);
  await assert.rejects(run('send', '6', { call: mid.call, files, gate: clear, ...quiet }), /nothing was committed to Play/);
  assert.deepEqual(mid.store, before, 'Play changed although the send failed');
  assert.deepEqual(Object.keys(mid.edits), [], 'the edit was left open');
});

test('prepare then send: listing, contact email, screenshots (uploadType=media) and the release all land and read back', async () => {
  const p = fakePlay(), lines: string[] = [];
  assert.equal(await run('prepare', '6', { call: p.call, files, log: l => lines.push(l) }), 0);
  assert.deepEqual(p.store.tracks[0].releases.map((r: any) => [r.versionCodes[0], r.status]), [['4', 'completed'], ['6', 'draft']]);
  assert.equal(p.store.details.contactEmail, 'old@example.invalid', 'prepare changed the listing');
  assert.equal(await run('send', '6', { call: p.call, files, gate: clear, log: l => lines.push(l) }), 0, lines.join('\n'));
  assert.deepEqual(p.store.tracks[0].releases.map((r: any) => [r.versionCodes[0], r.status]), [['6', 'completed']]);
  assert.equal(p.store.details.contactEmail, 'support@keepmyproof.com');
  assert.deepEqual(listingChanges(p.store.listings, play.listings), []);
  for (const loc of ['en-US', 'es-US', 'zh-CN', 'ko-KR']) assert.deepEqual(p.store.shots[loc], files.shotHashes, loc);
  const uploads = p.calls.filter(([m, u]) => m === 'POST' && u.startsWith('https://'));
  assert.equal(uploads.length, 12);
  for (const [, u, , o] of uploads) { assert.match(u, /^https:\/\/androidpublisher\.googleapis\.com\/upload\/androidpublisher\/v3\/applications\/com\.keepmyproof\.app\/edits\/\d+\/listings\/[a-zA-Z-]+\/phoneScreenshots\?uploadType=media$/); assert.equal(o?.type, 'image/png'); }
  assert.match(lines.at(-1)!, /^OUTPUT play production: com\.keepmyproof\.app versionCode 6 is the completed production release/);
  assert.deepEqual(Object.keys(p.edits), []);
  // Sending again: production already serves 6, so it is refused and nothing is written.
  const again = fakePlay(); Object.assign(again.store, structuredClone(p.store));
  const said: string[] = [];
  assert.equal(await run('send', '6', { call: again.call, files, gate: clear, log: l => said.push(l) }), 2);
  assert.match(said.join('\n'), /CODE_REFUSED\] production already serves versionCode 6/);
  assert.deepEqual(writes(again.calls), []);
  // A draft that is missing (prepare never ran) refuses too, and the edit is deleted.
  const bare = fakePlay();
  await assert.rejects(run('send', '6', { call: bare.call, files, gate: clear, ...quiet }), /NO_PRODUCTION_DRAFT[\s\S]*nothing was committed/);
  assert.deepEqual(writes(bare.calls), []); assert.deepEqual(Object.keys(bare.edits), []);
});

test('a commit Play does not keep is a NAMED STOP, never done; status writes nothing', async () => {
  const p = fakePlay();
  await run('prepare', '6', { call: p.call, files, ...quiet });
  const lost = fakePlay({ dropOnCommit: true }); Object.assign(lost.store, structuredClone(p.store));
  const lines: string[] = [];
  assert.equal(await run('send', '6', { call: lost.call, files, gate: clear, log: l => lines.push(l) }), 2);
  const out = lines.join('\n');
  assert.match(out, /NOT_ON_PLAY\] versionCode 6 reads back as draft, not completed/);
  assert.match(out, /NOT_ON_PLAY\] contact email reads back as old@example\.invalid/);
  assert.match(out, /NOT_ON_PLAY\] phone screenshots en-US still differ/);
  assert.doesNotMatch(out, /^OUTPUT/m);
  const s = fakePlay();
  assert.equal(await run('status', undefined as any, { call: s.call, files, ...quiet }), 0);
  assert.deepEqual(writes(s.calls), []);
});

test('the real caller: upload URL carries uploadType=media; a non-2xx answer throws with its status', async () => {
  assert.equal(shotUploadUrl('123', 'en-US'), `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE}/edits/123/listings/en-US/phoneScreenshots?uploadType=media`);
  const seen: [string, any][] = [];
  const ok = playCaller('t', (async (url: string, init: any) => { seen.push([url, init]); return new Response('{"id":"1"}', { status: 200 }); }) as any);
  await ok('POST', '', Buffer.from('png'), { url: shotUploadUrl('1', 'en-US'), type: 'image/png' });
  assert.equal(seen[0]![0], shotUploadUrl('1', 'en-US'));
  assert.equal(seen[0]![1].headers['content-type'], 'image/png');
  assert.equal(seen[0]![1].headers.authorization, 'Bearer t');
  const bad = playCaller('t', (async () => new Response('Upload requests must include an uploadType URL parameter', { status: 400 })) as any);
  await assert.rejects(bad('POST', '/1/listings/en-US/phoneScreenshots'), /PLAY_API\] POST edits\/1\/listings.*HTTP 400: Upload requests must include/);
});

test('the gate send runs reads the repo from any working directory (send runs from ~/GitHub/boss-os)', async () => {
  const { gateDeps } = await import('../scripts/release-gate.mjs');
  const here = process.cwd();
  process.chdir(tmpdir());
  try {
    const d = gateDeps();
    assert.match(d.version, /^\d+\.\d+/);
    assert.notEqual(d.readJson('release/price-check.json'), null, 'release/price-check.json was read from the working directory, not the repo');
    assert.equal(d.supportEmail, 'support@keepmyproof.com');
  } finally { process.chdir(here); }
});
