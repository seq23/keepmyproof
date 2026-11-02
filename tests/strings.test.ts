import test from 'node:test';
import assert from 'node:assert/strict';
import { strings, copy, type StringKey } from '../src/strings';
import { LANGS, LOCALE, launchFolders, phoneLang, type Labels } from '../src/core/model';
import topics from '../topics.json';

const keys = Object.keys(strings) as StringKey[];
const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

test('every app string exists, non-empty, in every language, with the same {placeholders} as English', () => {
  assert.ok(keys.length > 100, `only ${keys.length} keys read`);
  const bad: string[] = [];
  for (const k of keys) {
    const row = strings[k] as readonly string[];
    if (row.length !== LANGS.length) { bad.push(`${k}: ${row.length} entries for ${LANGS.length} languages`); continue; }
    LANGS.forEach((l, i) => {
      if (typeof row[i] !== 'string' || !row[i]!.trim()) bad.push(`${k}.${l} missing`);
      else if (slots(row[i]!).join() !== slots(row[0]!).join()) bad.push(`${k}.${l} placeholders ${slots(row[i]!)} vs ${slots(row[0]!)}`);
    });
  }
  assert.deepEqual(bad, []);
});

test('each language reads its own entry, never another language', () => {
  for (const l of LANGS) {
    const t = copy(l), i = LANGS.indexOf(l);
    for (const k of keys) assert.equal(t(k), (strings[k] as readonly string[])[i]);
  }
  // Translated, not copied from English: the language-specific screens differ from English.
  for (const l of LANGS.filter(l => l !== 'en')) assert.notEqual(copy(l)('firstTitle'), copy('en')('firstTitle'), l);
  assert.equal(copy('ko')('itemsN', { n: 3 }).includes('3'), true);
  assert.throws(() => copy('fr' as never)('settings'), /LANG_UNKNOWN/);
});

test('every launch folder name and checklist line from topics.json exists in every language', () => {
  assert.equal(launchFolders.length, topics.launch_folder_count);
  assert.deepEqual([...topics.languages].sort(), [...LANGS].sort());
  const bad: string[] = [];
  for (const f of launchFolders) {
    for (const field of ['name', 'short_name', 'display_name'] as const)
      for (const l of LANGS) if (!((f[field] as Labels | undefined)?.[l] ?? '').trim()) bad.push(`${f.id}.${field}.${l}`);
    assert.ok(f.checklist_items?.length, f.id);
    for (const c of f.checklist_items ?? []) for (const l of LANGS) if (!((c.name as Labels)[l] ?? '').trim()) bad.push(`${f.id}/${c.id}.${l}`);
  }
  assert.deepEqual(bad, []);
  // The IEP folder explains the acronym in every language.
  const iep = launchFolders.find(f => f.id === 'iep-binder')!;
  for (const l of LANGS) assert.match((iep.display_name as Labels)[l], /IEP\s*[(（].+[)）]/, l);
});

test('the phone language picks the app language: any Chinese reads Simplified, unsupported reads English', () => {
  assert.equal(phoneLang({ languageCode: 'zh' }), 'zh');
  assert.equal(phoneLang({ languageCode: 'ko' }), 'ko');
  assert.equal(phoneLang({ languageCode: 'es' }), 'es');
  assert.equal(phoneLang({ languageCode: 'fr' }), 'en');
  assert.equal(phoneLang(undefined), 'en');
  for (const l of LANGS) assert.doesNotThrow(() => new Date(0).toLocaleString(LOCALE[l]));
});

// Rough rendered width in em: CJK and Hangul are full-width, Latin about half.
const em = (s: string) => [...s].reduce((w, ch) => w + (/[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(ch) ? 1 : /[A-Z@]/.test(ch) ? .7 : /\s/.test(ch) ? .3 : .56), 0);
test('nothing overflows on a 390pt-wide phone in any language', () => {
  const content = 390 - 2 * 16;                                  // styles.scroll padding
  const button = (w: number) => (w - 2 * 12 - 2) / 15;            // Button padding + border, 15pt text
  const fixed: [string, StringKey[], number][] = [
    ['bottom tabs (3 across)', ['folders', 'backup', 'settings'], button((390 - 2 * 10 - 2 * 6) / 3)],
    ['photo / file / note (3 across)', ['photo', 'file', 'note'], button((content - 2 * 8) / 3)],
    ['folder button "Open"', ['open'], 5],                        // leaves the folder name ≥ 180pt
  ];
  const bad: string[] = [];
  for (const l of LANGS) {
    const t = copy(l);
    for (const [where, ks, room] of fixed) for (const k of ks) if (em(t(k)) > room) bad.push(`${l} ${where}: "${t(k)}" ${em(t(k)).toFixed(1)}em > ${room.toFixed(1)}em`);
    // Home tiles: 3 across at 12pt, at most 3 lines, no word wider than the tile.
    const tile = (content * .31 - 12) / 12;
    for (const k of ['keepLetters', 'keepTexts', 'keepBills', 'keepPhotos', 'keepNotes', 'keepSchool'] as const) {
      const s = t(k), words = /[⺀-鿿]/.test(s) ? [...s] : s.split(/\s+/);
      if (em(s) > 3 * tile * .9 || words.some(w => em(w) > tile)) bad.push(`${l} tile ${k}: "${s}"`);
    }
    // Wrapped text: no single unbreakable word wider than the narrowest text column (a card inside the screen).
    const column = (content - 2 * 12 - 2) / 15;
    for (const k of keys) for (const w of t(k).split(/\s+/)) if (!/[⺀-鿿]/.test(w) && em(w) > column) bad.push(`${l} ${k}: word "${w}"`);
    for (const f of launchFolders) for (const w of (f.display_name as Labels)[l].split(/\s+/)) if (!/[⺀-鿿]/.test(w) && em(w) > column) bad.push(`${l} ${f.id}: word "${w}"`);
  }
  assert.deepEqual(bad, []);
});
