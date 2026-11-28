// RELEASE GATE: the named stops that must clear before any build a store can review.
// Runs on the EAS builder through package.json "eas-build-pre-install" (before npm install, so plain
// Node only) and locally with `npm run release-gate`. Exit 2 + "NAMED STOP [CODE] …" lines = not ready.
// Which builds get it: gateFor() below, read from eas.json.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveMx } from 'node:dns/promises';
import { SITE } from '../site/config.mjs';
import { reportToOpenLoops } from './lib/open-loops.mjs';

// Spec "Release gate every version": each must be recorded true for this version. release/device-gate.json names
// the device it ran on: the Simulator run (.github/workflows/device-gate.yml, written by scripts/device-gate/record.mjs)
// or a real phone; her 13 Nov 2026 ruling asks for a real-phone check before a store submission.
const DAY = 86_400_000;
export const DEVICE_CHECKS = [
  'full-test-vault-backed-up', 'fresh-install-restore-with-phrase-only', 'every-file-hash-matches',
  'restore-twice-no-duplicates', 'old-data-upgraded', 'corrupt-or-missing-file-rejected', 'wrong-phrase-changes-nothing',
  'full-disk-changes-nothing', 'interrupted-restore-changes-nothing', 'passcode-reset-face-id-and-phrase',
  'app-switcher-preview-hidden', 'store-sandbox-purchase-and-restore',
];
// A Simulator cannot buy from the App Store (Apple sandbox sign-in fails on the iOS 26 Simulator), so this one check is
// met by a recorded TestFlight sandbox Buy + Restore on her own iPhone (her yes, 27 Nov 2026), written into
// release/device-gate.json by `record.mjs --purchase`. Uploading to TestFlight needs the other checks (that is where
// the buy happens); submitting for review needs all of them, with the purchase made on the very build submitted.
export const PURCHASE_CHECK = 'store-sandbox-purchase-and-restore';
export const SIMULATOR_CHECKS = DEVICE_CHECKS.filter(c => c !== PURCHASE_CHECK);
/** Why a purchase record does not count for submitting `build` ([] = it counts). */
export function purchaseProblems(purchase, { build, now = Date.now() } = {}) {
  const out = [];
  if (!purchase || typeof purchase !== 'object') return ['no TestFlight Buy + Restore is recorded'];
  if (!/^[1-9]\d*$/.test(String(purchase.build ?? ''))) out.push('the record names no build number');
  else if (String(purchase.build) !== String(build ?? '')) out.push(`the Buy + Restore was on build ${purchase.build}, not build ${build ?? '(none named)'}`);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(purchase.date ?? '')) ? Date.parse(`${purchase.date}T00:00:00Z`) : NaN;
  if (!Number.isFinite(day)) out.push('the record has no date (YYYY-MM-DD)');
  else if (day > now + DAY) out.push(`the record is dated ${purchase.date}, in the future`);
  if (typeof purchase.tappedBy !== 'string' || !purchase.tappedBy.trim()) out.push('the record does not say who tapped');
  if (purchase.restored !== true) out.push('Restore bringing Plus back is not recorded');
  return out;
}
export const LIST_LIFETIME_USD = 39.99;
export const LEGAL_URLS = ['https://keepmyproof.com/terms', 'https://keepmyproof.com/privacy'];
export const SUPPORT_DOMAIN = 'keepmyproof.com';

