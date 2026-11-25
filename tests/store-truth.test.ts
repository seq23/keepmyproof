// What App Review reads, and what an iPhone shows, matches the shipped build (follow-up to #76, the Apple 5.6
// resubmission, 24 Nov 2026). The folder counts come from the code (src/core/model.ts appFolders), never by
// hand; an iPhone screen or email never names Google Play (Apple 2.3.10); the notes name only the purchases
// the build sells today, at the site's list prices; and every file the Play answers cite exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { LANGS, PRIVATE_FOLDER, appFolders, launchFolders, type Lang } from '../src/core/model';
import { copy, strings, type StringKey } from '../src/strings';
import { annualTermsKey, storeName } from '../src/core/store';
import { HEARD, heardWords } from '../src/core/heard';
import { PRODUCT_IDS } from '../src/billing/provider';
import { folderCount } from '../site/lib/folders.mjs';
import { SITE } from '../site/config.mjs';
import play from '../store/google-play.json';

const read = (f: string) => readFileSync(f, 'utf8');
/** The part of a store note that is pasted to Apple: everything after the first "---" line. */
const pasted = (f: string) => { const parts = read(f).split(/^---$/m); assert.ok(parts.length > 1 && parts[1]!.trim().length > 200, `${f}: no pasted block`); return parts.slice(1).join('---'); };
const word = (lang: Lang, n: number) => folderCount(lang, false, n);
const ALL = appFolders.length, CHECKLIST = launchFolders.length;
const NUMBER_WORDS = Array.from({ length: 13 }, (_, n) => word('en', n));

test('review notes: Home\'s folder count, and how many have checklists, are the app\'s own', () => {
  assert.equal(ALL, CHECKLIST + 1, 'appFolders = the launch folders + Private');
  const notes = pasted('store/review-notes.md');
  const m = /Home shows (\w+) folders: (\w+) with suggested checklists, and (\w+)\./.exec(notes);
  assert.ok(m, 'the review notes no longer say how many folders Home shows');
  assert.equal(m[1], word('en', ALL), 'total folders on Home');
  assert.equal(m[2], word('en', CHECKLIST), 'folders with a checklist');
  assert.equal(m[3], PRIVATE_FOLDER.display_name.en);
  // No other folder count anywhere in what Apple reads.
  const counts = [...notes.matchAll(new RegExp(`\\b(${NUMBER_WORDS.join('|')}|\\d+) (?:[a-z-]+ )?folders\\b`, 'gi'))].map(x => x[1]!.toLowerCase());
  assert.deepEqual(counts, [word('en', ALL)]);
});

