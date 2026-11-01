// RELEASE GATE: the named stops that must clear before a store (production) build.
// Runs on the EAS builder through package.json "eas-build-pre-install" (before npm install, so plain
// Node only) and locally with `npm run release-gate`. Exit 2 + "NAMED STOP [CODE] …" lines = not ready.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Spec "Release gate every version": each must be recorded true on a real device for this version.
export const DEVICE_CHECKS = [
  'full-test-vault-backed-up', 'fresh-install-restore-with-phrase-only', 'every-file-hash-matches',
  'restore-twice-no-duplicates', 'old-data-upgraded', 'corrupt-or-missing-file-rejected', 'wrong-phrase-changes-nothing',
  'full-disk-changes-nothing', 'interrupted-restore-changes-nothing', 'passcode-reset-face-id-and-phrase',
  'app-switcher-preview-hidden', 'store-sandbox-purchase-and-restore',
];
export const LIST_LIFETIME_USD = 39.99;
export const LEGAL_URLS = ['https://keepmyproof.com/terms', 'https://keepmyproof.com/privacy'];
const DAY = 86_400_000;

/** Every stop that still applies, in order. `[]` = ready to build for the stores. */
export async function stops({ env, version, readJson, probe, now = Date.now() }) {
  const out = [];
  const stop = (code, why) => out.push({ code, why });
  if (!env.EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY?.startsWith('appl_') || !env.EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY?.startsWith('goog_'))
    stop('REVENUECAT_KEY_MISSING', 'the App Store (appl_) and Play (goog_) RevenueCat keys are not set as EAS secrets, so the build could not sell Plus.');
  const device = readJson('release/device-gate.json');
  const missing = DEVICE_CHECKS.filter(c => device?.checks?.[c] !== true);
  if (!device || device.version !== version || missing.length)
    stop('DEVICE_RELEASE_GATE_PENDING', `release/device-gate.json does not record a passing device test for ${version}${missing.length ? ` (missing: ${missing.join(', ')})` : ''}.`);
  const price = readJson('release/price-check.json');
  const checkedOn = Date.parse(price?.checkedOn ?? '');
  if (!Number.isFinite(checkedOn) || now - checkedOn > 7 * DAY || typeof price?.incumbentLifetimeUSD !== 'number')
    stop('PRICE_RECHECK_PENDING', "the incumbent app's App Store lifetime price was not rechecked in the last 7 days (release/price-check.json).");
  else if (LIST_LIFETIME_USD < price.incumbentLifetimeUSD)
    stop('PRICED_BELOW_INCUMBENT', `our $${LIST_LIFETIME_USD} lifetime list price is below the incumbent's $${price.incumbentLifetimeUSD}; her ruling is never to undercut it.`);
  for (const url of LEGAL_URLS) if ((await probe(url)) !== 200)
    stop('LEGAL_URLS_UNREACHABLE', `${url} does not answer 200; the app and store link to it.`);
  return out;
}

async function main() {
  const production = process.env.EAS_BUILD_PROFILE === 'production';
  if (process.argv.includes('--if-production') && !production) {
    console.log(`release gate: not a store build (${process.env.EAS_BUILD_PROFILE ?? 'local'}); stops apply to production only.`);
    return;
  }
  const version = /version:\s*'([^']+)'/.exec(readFileSync('app.config.ts', 'utf8'))?.[1];
  if (!version) throw Error('NAMED STOP [VERSION_UNREADABLE] app.config.ts has no version.');
  const readJson = path => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  const probe = async url => { try { return (await fetch(url, { method: 'HEAD', redirect: 'follow' })).status; } catch { return 0; } };
  const found = await stops({ env: process.env, version, readJson, probe });
  for (const s of found) console.log(`NAMED STOP [${s.code}] ${s.why}`);
  if (found.length) { process.exitCode = 2; return; }
  console.log(`release gate: ${version} is clear for a store build.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
