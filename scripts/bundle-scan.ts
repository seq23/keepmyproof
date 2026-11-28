// What App Review gets is what everyone gets (Apple Guideline 5.6 rejection, 23 Nov 2026).
// Exports the real iOS and Android JS bundles (plain JS, no bytecode, store env: no EXPO_PUBLIC_KMP_ switch)
// and reads them as text:
//   - the iOS bundle has none of the Google Play review-code wording or URL, and none of the simulator
//     preview's sample vault, "Preview only" wording or 123456 hint;
//   - the Android bundle DOES have the review code (so the scan can see that kind of string at all), and
//     neither has the preview;
//   - the Android bundle calls preventScreenCaptureAsync (FLAG_SECURE: Recents shows a blank card, as in every
//     Play build up to versionCode 4) and the iOS bundle never does (Apple 5.6: screenshots work on iOS);
//   - both have the first screen's "Continue in English" in every language (the scan is reading the app, not
//     an empty or unreadable file).
// Exit 0 = clean, 1 = a NAMED STOP printed. Run: npm run bundle-scan (CI: .github/workflows/check.yml).
// --dir <path> scans an export already made (tests use it on a crafted bundle).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REVIEW_URL, reviewStrings } from '../src/billing/review.android';
import { SAMPLE_HINT, SKIP_LABEL, sampleVault } from '../src/preview';

// Metro's minifier writes non-ASCII as \xHH (Latin-1) or \uXXXX; look for the text in every form.
const esc = (s: string, latin1: boolean) => s.split('').map(c => {
  const n = c.charCodeAt(0);
  return n < 128 ? c : latin1 && n < 256 ? '\\x' + n.toString(16).padStart(2, '0') : '\\u' + n.toString(16).padStart(4, '0');
}).join('');
const forms = (s: string) => [s, esc(s, true), esc(s, false)].flatMap(f => [f, f.replace(/\\(x|u)([0-9a-f]+)/g, (_, k, h) => '\\' + k + h.toUpperCase())]);
// The longest stretch of a line between {placeholders} and quotes: what a minifier leaves intact.
const core = (s: string) => s.split(/\{[^}]+\}|['"‘’“”]/).map(x => x.trim()).sort((a, b) => b.length - a.length)[0]!;
const has = (text: string, s: string) => forms(core(s)).some(f => text.includes(f));

const REVIEW = [REVIEW_URL.replace(/^https:\/\//, ''), ...Object.values(reviewStrings).flat()];
const PREVIEW = [SKIP_LABEL, SAMPLE_HINT, ...sampleVault().map(d => d.title)];
// A call of the block, as Metro leaves it (`e.preventScreenCaptureAsync()`); the module's own definition is not a call.
const BLOCK_CALL = /[\w$]\.preventScreenCaptureAsync\(/;
const ALIVE = ['Continue in English', 'Continuar en español', '继续使用简体中文', '한국어로 계속하기'];

export function scan(bundles: Record<'ios' | 'android', string>): string[] {
  const out: string[] = [];
  for (const [platform, text] of Object.entries(bundles) as ['ios' | 'android', string][]) {
    if (text.length < 100_000) out.push(`BUNDLE_EMPTY ${platform}: ${text.length} bytes of JS`);
    for (const s of ALIVE) if (!has(text, s)) out.push(`BUNDLE_UNREADABLE ${platform}: "${s}" is not in the bundle`);
    for (const s of PREVIEW) if (has(text, s)) out.push(`PREVIEW_IN_STORE_BUNDLE ${platform}: "${core(s)}"`);
  }
  for (const s of REVIEW) if (has(bundles.ios, s)) out.push(`REVIEW_CODE_ON_IOS: "${core(s)}"`);
  if (BLOCK_CALL.test(bundles.ios)) out.push('CAPTURE_BLOCK_ON_IOS: the iOS bundle calls preventScreenCaptureAsync');
  if (!BLOCK_CALL.test(bundles.android)) out.push('CAPTURE_BLOCK_MISSING_ON_ANDROID: the Android bundle never calls preventScreenCaptureAsync, so Recents shows an open vault');
  for (const s of [REVIEW[0]!, reviewStrings.reviewLink[0]]) if (!has(bundles.android, s)) out.push(`REVIEW_CODE_MISSING_ON_ANDROID: "${core(s)}" (the scan would not see it on iOS either)`);
  return out;
}

function read(dir: string, platform: string) {
  const d = join(dir, '_expo/static/js', platform);
  if (!existsSync(d)) return '';
  return readdirSync(d).filter(f => f.endsWith('.js')).map(f => readFileSync(join(d, f), 'utf8')).join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const given = process.argv.indexOf('--dir');
  const dir = given > 0 ? process.argv[given + 1]! : mkdtempSync(join(tmpdir(), 'kmp-bundle-'));
  try {
    if (given < 0) {
      // A store build's env: no app switch at all (the release gate refuses one), RevenueCat keys irrelevant here.
      const env: NodeJS.ProcessEnv = { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' };
      for (const k of Object.keys(env)) if (k.startsWith('EXPO_PUBLIC_KMP_')) delete env[k];
      const r = spawnSync('npx', ['expo', 'export', '--platform', 'ios', '--platform', 'android', '--no-bytecode', '--output-dir', dir],
        { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      if (r.status !== 0) { console.log(`NAMED STOP [BUNDLE_EXPORT_FAILED] expo export exited ${r.status}\n${(r.stderr || r.stdout).slice(-2000)}`); process.exit(1); }
    }
    const out = scan({ ios: read(dir, 'ios'), android: read(dir, 'android') });
    if (out.length) { console.log('NAMED STOP [STORE_BUNDLE_DIFFERS]\n' + out.join('\n')); process.exit(1); }
    console.log(`bundle-scan: iOS has no review code, preview or capture block; Android has the review code and the capture block and no preview; ${REVIEW.length} review and ${PREVIEW.length} preview lines checked.`);
  } finally { if (given < 0) rmSync(dir, { recursive: true, force: true }); }
}
