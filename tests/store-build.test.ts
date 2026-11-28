// The app App Review sees is the app everyone gets (Apple Guideline 5.6 rejection, 23 Nov 2026):
// no screenshot or screen-recording block in any iOS build (Android keeps FLAG_SECURE, as every Play build had), no build profile or workflow that changes the app for
// review, the Google Play review code only in Android files, the simulator preview's sample vault only behind
// its build-time switch, and no store or legal text that describes a build other than the shipped one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { REVIEW_URL, reviewStrings } from '../src/billing/review.android';
import { scan } from '../scripts/bundle-scan';

const tracked = (...paths: string[]) => execFileSync('git', ['ls-files', ...paths], { encoding: 'utf8' }).split('\n').filter(Boolean);
const APP_FILES = tracked('app', 'src', 'modules', 'app.config.ts', 'plugins').filter(f => /\.(tsx?|mjs|js|kt|java|swift|m|mm|xml|json|plist)$/.test(f));
const read = (f: string) => readFileSync(f, 'utf8');
const android = (f: string) => /\.android\.(ts|tsx)$/.test(f) || f.includes('/android/');

test('iOS never blocks screenshots or screen recording and keeps the app-switcher cover; Android hides an open vault from Recents', () => {
  assert.ok(APP_FILES.length > 30, `scanned ${APP_FILES.length} files`);
  const BLOCK = /preventScreenCapture|usePreventScreenCapture|addScreenshotListener|FLAG_SECURE|setSecure\(|windowSecure|isCaptured|capturedDidChange/;
  const found = APP_FILES.filter(f => !android(f) && BLOCK.test(read(f)));
  assert.deepEqual(found, [], `screen capture is blocked or watched outside Android files in: ${found.join(', ')}`);
  // iOS: the app-switcher snapshot is covered (not a capture block; screenshots still work).
  assert.match(read('src/native/screen.ts'), /Platform\.OS === 'ios' \? ScreenCapture\.enableAppSwitcherProtectionAsync\(1\)/);
  // Android (removed for every platform by #76, 24 Nov 2026; restored for Android only, review of #102): the window
  // is secure, so Recents shows a blank card, not the papers of an open vault.
  assert.match(read('src/native/screen.android.ts'), /^\s*return ScreenCapture\.preventScreenCaptureAsync\(\);$/m);
  // The app calls it once when it starts, through the platform-neutral path (Metro picks screen.android.ts on Android).
  const app = read('app/index.tsx');
  assert.match(app, /^import \{ guardScreen \} from '\.\.\/src\/native\/screen';$/m);
  assert.match(app, /^\s*void guardScreen\(\)\.catch\(/m);
  assert.doesNotMatch(app, /expo-screen-capture/, 'app/index.tsx calls the capture module directly, past the platform files');
  // No config plugin turns a block on natively for iOS either.
  assert.doesNotMatch(read('app.config.ts'), /screen-capture|FLAG_SECURE/);
});

test('no EAS profile or build workflow sets an app switch; there is no review or simulator store profile', () => {
  const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string>; ios?: { simulator?: boolean } }> };
  const names = Object.keys(eas.build);
  assert.ok(names.includes('production') && names.includes('testflight') && names.includes('internal'), names.join(','));
  for (const [name, p] of Object.entries(eas.build)) {
    const switches = Object.keys(p.env ?? {}).filter(k => k.startsWith('EXPO_PUBLIC_KMP_') && !/^EXPO_PUBLIC_KMP_REVENUECAT_(IOS|ANDROID)_KEY$/.test(k));
    assert.deepEqual(switches, [], `eas.json ${name} sets ${switches.join(', ')}`);
    assert.doesNotMatch(name, /\breview|record|simulator/i, `eas.json profile ${name}`);
    assert.notEqual(p.ios?.simulator, true, `eas.json ${name} builds for the simulator`);
  }
  // Every workflow that runs an EAS build: only the store profiles, and no app switch in its env.
  const builders = tracked('.github/workflows').filter(f => /eas-cli[^\n]*\bbuild\b/.test(read(f)));
  assert.ok(builders.includes('.github/workflows/ios-store-build.yml'), builders.join(','));
  for (const f of builders) {
    const s = read(f);
    for (const [, profile] of s.matchAll(/--profile\s+(\S+)/g)) assert.ok(['production', 'testflight', 'internal'].includes(profile!), `${f} builds profile ${profile}`);
    assert.doesNotMatch(s, /EXPO_PUBLIC_KMP_(?!REVENUECAT_)/, `${f} sets an app switch`);
  }
});

