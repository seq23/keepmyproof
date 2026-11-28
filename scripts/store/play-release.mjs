// Google Play production release of a bundle that is already on the internal track (android-store-build.yml).
// Three steps, each one Play edit; nothing is published before `send`:
//   status            read-only: every track's releases, which listing texts and phone screenshots differ from store/
//   prepare <code>    production DRAFT release of <code> with its release notes (store/play-release-notes.json).
//                     The live release keeps serving; a draft is not sent to Google and is deleted in the Console.
//   send <code>       after the store review's PASS: the listing texts and phone screenshots from store/ that differ
//                     from Play, and the draft becomes the completed production release (sent to Google review).
// Refuses a code that is not above every code Play has seen (vc5 was built 27 Nov and never sent: codes must be
// above 5), a code that is not on the internal track, and notes that are missing or over Play's 500 characters.
// Key: the Play upload service account JSON in env GOOGLE_PLAY_UPLOAD_SA_JSON (Boss OS vault, by name), e.g.
//   cd ~/GitHub/boss-os && npm run -s vault:run -- node <repo>/scripts/store/play-release.mjs status
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gscToken } from '../lib/gsc.mjs';

export const PACKAGE = 'com.keepmyproof.app';
/** The highest versionCode ever built for Play (vc5, 27 Nov 2026 at 336557c, never sent). A release must be above it. */
export const HIGHEST_BUILT = 5;
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications';
const root = new URL('../../', import.meta.url);
const LOCALES = { en: 'en-US', es: 'es-US', zh: 'zh-CN', ko: 'ko-KR' };
export const SHOTS = ['store/play/phone-01.png', 'store/play/phone-02.png', 'store/play/phone-03.png'];

/** Every reason <code> may not become the production release. `[]` = it may. */
export function codeProblems(tracks, code) {
  const vc = Number(code), out = [];
  if (!Number.isInteger(vc) || vc <= 0) return [`versionCode "${code}" is not a whole number`];
  if (vc <= HIGHEST_BUILT) out.push(`versionCode ${vc} is not above ${HIGHEST_BUILT}, the highest code already built`);
  const all = tracks.flatMap(t => (t.releases ?? []).flatMap(r => (r.versionCodes ?? []).map(Number)));
  const onInternal = tracks.some(t => t.track === 'internal' && (t.releases ?? []).some(r => (r.versionCodes ?? []).map(Number).includes(vc)));
  if (!onInternal) out.push(`versionCode ${vc} is not on the internal track (build it with android-store-build.yml first)`);
  const prod = tracks.find(t => t.track === 'production');
  const live = (prod?.releases ?? []).filter(r => r.status !== 'draft').flatMap(r => (r.versionCodes ?? []).map(Number));
  if (live.some(v => v >= vc)) out.push(`production already serves versionCode ${Math.max(...live)}, not below ${vc}`);
  if (!all.length) out.push('Play returned no releases at all (a failed read is never a clear)');
  return out;
}

/** Release notes per Play locale from store/play-release-notes.json; refuses a missing locale or one over 500 characters. */
export function releaseNotes(notes) {
  const out = [], bad = [];
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const text = String(notes?.[lang] ?? '').trim();
    if (!text) bad.push(`${lang}: no release notes`);
    else if ([...text].length > 500) bad.push(`${lang}: ${[...text].length} characters, Play allows 500`);
    else out.push({ language: locale, text });
  }
  if (bad.length) throw Error(`NAMED STOP [RELEASE_NOTES] ${bad.join('; ')}`);
  return out;
}

/** The production track after `prepare`: what serves today stays as it is, plus one draft of <code>. */
export function preparedTrack(prod, code, notes) {
  const kept = (prod?.releases ?? []).filter(r => r.status !== 'draft');
  return { track: 'production', releases: [...kept, { name: `1.0 (${code})`, versionCodes: [String(code)], status: 'draft', releaseNotes: notes }] };
}

/** The production track after `send`: the draft of <code> becomes the one completed release. Refuses without that draft. */
export function sentTrack(prod, code) {
  const draft = (prod?.releases ?? []).find(r => r.status === 'draft' && (r.versionCodes ?? []).map(String).includes(String(code)));
  if (!draft) throw Error(`NAMED STOP [NO_PRODUCTION_DRAFT] production holds no draft of versionCode ${code}; run prepare first`);
  return { track: 'production', releases: [{ ...draft, status: 'completed' }] };
}

/** Listing fields (title, short, full) in store/google-play.json that differ from Play's, per locale. */
export function listingChanges(live, wanted) {
  const changes = [];
  for (const [lang, w] of Object.entries(wanted)) {
    const l = live.find(x => x.language === w.locale) ?? {};
    const fields = [['title', 'title'], ['short', 'shortDescription'], ['full', 'fullDescription']].filter(([a, b]) => (l[b] ?? '') !== w[a]).map(([, b]) => b);
    if (!l.language) fields.unshift('new language');
    if (fields.length) changes.push({ lang, locale: w.locale, fields, body: { language: w.locale, title: w.title, shortDescription: w.short, fullDescription: w.full } });
  }
  return changes;
}

