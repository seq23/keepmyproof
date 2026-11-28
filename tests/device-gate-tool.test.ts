// The device gate's host side must tell a faithful backup from a bad one, make broken backups the app really refuses,
// and start every check from a vault the app's own code opens (scripts/device-gate/backup-tool.ts, vault-fixture.ts),
// or the Simulator run proves nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { phrase, recoveryKey, unb64, b64 } from '../src/core/crypto';
import { AppLock, type LockRecord } from '../src/core/lock';
import { Vault } from '../src/core/vault';
import { againstManifest, bigger, compare, CORRUPTIONS, corrupt, readBackup, summary } from '../scripts/device-gate/backup-tool';
import { KEYCHAIN, SCHEMA, makeFixture, type Manifest } from '../scripts/device-gate/vault-fixture';
import { MemoryStore, draft, random } from './helpers';

async function vaultWith(n: number) {
  const v = new Vault(new MemoryStore(), random(32), random); await v.load();
  for (let k = 0; k < n; k++) await v.add(draft({ folder: 'private', kind: 'file', title: `paper ${k}`, filename: `p${k}.pdf`, mime: 'application/pdf', bytes: b64(random(64)) }), true);
  await v.add(draft({ folder: 'private', title: 'a note' }), true);
  return v;
}

/** Opens a fixture the way the app does: the Keychain's key and lock record, the vault row in vault.sqlite. */
async function openFixture(dir: string) {
  const keychain = JSON.parse(readFileSync(join(dir, 'keychain.json'), 'utf8')) as Record<string, string>;
  const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as Manifest;
  const db = new DatabaseSync(join(dir, 'vault', 'vault.sqlite'));
  const row = db.prepare('SELECT ciphertext FROM vault WHERE id=1').get() as { ciphertext: string }; db.close();
  let lock = JSON.parse(keychain[KEYCHAIN.lock]!) as LockRecord;
  const appLock = new AppLock({ read: async () => lock, write: async r => { lock = r; } });
  await assert.rejects(() => appLock.unlock(m.code === '000000' ? '111111' : '000000'), 'a wrong passcode is refused');
  await appLock.unlock(m.code);
  assert.equal(lock.recovery, b64(recoveryKey(m.words)), 'the lock record holds the manifest\'s 12 words');
  const v = new Vault({ read: async () => row.ciphertext, write: async () => {} }, unb64(keychain[KEYCHAIN.key]!), random); await v.load();
  return { m, v };
}

test('the fixture is the app\'s own storage: same schema and Keychain names as src/native/storage.ts', () => {
  const storage = readFileSync('src/native/storage.ts', 'utf8');
  assert.ok(storage.includes(`'${SCHEMA}'`), 'vault-fixture.ts SCHEMA differs from the app\'s');
  assert.match(storage, new RegExp(`AUTH = '${KEYCHAIN.lock}', KEY = '${KEYCHAIN.key}'`));
});

test('a fixture made with this commit\'s core opens with its passcode and holds what its manifest says', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gate-fx-'));
  await makeFixture(dir);
  const { m, v } = await openFixture(dir);
  assert.equal(m.items.length, 4); assert.equal(m.items.filter(i => i.sha256).length, 2);
  assert.deepEqual(againstManifest(v.snapshot(), m), []);
});

test('the committed old-data fixture (b0531f3) opens with this commit\'s core, its passcode and its words', async () => {
  const { m, v } = await openFixture('scripts/device-gate/fixtures/old-b0531f3');
  assert.match(m.core, /^b0531f3/);
  assert.deepEqual(againstManifest(v.snapshot(), m), []);
});

test('againstManifest: an extra, missing or duplicated item, changed bytes or an empty manifest are differences', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gate-fx2-'));
  await makeFixture(dir);
  const { m, v } = await openFixture(dir), s = v.snapshot();
  assert.deepEqual(againstManifest(s, m), []);
  const fewer = v.snapshot(); fewer.items.pop(); assert.ok(againstManifest(fewer, m).some(d => d.includes('items, not')));
  const twice = v.snapshot(); twice.items.push(twice.items[0]!); assert.ok(againstManifest(twice, m).some(d => d.startsWith('2 items titled')));
  const changed = v.snapshot(); const f = changed.items.find(i => i.bytes)!; const b = unb64(f.bytes!); b[3] ^= 1; f.bytes = b64(b);
  assert.ok(againstManifest(changed, m).some(d => d.includes('file bytes sha256')), 'the hash is taken from the bytes, not the item\'s own field');
  assert.ok(againstManifest(s, { items: [] }).includes('empty manifest: nothing was compared'));
  assert.deepEqual(againstManifest(s, m, 1).length, 1, 'extra counts the items a check added');
});

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

test('every broken backup the tool makes is refused by the app, on a new vault and an existing one, changing nothing', async () => {
  const words = phrase(random), v = await vaultWith(2), good = v.backup(recoveryKey(words));
  for (const how of CORRUPTIONS) {
    const bad = corrupt(good, how, words);
    for (const target of [await vaultWith(0), v]) {
      const before = JSON.stringify(target.snapshot().items.map(i => i.id));
      await assert.rejects(() => target.restore(bad, words), Error, how);
      assert.equal(JSON.stringify(target.snapshot().items.map(i => i.id)), before, `${how} changed the vault`);
    }
    assert.throws(() => readBackup(bad, words), `${how}: the gate's own reader refuses it too`);
  }
  const big = bigger(good, 2, words);
  assert.equal(readBackup(big, words).items.length, v.snapshot().items.length + 2, 'bigger adds valid, hash-checked files');
});

test('the gate record is written only when every Simulator check and the store-build smoke check passed', async () => {
  const { record } = await import('../scripts/device-gate/record.mjs');
  const { DEVICE_CHECKS, SIMULATOR_CHECKS, PURCHASE_CHECK } = await import('../scripts/release-gate.mjs');
  const all = (over: Record<string, string> = {}) => ({ device: 'iPhone 17 Simulator, iOS-26-5', commit: 'abc',
    checks: Object.fromEntries([...DEVICE_CHECKS, 'store-build-smoke'].map((c: string) => [c, { result: over[c] ?? 'pass', evidence: 'e' }])) });
  const ok = record(all(), { run: 'r', version: '1.0' });
  assert.equal(Object.values(ok.checks).filter(Boolean).length, SIMULATOR_CHECKS.length);
  assert.equal(ok.checks[PURCHASE_CHECK], false, 'a Simulator run never records the store purchase');
  assert.throws(() => record(all({ 'app-switcher-preview-hidden': 'look' }), { run: 'r', version: '1.0' }), /DEVICE_GATE_NOT_PASSED/, 'a look is no pass');
  assert.throws(() => record(all({ 'store-build-smoke': 'not-run' }), { run: 'r', version: '1.0' }), /store-build-smoke/);
  assert.throws(() => record(all({ 'full-disk-changes-nothing': 'fail' }), { run: 'r', version: '1.0' }), /full-disk/);
  assert.throws(() => record(all({ 'old-data-upgraded': 'not-run' }), { run: 'r', version: '1.0' }), /old-data/);
  const noDevice = all(); delete (noDevice as { device?: string }).device;
  assert.throws(() => record(noDevice, { run: 'r', version: '1.0' }), /DEVICE_UNNAMED/);
});
