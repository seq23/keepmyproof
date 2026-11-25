// The build App Review gets passes the FULL release gate (Apple 5.6 follow-up, 24 Nov 2026). Before, the gate
// treated eas.json "testflight" as a tester build "never sent for review", but iOS has no tester-only binary:
// ios-store-build.yml builds testflight, and that upload is the one App Review gets. gateFor() now reads eas.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { gateFor, stops } from '../scripts/release-gate.mjs';

const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
const tracked = (...p: string[]) => execFileSync('git', ['ls-files', ...p], { encoding: 'utf8' }).split('\n').filter(Boolean);

test('every iOS store build gets the full gate; only the Android internal draft gets the tester gate', () => {
  assert.equal(gateFor({ profile: 'testflight', platform: 'ios', eas }), 'full');
  assert.equal(gateFor({ profile: 'production', platform: 'ios', eas }), 'full');
  assert.equal(gateFor({ profile: 'production', platform: 'android', eas }), 'full');
  assert.equal(gateFor({ profile: 'internal', platform: 'android', eas }), 'tester');
  // The internal profile built for iOS would be an App Store Connect upload too.
  assert.equal(gateFor({ profile: 'internal', platform: 'ios', eas }), 'full');
  assert.equal(gateFor({ profile: 'internal', platform: undefined, eas }), 'full');
  // Internal distribution never reaches a store.
  assert.equal(gateFor({ profile: 'development', platform: 'ios', eas }), 'none');
  assert.equal(gateFor({ profile: 'preview', platform: 'android', eas }), 'none');
  assert.equal(gateFor({ profile: undefined, platform: 'ios', eas }), 'none');
});

test('an unknown profile, a new store profile, or an unreadable eas.json gets the full gate, never a pass', () => {
  assert.equal(gateFor({ profile: 'appstore', platform: 'ios', eas }), 'full');
  assert.equal(gateFor({ profile: 'testflight', platform: 'ios', eas: null }), 'full');
  assert.equal(gateFor({ profile: 'testflight', platform: 'ios', eas: { build: 'x' } }), 'full');
  const added = { build: { ...eas.build, beta2: { extends: 'testflight' }, adhoc: { extends: 'production', distribution: 'internal' }, loop: { extends: 'loop' } } };
  assert.equal(gateFor({ profile: 'beta2', platform: 'ios', eas: added }), 'full');
  assert.equal(gateFor({ profile: 'adhoc', platform: 'ios', eas: added }), 'none');
  assert.equal(gateFor({ profile: 'loop', platform: 'ios', eas: added }), 'full');
});

test('the profile every iOS build workflow builds (the binary App Review gets) gets the full gate', () => {
  const ios = tracked('.github/workflows').map(f => [f, readFileSync(f, 'utf8')] as const).filter(([, s]) => /eas-cli[^\n]*\bbuild\b[^\n]*--platform ios/.test(s));
  assert.ok(ios.some(([f]) => f.endsWith('ios-store-build.yml')), 'no iOS store build workflow found: the check reads nothing');
  for (const [f, s] of ios) for (const [, profile] of s.matchAll(/--platform ios[^\n]*--profile\s+(\S+)/g)) {
    if (eas.build[profile!]?.ios?.simulator) continue;
    assert.equal(gateFor({ profile, platform: 'ios', eas }), 'full', `${f} builds ${profile} for App Store Connect without the full gate`);
  }
});

test('the real EAS hook on the testflight profile runs the full gate, not the tester gate', () => {
  const env = { ...process.env, EAS_BUILD_PROFILE: 'testflight', EAS_BUILD_PLATFORM: 'ios',
    EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY: 'appl_x', EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY: 'goog_x', EXPO_PUBLIC_KMP_PREVIEW: undefined, BOSS_OPEN_LOOPS_TOKEN: undefined } as NodeJS.ProcessEnv;
  const run = spawnSync(process.execPath, ['scripts/release-gate.mjs', '--if-store-build'], { env, encoding: 'utf8', timeout: 90_000 });
  const out = run.stdout + run.stderr;
  assert.match(out, /full gate for the testflight ios store build/, out);
  assert.doesNotMatch(out, /tester build/, out);
  // The full gate decides: exit 2 with a full-gate stop, or exit 0 only when it says the version is clear.
  if (run.status === 0) assert.match(out, /is clear for a store build/, out);
  else { assert.equal(run.status, 2, out); assert.match(out, /NAMED STOP \[(DEVICE_RELEASE_GATE_PENDING|PRICE_RECHECK_PENDING|PRICED_BELOW_INCUMBENT|LEGAL_URLS_UNREACHABLE|SUPPORT_ADDRESS_NOT_ON_DOMAIN|PHONE_WORDING)\]/, out); }
  // A preview build is not a store build.
  const preview = spawnSync(process.execPath, ['scripts/release-gate.mjs', '--if-store-build'], { env: { ...env, EAS_BUILD_PROFILE: 'preview' }, encoding: 'utf8' });
  assert.equal(preview.status, 0); assert.match(preview.stdout, /not a store build \(preview\)/);
});

test('a legal page that cannot be reached is "couldn\'t be checked", still a stop; a wrong status says its status', async () => {
  const base = { env: {}, version: '1.0', readJson: () => null, supportEmail: 'support@keepmyproof.com', mx: async () => 1, readText: () => '' };
  const down = (await stops({ ...base, probe: async () => 0 })).filter(s => s.code === 'LEGAL_URLS_UNREACHABLE');
  assert.equal(down.length, 2); for (const s of down) assert.match(s.why, /couldn't be checked \(no connection\)/);
  const gone = (await stops({ ...base, probe: async () => 404 })).filter(s => s.code === 'LEGAL_URLS_UNREACHABLE');
  assert.equal(gone.length, 2); for (const s of gone) assert.match(s.why, /answers 404, not 200/);
});