// Every stop this gate can raise, and its plain words on Boss OS's Open Loops list (boss-os docs/open-loops.md).
export const STOP_WORDS = {
  REVENUECAT_KEY_MISSING: { title: 'KeepMyProof: store keys and Plus products in RevenueCat', next_step: 'Set the App Store and Play keys and the Plus products in RevenueCat, then the store build can sell Plus.' },
  DEVICE_RELEASE_GATE_PENDING: { title: 'KeepMyProof: the device test', next_step: 'Run the device gate (Simulator) for this version and record it with scripts/device-gate/record.mjs.' },
  TESTFLIGHT_PURCHASE_UNRECORDED: { title: 'KeepMyProof: the TestFlight Buy + Restore', next_step: 'Buy Plus in the TestFlight build on her iPhone (sandbox), tap Restore, and record it with record.mjs --purchase before submitting.' },
  PRICE_RECHECK_PENDING: { title: "KeepMyProof: recheck the other app's lifetime price", next_step: "Recheck the other vault app's App Store lifetime price in launch week." },
  PRICED_BELOW_INCUMBENT: { title: 'KeepMyProof: our price is below the other app', next_step: 'Raise our lifetime price to at least theirs; never undercut it.' },
  LEGAL_URLS_UNREACHABLE: { title: 'KeepMyProof: terms and privacy pages answer', next_step: 'Make the terms and privacy pages on keepmyproof.com load again.' },
  PREVIEW_BUILD: { title: 'KeepMyProof: a store build had a preview or review switch on', next_step: 'Remove every EXPO_PUBLIC_KMP_ variable except the two RevenueCat keys from the store build: the app App Review sees must be the app everyone gets.' },
  PHONE_WORDING: { title: 'KeepMyProof: app and App Store copy says phone', next_step: 'Reword the listed strings to device-neutral words (device, dispositivo, 设备, 기기): iPad users read them too.' },
  SUPPORT_ADDRESS_NOT_ON_DOMAIN: { title: 'KeepMyProof: support mailbox on keepmyproof.com', next_step: 'Set up free email forwarding on keepmyproof.com and point the support address at it.' },
};
export const OPEN_LOOPS = { repo: 'seq23/keepmyproof', business: 'spry', finish: 'KeepMyProof: live in both stores, selling' };
// The store keys are EAS secrets, so a run outside an EAS build cannot see them: it neither raises nor clears that stop.
// The upload stage (an EAS store build) does not judge the TestFlight purchase, so it neither raises nor clears that stop.
export const knownHere = (eas, stage = 'submit') => Object.keys(STOP_WORDS).filter(c => (eas || c !== 'REVENUECAT_KEY_MISSING') && (stage === 'submit' || c !== 'TESTFLIGHT_PURCHASE_UNRECORDED'));

// supportsTablet is on, so every string iOS can show is read on an iPad too: none may say "phone"
// (App Review re-review, 21 Nov 2026). "iPhone" is a product name and stays allowed. Strings only Android
// shows are listed by key here; the Play listing (store/google-play.json, store/play/) is Android-only.
// The only EXPO_PUBLIC_KMP_ variables a store build may carry. Any other one (the simulator preview's
// EXPO_PUBLIC_KMP_PREVIEW, or any future review or feature switch) would make the store build differ from what
// App Review sees, so it is refused (Apple Guideline 5.6, rejection of 23 Nov 2026).
export const STORE_ENV = ['EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY', 'EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY'];
export const switchesOn = (env) => Object.keys(env).filter(k => k.startsWith('EXPO_PUBLIC_KMP_') && !STORE_ENV.includes(k) && env[k] !== undefined && env[k] !== '').sort();
const switchWhy = (on) => `${on.join(', ')} ${on.length > 1 ? 'are' : 'is'} set; a store build carries only the RevenueCat keys, so the app App Review sees is the app everyone gets.`;

export const PHONE_WORDS = /\bphones?\b|teléfono|手机|휴대폰/i;
export const ANDROID_ONLY_KEYS = ['vaultLockAndroid', 'photoCopyAndroid'];
// App Store listing files, plus app.config.ts: its plugin permission prompts (photosPermission) show on iPad too.
export const IOS_STORE_FILES = ['store/en.md', 'store/es.md', 'store/zh.md', 'store/ko.md', 'app.config.ts'];
/** Every iOS-visible string (src/strings.ts entries, App Store listing files) that names a phone. */
export function phoneWording(stringsSource, storeFiles = {}) {
  const out = [];
  const entries = [...stringsSource.matchAll(/\n  "(\w+)": \[([\s\S]*?)\n  \]/g)];
  if (entries.length < 100) out.push(`src/strings.ts: only ${entries.length} entries read`);
  for (const [, key, body] of entries) {
    if (ANDROID_ONLY_KEYS.includes(key)) continue;
    for (const line of body.split('\n')) if (PHONE_WORDS.test(line)) out.push(`src/strings.ts ${key}: ${line.trim().slice(0, 80)}`);
  }
  for (const [file, text] of Object.entries(storeFiles))
    text.split('\n').forEach((line, i) => { if (PHONE_WORDS.test(line)) out.push(`${file}:${i + 1}: ${line.trim().slice(0, 80)}`); });
  return out;
}

/** Every stop that still applies, in order. `[]` = ready. stage 'upload' (an EAS store build, which goes to TestFlight)
 *  lets the TestFlight purchase check be pending; stage 'submit' (the default, and what `--submit <build>` runs before
 *  Submit for Review) needs it recorded on `build`, the build being submitted. */
