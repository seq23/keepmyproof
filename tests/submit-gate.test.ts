// Her yes of 27 Nov 2026: the store purchase-and-restore check is met by her own TestFlight sandbox Buy + Restore on a
// real iPhone. So a TestFlight upload (the EAS store build, stage 'upload') may go with that one check pending, and
// Submit for Review (stage 'submit', `npm run submit-gate -- <build>`) is refused until it is recorded on that build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stops, DEVICE_CHECKS, SIMULATOR_CHECKS, PURCHASE_CHECK, knownHere } from '../scripts/release-gate.mjs';
import { record, recordPurchase } from '../scripts/device-gate/record.mjs';

const now = Date.parse('2026-11-28T12:00:00Z');
const result = (over: Record<string, string> = {}) => ({ device: 'iPhone 17 Simulator, iOS-26-5', commit: 'abc',
  checks: Object.fromEntries(DEVICE_CHECKS.map(c => [c, { result: over[c] ?? (c === 'app-switcher-preview-hidden' ? 'look' : c === PURCHASE_CHECK ? 'not-run' : 'pass'), evidence: 'e' }])) });
const simRecord = () => record(result(), { run: 'r', version: '1.0', seen: 'blank card, no title readable' });
const bought = (o: Record<string, unknown> = {}) => recordPurchase(simRecord(), { build: '8', date: '2026-11-28', by: 'owner', restored: true, version: '1.0', now, ...o });
const base = (device: unknown) => ({ env: { EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY: 'appl_x', EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY: 'goog_x' }, version: '1.0', now,
  readJson: (p: string) => p.includes('device') ? device : p.includes('price') ? { checkedOn: '2026-11-27', incumbentLifetimeUSD: 39.99 } : null,
  probe: async () => 200, supportEmail: 'support@keepmyproof.com', mx: async () => 1 });
const codes = async (device: unknown, o: Record<string, unknown> = {}) => (await stops({ ...base(device), ...o })).map(s => s.code);

test('a Simulator record without the purchase: the TestFlight upload is clear, submitting is refused', async () => {
  const sim = simRecord();
  assert.equal(sim.checks[PURCHASE_CHECK], false);
  assert.equal(SIMULATOR_CHECKS.length, DEVICE_CHECKS.length - 1);
  assert.deepEqual(await codes(sim, { stage: 'upload' }), []);
  assert.deepEqual(await codes(sim, { stage: 'submit', build: '8' }), ['TESTFLIGHT_PURCHASE_UNRECORDED']);
  // The default stage is the strict one: a caller that names no stage is judged as a submission.
  assert.deepEqual(await codes(sim, { build: '8' }), ['TESTFLIGHT_PURCHASE_UNRECORDED']);
});

test('the upload still needs every Simulator check: one missing stops it', async () => {
  for (const c of SIMULATOR_CHECKS) {
    const sim = simRecord(); sim.checks[c] = false;
    assert.deepEqual(await codes(sim, { stage: 'upload' }), ['DEVICE_RELEASE_GATE_PENDING'], c);
  }
  assert.deepEqual(await codes(null, { stage: 'upload' }), ['DEVICE_RELEASE_GATE_PENDING']);
  assert.deepEqual(await codes(simRecord(), { stage: 'upload', version: '1.1' }), ['DEVICE_RELEASE_GATE_PENDING']);
  await assert.rejects(() => stops({ ...base(simRecord()), stage: 'tester' }), /UNKNOWN_STAGE/);
});

test('submitting clears only with her Buy + Restore recorded on the very build submitted', async () => {
  assert.deepEqual(await codes(bought(), { build: '8' }), []);
  assert.deepEqual(await codes(bought(), { build: '9' }), ['TESTFLIGHT_PURCHASE_UNRECORDED'], 'a purchase on build 8 does not clear build 9');
  assert.deepEqual(await codes(bought(), {}), ['TESTFLIGHT_PURCHASE_UNRECORDED'], 'no build named is never clear');
  // A forged record: purchase block present but the check not marked, or the check marked with no purchase block.
  const unmarked = bought(); unmarked.checks[PURCHASE_CHECK] = false;
  assert.deepEqual(await codes(unmarked, { build: '8' }), ['TESTFLIGHT_PURCHASE_UNRECORDED']);
  const noBlock = { ...simRecord() } as Record<string, any>; noBlock.checks[PURCHASE_CHECK] = true;
  assert.deepEqual(await codes(noBlock, { build: '8' }), ['TESTFLIGHT_PURCHASE_UNRECORDED']);
  for (const [k, v] of [['restored', false], ['tappedBy', ' '], ['date', '28 Nov'], ['date', '2026-12-05'], ['build', '0']] as const) {
    const bad = bought(); (bad.purchase as Record<string, unknown>)[k] = v;
    assert.deepEqual(await codes(bad, { build: '8' }), ['TESTFLIGHT_PURCHASE_UNRECORDED'], `${k}=${v}`);
  }
  // A purchase never covers a missing Simulator check.
  const gap = bought(); gap.checks['wrong-phrase-changes-nothing'] = false;
  assert.deepEqual(await codes(gap, { build: '8' }), ['DEVICE_RELEASE_GATE_PENDING']);
});