test('the Google Play review code lives only in Android files; iOS and the web get a stub with no code', () => {
  const words = [REVIEW_URL, '/api/review', ...Object.values(reviewStrings).map(l => l[0])];
  const leaks = APP_FILES.filter(f => !android(f)).flatMap(f => words.filter(w => read(f).includes(w)).map(w => `${f}: ${w}`));
  assert.deepEqual(leaks, []);
  assert.ok(read('src/billing/review.android.ts').includes(REVIEW_URL));
  // An import that names the .android file explicitly would bundle it on iOS too.
  const explicit = APP_FILES.filter(f => !android(f) && /from\s+['"][^'"]*\.android['"]|require\(['"][^'"]*\.android['"]\)/.test(read(f)));
  assert.deepEqual(explicit, []);
  const stub = read('src/billing/ReviewCode.tsx');
  assert.match(stub, /export function ReviewCode\([^)]*\): null \{ return null; \}/);
  assert.deepEqual(stub.split('\n').filter(l => /^import /.test(l) && !/^import type /.test(l)), [], 'the stub imports nothing at runtime');
  assert.match(read('app/index.tsx'), /from '\.\.\/src\/billing\/ReviewCode';/);
});

test('the preview sample vault is reachable only through its build-time switch', () => {
  const users = APP_FILES.filter(f => f !== 'src/preview.ts' && /['"](\.\.\/src|\.)\/preview['"]/.test(read(f)));
  assert.deepEqual(users, ['app/index.tsx']);
  const app = read('app/index.tsx');
  const refs = [...app.matchAll(/[^\n]*['"]\.\.\/src\/preview['"][^\n]*/g)].map(m => m[0]);
  assert.equal(refs.length, 1, refs.join('\n'));
  assert.match(refs[0]!, /^const preview: typeof import\('\.\.\/src\/preview'\) \| null = process\.env\.EXPO_PUBLIC_KMP_PREVIEW === '1' \? require\('\.\.\/src\/preview'\) : null;$/);
  assert.doesNotMatch(app, /from '\.\.\/src\/preview'/);
});

test('the bundle scan fails a bundle that carries the review code or the preview, and an empty one', () => {
  const alive = 'Continue in English Continuar en español 继续使用简体中文 한국어로 계속하기 '.padEnd(120_000, 'x');
  const andro = alive + ' "keepmyproof.com/api/review" "Have a review code?" guardScreen=function(){return e.preventScreenCaptureAsync()}';
  assert.deepEqual(scan({ ios: alive, android: andro }), []);
  assert.deepEqual(scan({ ios: alive + '"Have a review code?"', android: andro }), ['REVIEW_CODE_ON_IOS: "Have a review code?"']);
  assert.deepEqual(scan({ ios: alive + 'https://keepmyproof.com/api/review', android: andro }), ['REVIEW_CODE_ON_IOS: "keepmyproof.com/api/review"']);
  assert.deepEqual(scan({ ios: alive + '"\\xbfTiene un c\\xf3digo de revisi\\xf3n?"', android: andro }), ['REVIEW_CODE_ON_IOS: "¿Tiene un código de revisión?"']);
  assert.deepEqual(scan({ ios: alive + 'Preview only: the sample vault opens with 123456.', android: andro }), ['PREVIEW_IN_STORE_BUNDLE ios: "Preview only: the sample vault opens with 123456."']);
  assert.ok(scan({ ios: '', android: andro }).includes('BUNDLE_EMPTY ios: 0 bytes of JS'));
  assert.ok(scan({ ios: alive, android: alive }).some(s => s.startsWith('REVIEW_CODE_MISSING_ON_ANDROID')));
  // The capture block: on Android only. The module's own definition (`_e.preventScreenCaptureAsync=l`) is no call.
  assert.deepEqual(scan({ ios: alive + 'guardScreen=function(){return e.preventScreenCaptureAsync()}', android: andro }), ['CAPTURE_BLOCK_ON_IOS: the iOS bundle calls preventScreenCaptureAsync']);
  assert.deepEqual(scan({ ios: alive + ',_e.preventScreenCaptureAsync=l,', android: andro }), []);
  assert.deepEqual(scan({ ios: alive, android: andro.replace('e.preventScreenCaptureAsync()', 'Promise.resolve()') }), ['CAPTURE_BLOCK_MISSING_ON_ANDROID: the Android bundle never calls preventScreenCaptureAsync, so Recents shows an open vault']);
});

test('promise audit: no store, legal or doc line describes a preview, a purchase switch or a screenshot block', () => {
  const files = tracked('store', 'docs', 'site', 'README.md', 'AGENTS.md').filter(f => /\.(md|json|mjs|txt|html)$/.test(f));
  assert.ok(files.length > 20);
  const FALSE = /current preview|this preview cannot|preview cannot|If purchases are enabled|intended to cost|screenshot protection|screen-capture protection|turns screenshot|Si se habilitan las compras|versión de prueba no permite|Esta versión no acepta pagos|tendrá un precio|当前预览版|如果开启购买|计划价格|현재 미리보기|구매 기능이 켜지면|예정 가격|special (simulator )?build|REVIEW_RECORDING/i;
  const hits = files.flatMap(f => read(f).split('\n').map((l, i) => [f, i + 1, l] as const)).filter(([, , l]) => FALSE.test(l)).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 120)}`);
  assert.deepEqual(hits, []);
  // The notes for App Review exist and say the things Apple asked about, in the shipped build's terms.
  const notes = read('store/review-notes.md');
  for (const must of [/screen recording/i, /same build/i, /sandbox/i, /Plus/]) assert.match(notes, must);
  assert.doesNotMatch(notes, /Vaultaire/i);
});