/** True when Play's phone screenshots for a locale are not exactly store/play/phone-0n.png, in order. */
export function shotsDiffer(liveHashes, fileHashes) {
  return liveHashes.length !== fileHashes.length || liveHashes.some((h, i) => h !== fileHashes[i]);
}

async function client() {
  const raw = process.env.GOOGLE_PLAY_UPLOAD_SA_JSON;
  if (!raw) throw Error('NAMED STOP [SECRET_MISSING] GOOGLE_PLAY_UPLOAD_SA_JSON is not in the environment (run through vault:run)');
  const token = await gscToken(JSON.parse(raw), 'https://www.googleapis.com/auth/androidpublisher');
  const call = async (method, path, body, base = API, type = 'application/json') => {
    const r = await fetch(`${base}/${PACKAGE}/edits${path}`, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': type } : {}) },
      body: body == null ? undefined : type === 'application/json' ? JSON.stringify(body) : body });
    if (!r.ok) throw Error(`NAMED STOP [PLAY_API] ${method} edits${path.replace(/\/\d{6,}/, '/<edit>')} answered HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return method === 'DELETE' || r.status === 204 ? null : r.json();
  };
  return call;
}

async function read(call, id) {
  const { tracks = [] } = await call('GET', `/${id}/tracks`);
  const { listings = [] } = await call('GET', `/${id}/listings`);
  const wanted = JSON.parse(readFileSync(new URL('store/google-play.json', root), 'utf8')).listings;
  const fileHashes = SHOTS.map(p => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex'));
  const shots = {};
  // Only languages Play already lists have their own screenshots; a new language shows the default one's.
  for (const locale of Object.values(LOCALES).filter(l => listings.some(x => x.language === l))) {
    const { images = [] } = await call('GET', `/${id}/listings/${locale}/phoneScreenshots`);
    shots[locale] = shotsDiffer(images.map(i => i.sha256), fileHashes);
  }
  return { tracks, listings, wanted, shots };
}

async function main([mode, code]) {
  if (!['status', 'prepare', 'send'].includes(mode) || (mode !== 'status' && !code)) throw Error('NAMED STOP [USAGE] play-release.mjs status | prepare <versionCode> | send <versionCode>');
  const call = await client();
  const { id } = await call('POST', '');
  let committed = false;
  try {
    const { tracks, listings, wanted, shots } = await read(call, id);
    for (const t of tracks) for (const r of t.releases ?? []) console.log(`track ${t.track}: ${r.status} ${(r.versionCodes ?? []).join(',')} ${r.name ?? ''}`);
    const changes = listingChanges(listings, wanted);
    for (const c of changes) console.log(`listing ${c.locale}: differs in ${c.fields.join(', ')}`);
    for (const [locale, differ] of Object.entries(shots)) console.log(`phone screenshots ${locale}: ${differ ? 'differ from store/play' : 'same as store/play'}`);
    if (mode === 'status') return;
    const why = codeProblems(tracks, code);
    if (why.length) { for (const w of why) console.log(`NAMED STOP [CODE_REFUSED] ${w}`); process.exitCode = 2; return; }
    const prod = tracks.find(t => t.track === 'production');
    if (mode === 'prepare') {
      const notes = releaseNotes(JSON.parse(readFileSync(new URL('store/play-release-notes.json', root), 'utf8')));
      await call('PUT', `/${id}/tracks/production`, preparedTrack(prod, code, notes));
    } else {
      const track = sentTrack(prod, code);
      for (const c of changes) await call('PUT', `/${id}/listings/${c.locale}`, c.body);
      for (const [locale, differ] of Object.entries(shots)) {
        if (!differ) continue;
        await call('DELETE', `/${id}/listings/${locale}/phoneScreenshots`);
        for (const p of SHOTS) await call('POST', `/${id}/listings/${locale}/phoneScreenshots`, readFileSync(new URL(p, root)), UPLOAD, 'image/png');
      }
      await call('PUT', `/${id}/tracks/production`, track);
    }
    await call('POST', `/${id}:commit`); committed = true;
    // Read back in a fresh edit: the commit counts only when Play shows it.
    const { id: check } = await call('POST', '');
    try {
      const { tracks: after = [] } = await call('GET', `/${check}/tracks`);
      const want = mode === 'prepare' ? 'draft' : 'completed';
      const got = (after.find(t => t.track === 'production')?.releases ?? []).find(r => (r.versionCodes ?? []).map(String).includes(String(code)));
      if (got?.status !== want) { console.log(`NAMED STOP [NOT_ON_PRODUCTION] versionCode ${code} reads back as ${got?.status ?? 'absent'}, not ${want}`); process.exitCode = 2; return; }
      console.log(`OUTPUT play production: ${PACKAGE} versionCode ${code} is ${want === 'draft' ? 'a production DRAFT (not sent to Google)' : 'the completed production release (sent to Google review)'}.`);
    } finally { await call('DELETE', `/${check}`); }
  } finally { if (!committed) await call('DELETE', `/${id}`).catch(() => {}); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(e => { console.error(e?.message ?? e); process.exitCode = 1; });