test('the recorder refuses a purchase that is not whole, or one with no Simulator record under it', () => {
  assert.equal(bought().checks[PURCHASE_CHECK], true);
  assert.equal(bought().purchase.build, '8');
  for (const o of [{ restored: false }, { by: '' }, { date: '' }, { date: '2026-12-31' }, { build: undefined }, { build: 'eight' }])
    assert.throws(() => bought(o), /PURCHASE_NOT_RECORDED/, JSON.stringify(o));
  assert.throws(() => recordPurchase(null, { build: '8', date: '2026-11-28', by: 'owner', restored: true, version: '1.0', now }), /SIMULATOR_GATE_NOT_RECORDED/);
  assert.throws(() => recordPurchase(simRecord(), { build: '8', date: '2026-11-28', by: 'owner', restored: true, version: '1.1', now }), /SIMULATOR_GATE_NOT_RECORDED/);
  const half = simRecord(); half.checks['full-disk-changes-nothing'] = false;
  assert.throws(() => recordPurchase(half, { build: '8', date: '2026-11-28', by: 'owner', restored: true, version: '1.0', now }), /SIMULATOR_GATE_NOT_RECORDED/);
  // A Simulator run that "passed" the purchase check is never taken as her purchase.
  assert.equal(record(result({ [PURCHASE_CHECK]: 'pass' }), { run: 'r', version: '1.0', seen: 'x' }).checks[PURCHASE_CHECK], false);
});

test('the upload stage neither raises nor clears the purchase stop on Open Loops; the daily report does', () => {
  assert.ok(!knownHere(true, 'upload').includes('TESTFLIGHT_PURCHASE_UNRECORDED'));
  assert.ok(knownHere(false, 'submit').includes('TESTFLIGHT_PURCHASE_UNRECORDED'));
  assert.ok(knownHere(true, 'upload').includes('DEVICE_RELEASE_GATE_PENDING'));
});

// The real commands, on a copy of the repo's files with a Simulator-only record: the EAS hook on the testflight
// profile does not stop on the purchase, and `npm run submit-gate` does.
test('real path: the EAS TestFlight hook passes the purchase by; submit-gate refuses it, then clears on the right build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kmp-gate-'));
  for (const p of ['scripts', 'site', 'src', 'store', 'release', 'app.config.ts', 'eas.json', 'package.json']) cpSync(p, join(dir, p), { recursive: true });
  writeFileSync(join(dir, 'release/device-gate.json'), JSON.stringify(simRecord()));
  const env = { ...process.env, EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY: 'appl_x', EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY: 'goog_x', BOSS_OPEN_LOOPS_TOKEN: '' } as NodeJS.ProcessEnv;
  delete env.EXPO_PUBLIC_KMP_PREVIEW;
  const run = (args: string[], extra: Record<string, string> = {}) => { const r = spawnSync(process.execPath, ['scripts/release-gate.mjs', ...args], { cwd: dir, env: { ...env, ...extra }, encoding: 'utf8', timeout: 90_000 }); return { code: r.status, out: r.stdout + r.stderr }; };
  const upload = run(['--if-store-build'], { EAS_BUILD_PROFILE: 'testflight', EAS_BUILD_PLATFORM: 'ios' });
  assert.match(upload.out, /full gate for the testflight ios store build/);
  assert.doesNotMatch(upload.out, /TESTFLIGHT_PURCHASE_UNRECORDED|DEVICE_RELEASE_GATE_PENDING/, upload.out);
  const submit = run(['--submit', '8']);
  assert.equal(submit.code, 2, submit.out); assert.match(submit.out, /NAMED STOP \[TESTFLIGHT_PURCHASE_UNRECORDED\]/);
  const unnamed = run(['--submit']);
  assert.notEqual(unnamed.code, 0); assert.match(unnamed.out, /SUBMIT_BUILD_UNNAMED/);
  writeFileSync(join(dir, 'release/device-gate.json'), JSON.stringify(recordPurchase(simRecord(), { build: '8', date: '2026-11-28', by: 'owner', restored: true, version: '1.0' })));
  const after = run(['--submit', '8']);
  assert.doesNotMatch(after.out, /TESTFLIGHT_PURCHASE_UNRECORDED|DEVICE_RELEASE_GATE_PENDING/, after.out);
  assert.match(run(['--submit', '9']).out, /NAMED STOP \[TESTFLIGHT_PURCHASE_UNRECORDED\][^\n]*build 8, not build 9/);
  assert.equal(JSON.parse(readFileSync(join(dir, 'release/device-gate.json'), 'utf8')).purchase.build, '8');
});
