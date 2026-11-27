// The device gate's host tool (scripts/device-gate/backup-tool.ts) must tell a faithful restore from a bad one,
// and the broken backups it makes must be ones the app refuses (Vault.restore), or the Simulator run proves nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phrase } from '../src/core/crypto';
import { Vault } from '../src/core/vault';
import { compare, summary } from '../scripts/device-gate/backup-tool';
import { MemoryStore, draft, random } from './helpers';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { b64, recoveryKey, decode, open } from '../src/core/crypto';
import { validate } from '../src/core/model';

async function vaultWith(n: number) {
  const v = new Vault(new MemoryStore(), random(32), random); await v.load();
  for (let k = 0; k < n; k++) await v.add(draft({ folder: 'private', kind: 'file', title: `paper ${k}`, filename: `p${k}.pdf`, mime: 'application/pdf', bytes: b64(random(64)) }), true);
  await v.add(draft({ folder: 'private', title: 'a note' }), true);
  return v;
}
const tool = (...args: string[]) => { try { return { out: execFileSync('npx', ['tsx', 'scripts/device-gate/backup-tool.ts', ...args], { encoding: 'utf8' }), code: 0 }; } catch (e) { return { out: String((e as { stdout?: string }).stdout ?? ''), code: (e as { status: number }).status }; } };

test('compare: same items and bytes pass; a missing item, changed bytes or an empty backup fail', async () => {
  const v = await vaultWith(2), s = v.snapshot();
  assert.deepEqual(compare(s, v.snapshot()), []);
  const fewer = v.snapshot(); fewer.items.pop();
  assert.ok(compare(s, fewer).some(d => d.startsWith('count')));
  const changed = v.snapshot(); const f = changed.items.find(i => i.bytes)!; f.bytes = b64(random(64));
  assert.ok(compare(s, changed).some(d => d.startsWith('bytes differ')));
  const none = v.snapshot(); none.items = [];
  assert.ok(compare(none, none).some(d => d.startsWith('empty backup')), 'an empty pair never counts as a match');
  assert.equal(summary(s).files, 2);
});

test('every broken backup the tool makes is refused by the app, and changes nothing in the vault', async () => {
  const words = phrase(random), v = await vaultWith(2), dir = mkdtempSync(join(tmpdir(), 'gate-'));
  const good = join(dir, 'good.kmp'); writeFileSync(good, v.backup(recoveryKey(words)));
  const target = await vaultWith(0), before = JSON.stringify(target.snapshot().items.map(i => i.id));
  for (const how of ['missing', 'changed', 'flipped', 'truncated']) {
    const bad = join(dir, `${how}.kmp`);
    assert.equal(tool('corrupt', good, bad, how, words).code, 0, how);
    const { readFileSync } = await import('node:fs');
    await assert.rejects(() => target.restore(readFileSync(bad, 'utf8'), words), Error, how);
    assert.equal(JSON.stringify(target.snapshot().items.map(i => i.id)), before, `${how} changed the vault`);
  }
  const big = join(dir, 'big.kmp'); assert.equal(tool('bigger', good, big, '2', words).code, 0);
  const { readFileSync } = await import('node:fs');
  const restored = validate(JSON.parse(decode(open(readFileSync(big, 'utf8'), recoveryKey(words), 'backup-v1'))));
  assert.equal(restored.items.length, v.snapshot().items.length + 2, 'bigger adds valid, hash-checked files');
  assert.equal(tool('compare', good, good, words).code, 0);
  assert.equal(tool('compare', good, big, words).code, 1);
});

test('the gate record is written only when every check passed, and the switcher only with a person\'s look', async () => {
  const { record } = await import('../scripts/device-gate/record.mjs');
  const { DEVICE_CHECKS } = await import('../scripts/release-gate.mjs');
  const all = (over: Record<string, string> = {}) => ({ device: 'iPhone 17 Simulator, iOS-26-5', commit: 'abc', checks: Object.fromEntries(DEVICE_CHECKS.map((c: string) => [c, { result: over[c] ?? (c === 'app-switcher-preview-hidden' ? 'look' : 'pass'), evidence: 'e' }])) });
  const ok = record(all(), { run: 'r', version: '1.0', seen: 'blurred, no title readable' });
  assert.equal(Object.values(ok.checks).filter(Boolean).length, DEVICE_CHECKS.length);
  assert.throws(() => record(all(), { run: 'r', version: '1.0' }), /DEVICE_GATE_NOT_PASSED/, 'no look, no switcher pass');
  assert.throws(() => record(all({ 'full-disk-changes-nothing': 'fail' }), { run: 'r', version: '1.0', seen: 'x' }), /full-disk/);
  assert.throws(() => record(all({ 'old-data-upgraded': 'not-run' }), { run: 'r', version: '1.0', seen: 'x' }), /old-data/);
  const noDevice = all(); delete (noDevice as { device?: string }).device;
  assert.throws(() => record(noDevice, { run: 'r', version: '1.0', seen: 'x' }), /DEVICE_UNNAMED/);
});