export async function stops({ env, version, readJson, probe, supportEmail, mx, now = Date.now(), stage = 'submit', build, readText = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8') }) {
  if (stage !== 'submit' && stage !== 'upload') throw Error(`NAMED STOP [UNKNOWN_STAGE] ${stage}`);
  const out = [];
  const stop = (code, why) => out.push({ code, why });
  const wording = phoneWording(readText('src/strings.ts'), Object.fromEntries(IOS_STORE_FILES.map(f => [f, readText(f)])));
  if (wording.length) stop('PHONE_WORDING', `copy an iPad shows says phone: ${wording.slice(0, 5).join(' | ')}${wording.length > 5 ? ` (+${wording.length - 5} more)` : ''}.`);
  if (!env.EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY?.startsWith('appl_') || !env.EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY?.startsWith('goog_'))
    stop('REVENUECAT_KEY_MISSING', 'the App Store (appl_) and Play (goog_) RevenueCat keys are not set as EAS secrets, so the build could not sell Plus.');
  // The simulator preview's switch (sample vault) or any other app switch never ships to a store.
  const on = switchesOn(env);
  if (on.length) stop('PREVIEW_BUILD', switchWhy(on));
  const device = readJson('release/device-gate.json');
  const missing = SIMULATOR_CHECKS.filter(c => device?.checks?.[c] !== true);
  if (!device || device.version !== version || missing.length)
    stop('DEVICE_RELEASE_GATE_PENDING', `release/device-gate.json does not record a passing device test for ${version}${missing.length ? ` (missing: ${missing.join(', ')})` : ''}.`);
  if (stage === 'submit') {
    const why = purchaseProblems(device?.purchase, { build, now });
    if (device?.checks?.[PURCHASE_CHECK] !== true && !why.length) why.push(`${PURCHASE_CHECK} is not marked passed`);
    if (why.length) stop('TESTFLIGHT_PURCHASE_UNRECORDED', `release/device-gate.json: ${why.join('; ')}; submitting waits for her TestFlight Buy + Restore on the build being submitted.`);
  }
  const price = readJson('release/price-check.json');
  const checkedOn = Date.parse(price?.checkedOn ?? '');
  if (!Number.isFinite(checkedOn) || now - checkedOn > 7 * DAY || typeof price?.incumbentLifetimeUSD !== 'number')
    stop('PRICE_RECHECK_PENDING', "the incumbent app's App Store lifetime price was not rechecked in the last 7 days (release/price-check.json).");
  else if (LIST_LIFETIME_USD < price.incumbentLifetimeUSD)
    stop('PRICED_BELOW_INCUMBENT', `our $${LIST_LIFETIME_USD} lifetime list price is below the incumbent's $${price.incumbentLifetimeUSD}; her ruling is never to undercut it.`);
  // No native-reader stop: the owner launched Spanish, Chinese and Korean without one (2 Nov 2026,
  // "we're gonna skip getting a native Reader and just go ahead and launch it"); topics.json language_status.
  for (const url of LEGAL_URLS) { const status = await probe(url); if (status !== 200)
    stop('LEGAL_URLS_UNREACHABLE', status ? `${url} answers ${status}, not 200; the app and store link to it.` : `${url} couldn't be checked (no connection), so it is not proven to answer; the app and store link to it.`); }
  // The store listing's support address must be the app's own and receive mail (live MX lookup).
  if (!supportEmail?.endsWith(`@${SUPPORT_DOMAIN}`) || (await mx(SUPPORT_DOMAIN)) < 1)
    stop('SUPPORT_ADDRESS_NOT_ON_DOMAIN', `site/config.mjs supportEmail (${supportEmail ?? 'unset'}) is not a mail-receiving @${SUPPORT_DOMAIN} address; set up Email Routing on ${SUPPORT_DOMAIN} (no cost) and point supportEmail at it.`);
  return out;
}

/** Which gate an EAS build gets: 'full' (stops() above), 'tester' (betaStops below) or 'none'.
 *  iOS has no tester-only binary: every store-distribution build is uploaded to App Store Connect, and the build
 *  App Review gets is one of them (ios-store-build.yml builds "testflight"; Apple's 5.6 rejection was of such a
 *  build). So every iOS store build, whatever its profile name, gets the full gate. The one tester build is
 *  Android "internal": a draft on Play's internal testing track (eas.json submit.internal), never in Play review.
 *  Builds for internal distribution (development, preview) never reach a store and get none. A profile eas.json
 *  does not name, or an eas.json that cannot be read, gets the full gate: an unknown build is never let through. */
export const BETA_PROFILES = { internal: 'android' };
export function gateFor({ profile, platform, eas }) {
  const profiles = eas?.build;
  if (!profile) return 'none';
  if (!profiles || typeof profiles !== 'object' || !profiles[profile]) return 'full';
  let distribution, seen = new Set();
  for (let p = profile; p && profiles[p] && !seen.has(p); p = profiles[p].extends) { seen.add(p); distribution ??= profiles[p].distribution; }
  if ((distribution ?? 'store') !== 'store') return 'none';
  return BETA_PROFILES[profile] && BETA_PROFILES[profile] === platform ? 'tester' : 'full';
}
const STORE_KEY = {
  ios: { name: 'EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY', prefix: 'appl_', why: 'the App Store (appl_) RevenueCat key is not set in the EAS production environment, so TestFlight could not test buying Plus.' },
  android: { name: 'EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY', prefix: 'goog_', why: 'the Play (goog_) RevenueCat key is not set in the EAS production environment, so the internal-track build could not test buying Plus.' },
};
export function betaStops({ env, platform = 'ios' }) {
  const out = [];
  const key = STORE_KEY[platform];
  if (!key) throw Error(`NAMED STOP [UNKNOWN_PLATFORM] no store key is known for ${platform}.`);
  if (!env[key.name]?.startsWith(key.prefix)) out.push({ code: 'REVENUECAT_KEY_MISSING', why: key.why });
  const on = switchesOn(env);
  if (on.length) out.push({ code: 'PREVIEW_BUILD', why: switchWhy(on) });
  return out;
}

const repo = (f) => new URL(`../${f}`, import.meta.url);
/** The live inputs every gate run reads, from the repo root whatever the working directory (Play's `send` runs from
 *  ~/GitHub/boss-os through vault:run): the app version, release/*.json, the legal pages (HEAD) and the support MX. */
export function gateDeps() {
  const version = /version:\s*'([^']+)'/.exec(readFileSync(repo('app.config.ts'), 'utf8'))?.[1];
  if (!version) throw Error('NAMED STOP [VERSION_UNREADABLE] app.config.ts has no version.');
  const readJson = path => existsSync(repo(path)) ? JSON.parse(readFileSync(repo(path), 'utf8')) : null;
  const probe = async url => { try { return (await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20_000) })).status; } catch { return 0; } };
  const mx = async domain => { try { return (await resolveMx(domain)).length; } catch { return 0; } };
  return { version, readJson, probe, mx, supportEmail: SITE.supportEmail };
}

