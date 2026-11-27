// Promise audit, 27 Nov 2026: the lines the site and app say must be what the code does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { keepOutOfBackup } from '../src/core/backup';
import { photoHint } from '../src/core/original';
import { exportHtml } from '../src/core/export';
import { strings } from '../src/strings';
import { renderAll } from '../site/build.mjs';
import { STATES } from '../site/lib/states.mjs';
import { STATES_CJK } from '../site/copy-cjk.mjs';
import config from '../app.config';

test('the vault folder is kept out of the phone backup on iOS; any doubt is "failed", never "excluded"', async () => {
  const calls: string[] = [];
  const ok = async (uri: string) => { calls.push(uri); return true; };
  assert.equal(await keepOutOfBackup('ios', 'file:///docs/vault/', ok), 'excluded');
  assert.deepEqual(calls, ['file:///docs/vault/'], 'the vault folder itself is flagged');
  assert.equal(await keepOutOfBackup('ios', 'file:///docs/vault/', async () => false), 'failed', 'the flag read back as off');
  assert.equal(await keepOutOfBackup('ios', 'file:///docs/vault/', async () => { throw Error('native'); }), 'failed', 'a native error');
  assert.equal(await keepOutOfBackup('ios', 'file:///docs/vault/', async () => 'yes' as unknown as boolean), 'failed', 'anything but true');
  let androidCalled = false;
  assert.equal(await keepOutOfBackup('android', 'file:///x/', async () => { androidCalled = true; return true; }), 'not-needed');
  assert.equal(androidCalled, false);
  // Android needs no flag only because the app opts out of Google's cloud backup entirely.
  assert.equal(config.android?.allowBackup, false);
});

test('the vault folder is flagged before the database is opened, and the native module really sets the flag', () => {
  const storage = readFileSync('src/native/storage.ts', 'utf8');
  const body = storage.slice(storage.indexOf('export async function database()'));
  const flag = body.indexOf('keepOutOfBackup(Platform.OS, directory.uri, excludeFromBackup)'), open = body.indexOf('SQLite.openDatabaseAsync(');
  assert.ok(flag > 0 && open > flag, 'database() must flag the vault folder before it opens or writes the vault');
  const swift = readFileSync('modules/kmp-kdf/ios/KmpKdfModule.swift', 'utf8');
  assert.match(swift, /AsyncFunction\("excludeFromBackup"\)/);
  assert.match(swift, /isExcludedFromBackup = true/);
  assert.match(swift, /resourceValues\(forKeys: \[\.isExcludedFromBackupKey\]\)\.isExcludedFromBackup == true/, 'reports what the system reads back');
});

test('only iOS is told it can pinch to zoom a photo (the zoom is the iOS scroll view)', () => {
  assert.equal(photoHint('ios'), 'photoZoom');
  assert.equal(photoHint('android'), 'photoFullScreen');
  assert.equal(photoHint('web'), 'photoFullScreen');
  for (const key of ['photoZoom', 'photoFullScreen'] as const) assert.equal(strings[key].length, 4, `${key} in all four languages`);
  const index = readFileSync('app/index.tsx', 'utf8');
  assert.equal((index.match(/t\('photoZoom'\)/g) || []).length, 0, 'the screen picks the hint by platform, never photoZoom outright');
});

test('a PDF with a cover (Plus) puts the cover on its own first page; without one the contents follow the title', () => {
  const item = { id: 'a', folder: 'divorce-prep', checklist: null, kind: 'note', title: 'Fictional note', note: 'n', happenedOn: null, savedOn: '2026-11-01T00:00:00Z',
    changedOn: null, filename: null, mime: null, bytes: null, sha256: null, tags: [], history: [] } as never;
  const withCover = exportHtml([item], { title: 'T', madeOn: '2026-11-01T00:00:00Z', lang: 'en', cover: 'Fictional cover text' });
  const css = /<style>([\s\S]*?)<\/style>/.exec(withCover)![1];
  const contents = /<h2([^>]*)>Contents<\/h2>/.exec(withCover) ?? /<h2([^>]*)>[^<]*<\/h2><ol>/.exec(withCover);
  assert.ok(contents, 'contents heading found');
  const cls = /class="([^"]+)"/.exec(contents![1])?.[1];
  assert.ok(cls && new RegExp(`\\.${cls}\\{break-before:page\\}|[,}]\\.${cls}[,{][^}]*break-before:page`).test(css), 'the contents start a new page after the cover');
  assert.ok(withCover.indexOf('Fictional cover text') < withCover.indexOf(contents![0]), 'the cover text is on the first page');
  const plain = exportHtml([item], { title: 'T', madeOn: '2026-11-01T00:00:00Z', lang: 'en' });
  assert.doesNotMatch(/<h2([^>]*)>[^<]*<\/h2><ol>/.exec(plain)![1], /class=/, 'no blank cover page without a cover');
});