test('store listings: the checklist-folder count is the app\'s, and each names the Private folder', () => {
  const COUNT: Record<Lang, (w: string) => string> = {
    en: w => `${w} folders with suggested checklists`, es: w => `${w} carpetas con listas sugeridas`,
    zh: w => `用${w}个文件夹和建议清单`, ko: w => `추천 체크리스트가 있는 ${w} 개 폴더`,
  };
  for (const lang of LANGS) {
    const listing = read(`store/${lang}.md`).split(/^## /m)[0]!.replace(/\s*\n\s*/g, ' ');
    const full = (play.listings as Record<string, { full: string }>)[lang]!.full;
    for (const [name, text] of [[`store/${lang}.md`, listing], [`google-play.json ${lang}`, full]] as const) {
      assert.ok(text.includes(COUNT[lang](word(lang, CHECKLIST))), `${name}: does not say ${COUNT[lang](word(lang, CHECKLIST))}`);
      assert.ok(text.includes(PRIVATE_FOLDER.display_name[lang]), `${name}: does not name the ${PRIVATE_FOLDER.display_name[lang]} folder`);
    }
  }
  // The Play reviewer note counts every folder on Home.
  const answers = read('store/play-console-answers.md');
  assert.match(answers, new RegExp(`Free: ${word('en', ALL)} folders,`));
});

test('the Play answers cite only files that exist', () => {
  const tracked = new Set(execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n'));
  const cited = [...read('store/play-console-answers.md').matchAll(/`((?:src|app|site|scripts|store|tests|modules)\/[^`\s:]+)(?::[\d,-]+)?[^`]*`/g)].map(m => m[1]!);
  assert.ok(cited.length >= 5, `only ${cited.length} paths cited: the check is reading nothing`);
  const missing = [...new Set(cited)].filter(p => !tracked.has(p));
  assert.deepEqual(missing, []);
});

const OTHER_STORE = { ios: /Google Play|Play Store|Play 商店|Play 스토어|Android/, android: /App Store|iPhone|\biOS\b|Settings › your name|Ajustes › su nombre|“设置”|설정 › 내 이름/ } as const;

test('an iPhone never shows or emails Google Play; Android never shows the App Store (survey and Plus terms)', () => {
  for (const os of ['ios', 'android'] as const) {
    const store = storeName(os);
    for (const lang of LANGS) {
      const t = copy(lang);
      const shown = [t('heardStore', { store }), t(annualTermsKey(os)), t('storeLoading', { store })];
      for (const s of shown) {
        assert.doesNotMatch(s, OTHER_STORE[os], `${os} ${lang}: "${s}"`);
        assert.doesNotMatch(s, /\{\w+\}/, `${os} ${lang}: placeholder left in "${s}"`);
      }
      assert.ok(t('heardStore', { store }).includes(store), `${os} ${lang}: the survey names no store`);
    }
    for (const h of HEARD) assert.doesNotMatch(heardWords(h, store), OTHER_STORE[os], `${os} email for ${h}`);
    assert.ok(heardWords('store', store).includes(store));
  }
  assert.equal(storeName('web'), 'App Store');
  // The screen fills {store} from this phone's platform wherever it shows a survey answer, and picks the
  // yearly terms by platform (TypeScript already makes sendHeard take the store).
  const screen = read('app/index.tsx');
  const surveyLabels = [...screen.matchAll(/t\(HEARD_KEY\[[^\]]+\]([^)]*)\)/g)];
  assert.ok(surveyLabels.length >= 2, 'the survey labels moved: update this check');
  for (const m of surveyLabels) assert.match(m[1]!, /^, \{ store: storeName \}$/, `survey label without its store: ${m[0]}`);
  assert.match(screen, /const storeName = storeFor\(Platform\.OS\);/);
  assert.doesNotMatch(screen, /'annualTerms'/, 'the yearly terms are picked by annualTermsKey(Platform.OS)');
  assert.match(screen, /annualTermsKey\(Platform\.OS\)/);
  // Any app string that names Google Play or Android is an Android-only key, picked by platform.
  const keys = Object.keys(strings) as StringKey[];
  const named = keys.filter(k => (strings[k] as readonly string[]).some(s => OTHER_STORE.ios.test(s)));
  assert.ok(named.includes('annualTermsAndroid'), 'the scan reads nothing');
  assert.deepEqual(named.filter(k => !/android/i.test(k)), [], 'a string any iPhone may show names Google Play or Android');
});

test('Apple-facing notes name no other platform and only the purchases the build sells today, at list price', () => {
  for (const f of ['store/review-notes.md', 'store/resolution-reply.md']) {
    const text = pasted(f);
    assert.doesNotMatch(text, /Android|Google Play|Play Store/, `${f} tells Apple about another platform`);
    assert.doesNotMatch(text, /Vaultaire/i, f);
  }
  const notes = pasted('store/review-notes.md');
  const sold = [...PRODUCT_IDS.annual, ...PRODUCT_IDS.lifetime] as string[];
  const named = [...notes.matchAll(/\bkmp_[a-z_]+/g)].map(m => m[0]);
  assert.deepEqual([...new Set(named)].sort(), ['kmp_plus_annual', 'kmp_plus_lifetime']);
  for (const id of named) assert.ok(sold.includes(id), `${id} is not a product the default offering sells`);
  // Every price Apple reads is a list price; the launch-week price is not promised to App Review.
  const prices = [...notes.matchAll(/\$(\d+\.\d\d)/g)].map(m => m[1]!);
  assert.ok(prices.length >= 2, 'the notes name no prices');
  assert.deepEqual([...new Set(prices)].sort(), [SITE.prices.yearlyUSD, SITE.prices.lifetimeUSD].sort());
  assert.doesNotMatch(notes, /launch (price|week)/i);
});
