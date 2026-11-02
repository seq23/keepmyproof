// RELEASE GATE: the named stops that must clear before a store (production) build.
// Runs on the EAS builder through package.json "eas-build-pre-install" (before npm install, so plain
// Node only) and locally with `npm run release-gate`. Exit 2 + "NAMED STOP [CODE] …" lines = not ready.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveMx } from 'node:dns/promises';
import { SITE } from '../site/config.mjs';
import { reportToOpenLoops } from './lib/open-loops.mjs';

// Spec "Release gate every version": each must be recorded true on a real device for this version.
export const DEVICE_CHECKS = [
  'full-test-vault-backed-up', 'fresh-install-restore-with-phrase-only', 'every-file-hash-matches',
  'restore-twice-no-duplicates', 'old-data-upgraded', 'corrupt-or-missing-file-rejected', 'wrong-phrase-changes-nothing',
  'full-disk-changes-nothing', 'interrupted-restore-changes-nothing', 'passcode-reset-face-id-and-phrase',
  'app-switcher-preview-hidden', 'store-sandbox-purchase-and-restore',
];
export const LIST_LIFETIME_USD = 39.99;
export const LEGAL_URLS = ['https://keepmyproof.com/terms', 'https://keepmyproof.com/privacy'];
export const SUPPORT_DOMAIN = 'keepmyproof.com';
const DAY = 86_400_000;

// Every stop this gate can raise, and its plain words on Boss OS's Open Loops list (boss-os docs/open-loops.md).
export const STOP_WORDS = {
  REVENUECAT_KEY_MISSING: { title: 'KeepMyProof: store keys and Plus products in RevenueCat', next_step: 'Set the App Store and Play keys and the Plus products in RevenueCat, then the store build can sell Plus.' },
  DEVICE_RELEASE_GATE_PENDING: { title: 'KeepMyProof: the real-phone test', next_step: 'Run every release check on a real phone for this version and record it.' },
  PRICE_RECHECK_PENDING: { title: "KeepMyProof: recheck the other app's lifetime price", next_step: "Recheck the other vault app's App Store lifetime price in launch week." },
  PRICED_BELOW_INCUMBENT: { title: 'KeepMyProof: our price is below the other app', next_step: 'Raise our lifetime price to at least theirs; never undercut it.' },
  LEGAL_URLS_UNREACHABLE: { title: 'KeepMyProof: terms and privacy pages answer', next_step: 'Make the terms and privacy pages on keepmyproof.com load again.' },
  SUPPORT_ADDRESS_NOT_ON_DOMAIN: { title: 'KeepMyProof: support mailbox on keepmyproof.com', next_step: 'Set up free email forwarding on keepmyproof.com and point the support address at it.' },
};
export const OPEN_LOOPS = { repo: 'seq23/keepmyproof', business: 'spry', finish: 'KeepMyProof: live in both stores, selling' };
// The store keys are EAS secrets, so a run outside an EAS build cannot see them: it neither raises nor clears that stop.
export const knownHere = (eas) => Object.keys(STOP_WORDS).filter(c => eas || c !== 'REVENUECAT_KEY_MISSING');

/** Every stop that still applies, in order. `[]` = ready to build for the stores. */
export async function stops({ env, version, readJson, probe, supportEmail, mx, now = Date.now() }) {
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
  // The store listing's support address must be the app's own and receive mail (live MX lookup).
  if (!supportEmail?.endsWith(`@${SUPPORT_DOMAIN}`) || (await mx(SUPPORT_DOMAIN)) < 1)
    stop('SUPPORT_ADDRESS_NOT_ON_DOMAIN', `site/config.mjs supportEmail (${supportEmail ?? 'unset'}) is not a mail-receiving @${SUPPORT_DOMAIN} address; set up Email Routing on ${SUPPORT_DOMAIN} (no cost) and point supportEmail at it.`);
  return out;
}

async function main() {
  const production = process.env.EAS_BUILD_PROFILE === 'production';
  const report = process.argv.includes('--report');
  if (process.argv.includes('--if-production') && !production) {
    console.log(`release gate: not a store build (${process.env.EAS_BUILD_PROFILE ?? 'local'}); stops apply to production only.`);
    return;
  }
  const version = /version:\s*'([^']+)'/.exec(readFileSync('app.config.ts', 'utf8'))?.[1];
  if (!version) throw Error('NAMED STOP [VERSION_UNREADABLE] app.config.ts has no version.');
  const readJson = path => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  const probe = async url => { try { return (await fetch(url, { method: 'HEAD', redirect: 'follow' })).status; } catch { return 0; } };
  const mx = async domain => { try { return (await resolveMx(domain)).length; } catch { return 0; } };
  const found = await stops({ env: process.env, version, readJson, probe, supportEmail: SITE.supportEmail, mx });
  for (const s of found) console.log(`NAMED STOP [${s.code}] ${s.why}`);
  // Each stop is a row on Open Loops, closed by itself the day it clears (the daily report and every store build).
  const known = knownHere(Boolean(process.env.EAS_BUILD));
  await reportToOpenLoops({ ...OPEN_LOOPS, known, stops: found.filter(s => known.includes(s.code)), words: STOP_WORDS });
  // --report (the daily workflow): the stops are the news, not a failure.
  if (found.length) { if (!report) process.exitCode = 2; return; }
  console.log(`release gate: ${version} is clear for a store build.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e?.message ?? e); process.exitCode = 1; });