test('a state list says "and DC" exactly when it lists DC, in every language', () => {
  const { files } = renderAll() as { files: Record<string, unknown> };
  const dcName = { en: STATES.DC.en, es: STATES.DC.es, zh: STATES_CJK.zh.DC, ko: STATES_CJK.ko.DC } as Record<string, string>;
  const SAYS_DC = { en: / and DC\b/, es: / y DC\b/, zh: /和华盛顿特区/, ko: /와 워싱턴 DC/ } as Record<string, RegExp>;
  let withDc = 0, withoutDc = 0;
  for (const [file, html] of Object.entries(files)) {
    if (typeof html !== 'string' || !html.includes('<ul class="links">')) continue;
    const lang = /^(es|zh|ko)\//.exec(file)?.[1] ?? 'en';
    const def = /<p class="definition answer">([^<]*)<\/p>/.exec(html)?.[1] ?? '';
    if (!/official sources for \d+ states|fuentes oficiales para \d+ estados|\d+ 个州|\d+개 주/.test(def)) continue;
    const links = /<ul class="links">([\s\S]*?)<\/ul>/.exec(html)![1];
    const listed = links.includes(`>${dcName[lang]}</a>`);
    assert.equal(SAYS_DC[lang].test(def), listed, `${file}: says DC ${SAYS_DC[lang].test(def)}, lists DC ${listed}`);
    listed ? withDc++ : withoutDc++;
  }
  assert.ok(withDc > 0 && withoutDc > 0, `both kinds of state list were checked (with DC ${withDc}, without ${withoutDc})`);
  // A folder's state index says DC when any of its subtopic pages lists DC.
  let indexes = 0;
  for (const [file, html] of Object.entries(files)) {
    if (typeof html !== 'string' || !html.includes('<div class="grid two"><div class="box"><h3><a href="')) continue;
    const lang = /^(es|zh|ko)\//.exec(file)?.[1] ?? 'en';
    const def = /<p class="definition answer">([^<]*)<\/p>/.exec(html)?.[1] ?? '';
    if (!/official sources for \d+ states|fuentes oficiales para \d+ estados|\d+ 个州|\d+개 주/.test(def)) continue;
    const subs = [...html.matchAll(/<div class="box"><h3><a href="\/([^"]*)">/g)].map((m) => files[`${m[1]}index.html`]);
    assert.ok(subs.length && subs.every((s) => typeof s === 'string'), `${file}: its subtopic pages render`);
    const listed = subs.some((s) => (/<ul class="links">([\s\S]*?)<\/ul>/.exec(s as string)?.[1] ?? '').includes(`>${dcName[lang]}</a>`));
    assert.equal(SAYS_DC[lang].test(def), listed, `${file}: says DC ${SAYS_DC[lang].test(def)}, a subtopic lists DC ${listed}`);
    indexes++;
  }
  assert.ok(indexes >= 6, `folder state indexes checked: ${indexes}`);
});

// App readiness, 27 Nov 2026: the app does talk to the network (RevenueCat, for Plus), so no line it shows or the
// store shows may say that NOTHING leaves the device. Lines about the person's papers ("your papers leave only…")
// stay true. A claim check, in every language the app ships.
const NOTHING_LEAVES = [/\bnothing leaves\b/i, /\bnada sale\b/i, /任何内容都不会离开/, /아무것도 밖으로/];
test('no app or store line says nothing at all leaves the device, while the app contacts RevenueCat', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(pkg.dependencies['react-native-purchases'], 'the claim check rests on the app shipping RevenueCat');
  const said: string[] = [];
  for (const [key, langs] of Object.entries(strings as unknown as Record<string, readonly string[]>))
    for (const line of langs) if (NOTHING_LEAVES.some(r => r.test(line)) && !/Photos|照片|사진|Fotos/.test(line)) said.push(`${key}: ${line}`);
  for (const f of ['store/en.md', 'store/es.md', 'store/zh.md', 'store/ko.md', 'store/google-play.json', 'store/review-notes.md'])
    for (const line of readFileSync(f, 'utf8').split('\n')) if (NOTHING_LEAVES.some(r => r.test(line))) said.push(`${f}: ${line.trim()}`);
  assert.deepEqual(said, []);
});
