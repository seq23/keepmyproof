// The 17 findings from watching the tap-through videos (28 Nov 2026), before the App Store resubmission.
// Each test is red without its fix (PR "## Mutation proof").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy, koParticles, strings, type StringKey } from '../src/strings';
import { LANGS, LOCALE, appFolders, launchFolders, type Labels } from '../src/core/model';
import { vaultLines } from '../src/core/original';
import { stampDate } from '../src/core/dates';
import { BACK_NAME_MAX, backName, folderFoot, plusPage, upsell } from '../src/core/screens';

const app = readFileSync('app/index.tsx', 'utf8');
/** One screen's drawing code in app/index.tsx: from its `else if (screen === '<name>'…` to the next screen's. */
function screenOf(name: string): string {
  const start = app.search(new RegExp(`\\n  else if \\(screen === '${name}'[^)]*\\) (body =|\\{)`));
  assert.ok(start > 0, `screen ${name} not found`);
  const end = app.indexOf('\n  else ', start + 1);
  return app.slice(start, end);
}
const ANDROID_WORDS = /android|google|gallery|galería|图库|갤러리|fingerprint|huella|指纹|지문/i;

test('findings 3 and 9: iOS and the web preview never show Android or Google Photos wording; Android does', () => {
  for (const os of ['ios', 'web']) {
    const lines = vaultLines(os);
    for (const l of LANGS) {
      const t = copy(l);
      for (const key of [lines.lock, lines.photo]) {
        const said = t(key, { bio: t('bioFaceId') });
        assert.doesNotMatch(said, ANDROID_WORDS, `${os} ${l} ${key}: ${said}`);
      }
    }
    assert.notEqual(lines.settings, 'androidNote', `${os} shows the Google Photos card`);
  }
  assert.equal(vaultLines('android').settings, 'androidNote');
  assert.match(copy('en')(vaultLines('android').lock), /fingerprint/);
  // The web preview cannot remove an original, so it is not told it can.
  assert.doesNotMatch(copy('en')(vaultLines('web').photo), /remove/i);
  // The screens draw what vaultLines says: the copy follows the platform, and the Google Photos card is behind androidNote.
  assert.match(app, /vaultLines\(Platform\.OS\)/);
  const card = app.indexOf("t('androidOriginal')");
  assert.ok(card > 0 && app.lastIndexOf("vaultCopy.settings === 'androidNote'", card) > app.lastIndexOf('\n', card) - 400, 'the Google Photos card is drawn only under androidNote');
});

test('finding 10: Korean picks 로 or 으로 for the unlock it names, never "(으)로"', () => {
  const ko = copy('ko');
  assert.equal(ko('biometrics', { bio: ko('bioFaceId') }), 'Face ID로도 열기');
  assert.equal(ko('biometrics', { bio: ko('bioTouchId') }), 'Touch ID로도 열기');
  assert.equal(ko('biometrics', { bio: ko('bioFingerprint') }), '지문으로도 열기');
  assert.equal(ko('biometrics', { bio: ko('bioFace') }), '얼굴 인식으로도 열기');
  assert.equal(koParticles('서울(으)로'), '서울로', 'ㄹ takes 로');
  for (const bio of ['bioFaceId', 'bioTouchId', 'bioFingerprint', 'bioFace'] as const)
    for (const k of Object.keys(strings) as StringKey[]) assert.doesNotMatch(ko(k, { bio: ko(bio) }), /\(으\)/, `${k} with ${bio}`);
  // Other languages are untouched.
  assert.equal(copy('en')('biometrics', { bio: 'Face ID' }), 'Also open with Face ID');
});