async function main() {
  const report = process.argv.includes('--report');
  // --submit <build>: run before Submit for Review in App Store Connect, naming the TestFlight build being submitted.
  const s = process.argv.indexOf('--submit'), submitBuild = s > 0 ? process.argv[s + 1] : undefined;
  if (s > 0 && !/^[1-9]\d*$/.test(submitBuild ?? '')) throw Error('NAMED STOP [SUBMIT_BUILD_UNNAMED] usage: npm run submit-gate -- <build number being submitted>');
  let stage = 'submit';
  if (process.argv.includes('--if-store-build')) {
    const profile = process.env.EAS_BUILD_PROFILE, platform = process.env.EAS_BUILD_PLATFORM;
    const eas = (() => { try { return JSON.parse(readFileSync('eas.json', 'utf8')); } catch { return null; } })();
    const gate = gateFor({ profile, platform, eas });
    if (gate === 'none') { console.log(`release gate: not a store build (${profile ?? 'local'}); nothing a store can review is built.`); return; }
    if (gate === 'tester') {
      const found = betaStops({ env: process.env, platform });
      for (const s of found) console.log(`NAMED STOP [${s.code}] ${s.why}`);
      if (found.length) process.exitCode = 2; else console.log(`release gate: clear for the ${profile} tester build (Play internal track draft, not in review).`);
      return;
    }
    console.log(`release gate: full gate for the ${profile} ${platform ?? ''} store build (a store can review it); the TestFlight purchase check is judged at submit (npm run submit-gate).`);
    stage = 'upload';
  }
  const { version, readJson, probe, mx, supportEmail } = gateDeps();
  // Without --submit (the daily report, a plain local run) the record is judged on the build it names: is it there and whole.
  const build = submitBuild ?? readJson('release/device-gate.json')?.purchase?.build;
  const found = await stops({ env: process.env, version, readJson, probe, supportEmail, mx, stage, build });
  for (const s of found) console.log(`NAMED STOP [${s.code}] ${s.why}`);
  // Each stop is a row on Open Loops, closed by itself the day it clears (the daily report and every store build).
  const known = knownHere(Boolean(process.env.EAS_BUILD), stage);
  await reportToOpenLoops({ ...OPEN_LOOPS, known, stops: found.filter(s => known.includes(s.code)), words: STOP_WORDS });
  // --report (the daily workflow): the stops are the news, not a failure.
  if (found.length) { if (!report) process.exitCode = 2; return; }
  console.log(submitBuild ? `release gate: ${version} (${submitBuild}) is clear to submit for review.` : stage === 'upload' ? `release gate: ${version} is clear for a store build (TestFlight upload).` : `release gate: ${version} is clear for a store build.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e?.message ?? e); process.exitCode = 1; });