test('finding 11: a saved date reads like a date stamp, with no seconds, in every language', () => {
  const at = '2026-11-28T22:56:03.000Z';
  for (const l of LANGS) {
    const s = stampDate(at, LOCALE[l]);
    assert.doesNotMatch(s, /\d{1,2}:\d{2}:\d{2}/, `${l}: ${s}`);
    assert.match(s, /2026/, l);
    assert.notEqual(s, new Date(at).toLocaleString(LOCALE[l]), `${l}: the old log-style date`);
  }
  assert.match(stampDate(at, 'en-US'), /^(Sat|Fri|Sun), Nov 2[789], 2026/);
  assert.throws(() => stampDate('not a date', 'en-US'), /invalidDate/);
  assert.match(app, /const displayDate = \(d: string \| null\) => d \? stampDate\(/, 'every saved / changed / backup date goes through stampDate');
});

test('finding 6: someone with Plus is never shown Buy, Subscribe, Restore or an upsell; without Plus they are', () => {
  for (const manage of [true, false]) {
    const member = plusPage(true, manage);
    assert.deepEqual([member.plans, member.restore, member.notNow], [false, false, false]);
    assert.equal(member.manage, manage, 'a subscriber can manage it');
    // Never bought, or lapsed (expired = no entitlement): the plans are shown.
    const free = plusPage(false, manage);
    assert.deepEqual([free.plans, free.restore, free.notNow, free.manage], [true, true, true, false]);
  }
  assert.equal(upsell(true), false);
  assert.equal(upsell(false), true);
  // Every Buy button and the Restore button are inside the page's own switches.
  const plus = screenOf('plus');
  assert.ok(plus.indexOf("buyLifetime") > plus.indexOf('{page.plans && '), 'Buy is drawn only when page.plans');
  assert.ok(plus.includes("{page.restore && btn('restorePurchases'"));
  assert.ok(plus.includes("{page.notNow && btn('notNow'"));
  assert.equal((plus.match(/\{legal\}/g) ?? []).length, 1, 'Terms and Privacy once on the Plus page (finding 12)');
  assert.ok(plus.lastIndexOf("btn('notNow'") > plus.lastIndexOf('{legal}'), '"Not now" is last');
  // A Plus member with more than 25 items is not told they hit the free limit.
  assert.match(plus, /!ent\.plus && state\.items\.length >= FREE_LIMIT \? 'limitTitle'/);
  // The PDF screen's "With Plus you can also…" only without Plus.
  assert.match(app, /\{upsell\(ent\.plus\) && <><P muted>\{t\('plusPdf'\)\}/);
});

test('finding 1: Plus is reachable from Home, and "Make your own folder" is on Home', () => {
  const home = screenOf('home');
  assert.match(home, /upsell\(ent\.plus\) && btn\('seePlus', \(\) => navigate\('plus'\)/);
  assert.match(home, /title=\{t\('makeOwn'\)\}[\s\S]*?navigate\(ent\.plus \? 'custom' : 'plus'\)/);
});

test('finding 2: every Plus card names one thing the app has; the create screen promises only a folder', () => {
  const plus = screenOf('plus');
  for (const key of ['unlimited', 'plusFolders', 'plusTags', 'selectedPdf']) assert.ok(plus.includes(`t('${key}')`), key);
  // Tags are real: a Plus member types them on the add screen and filters a folder by them.
  assert.match(app, /ent\.plus \? <Field label=\{t\('tags'\)\}/);
  assert.match(app, /allTags\(folderItems\)\.length > 0 &&/);
  assert.match(app, /screen === 'custom'\) body = <><P heading>\{t\('makeOwn'\)\}/);
  assert.equal('custom' in strings, false, 'the old "Your own folders and tags" title is gone');
});

test('finding 5: a date box says one format, in its placeholder only', () => {
  for (const l of LANGS) for (const k of ['from', 'to', 'when'] as const)
    assert.doesNotMatch(copy(l)(k), /YYYY|AAAA|MM|DD/, `${l} ${k}: ${copy(l)(k)}`);
});

test('finding 7: hidden folders are switches under one heading that says where they went', () => {
  const settings = screenOf('settings');
  assert.match(settings, /t\('foldersOnHome'\)[\s\S]{0,80}t\('foldersOnHomeHint'\)[\s\S]{0,200}<Switch accessibilityLabel=\{folderName\(f\.id\)\} value=\{!state\.hidden\.includes\(f\.id\)\}/);
  assert.equal('hide' in strings, false, 'no row of identical "Hide folder" buttons');
});

test('finding 8: no app line says "a model"', () => {
  for (const k of Object.keys(strings) as StringKey[]) assert.doesNotMatch(copy('en')(k), /\ba model\b/i, k);
});

test('finding 13: the item page makes a PDF of that item, and the PDF header counts the ticked items', () => {
  const detail = screenOf('detail');
  assert.match(detail, /btn\('itemPdf', \(\) => \{[^}]*setSelected\(\[item\.id\]\)/);
  assert.doesNotMatch(detail, /'folderPdf'/);
  assert.match(app, /t\('pdfIntro',\{n:selected\.filter\(/);
  assert.match(copy('en')('pdfIntro', { n: 1, total: 3 }), /1 of 3/);
});

test('finding 14: only the legal folders mention a lawyer, and no Back button wraps', () => {
  const legal = ['divorce-prep', 'workplace-evidence', 'executor-papers', 'iep-binder'];
  for (const f of [...appFolders.map(f => f.id), 'own-folder-id'])
    for (const l of LANGS) {
      const said = copy(l)(folderFoot(f));
      if (legal.includes(f)) assert.equal(folderFoot(f), 'folderFoot');
      else assert.doesNotMatch(said, /lawyer|abogado|律师|변호사/, `${f} ${l}`);
    }
  for (const f of launchFolders) for (const l of LANGS) {
    const short = (f.short_name as Labels)[l], label = backName(short);
    if (label !== null) assert.ok([...label].length <= BACK_NAME_MAX, `${f.id} ${l}`);
  }
  assert.equal(backName('Divorce or custody'), 'Divorce or custody');
  assert.equal(backName('Divorce, custody or co-parenting log'), null, 'too long: plain Back');
  assert.match(app, /backName\(\(launchFolders\.find\(f => f\.id === folder\)\?\.short_name/);
});

test('finding 16: "Working…" floats in a fixed spot and is never in the page flow', () => {
  assert.doesNotMatch(app, /\{busy && screen !== 'add' && <P muted>/);
  assert.doesNotMatch(app, /\{dateErrorBySave\}\{busy && <P muted>/);
  assert.match(app, /\{busy && <View pointerEvents="none" style=\{\[styles\.busy,/);
  const ui = readFileSync('src/ui.tsx', 'utf8');
  assert.match(ui, /busy:\{ position:'absolute'/);
});

test('finding 17: the loss line says it plainly: if you lose the device and the words, no one can open it', () => {
  assert.match(copy('en')('loss'), /^If you lose this device and your 12 words, no one can open the backup, not even us\./);
});

test('finding 15: the web page paints the brand background before the app loads, light and dark', () => {
  const html = readFileSync('public/index.html', 'utf8');
  assert.match(html, /<meta name="color-scheme" content="light dark"/);
  assert.match(html, /html,\s*body\s*\{[^}]*background(-color)?:\s*#F3F4F1/i);
  assert.match(html, /@media \(prefers-color-scheme: dark\)\s*\{\s*html,\s*body\s*\{[^}]*background(-color)?:\s*#121615/i);
  assert.match(html, /<div id="root"><\/div>/);
});

test('finding 15: every screen and the font-loading moment paint the brand background, never the navigator\'s light grey', () => {
  const layout = readFileSync('app/_layout.tsx', 'utf8');
  assert.match(layout, /const palette = usePalette\(\)/);
  assert.match(layout, /<Stack screenOptions=\{\{[^}]*contentStyle:\{ backgroundColor:palette\.bg \}/);
  assert.doesNotMatch(layout, /return null/, 'a blank first frame shows the system colour');
});

test('finding 4: the preview shortcut comes after the real start, and only a preview build has it', () => {
  const first = screenOf('first');
  assert.ok(first.indexOf('preview.SKIP_LABEL') > first.indexOf('CONTINUE[l]'), 'Continue in English comes first');
  assert.match(app, /process\.env\.EXPO_PUBLIC_KMP_PREVIEW === '1' \? require\('\.\.\/src\/preview'\) : null/);
});
