// The device gate's host tool (scripts/device-gate/backup-tool.ts) must tell a faithful restore from a bad one,
// and the broken backups it makes must be ones the app refuses (Vault.restore), or the Simulator run proves nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phrase } from '../src/core/crypto';
import { Vault } from '../src/core/vault';
import { compare, summary, notFull } from '../scripts/device-gate/backup-tool';
import { MemoryStore, draft, random } from './helpers';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  const { DEVICE_CHECKS, SIMULATOR_CHECKS, PURCHASE_CHECK } = await import('../scripts/release-gate.mjs');
  const all = (over: Record<string, string> = {}) => ({ device: 'iPhone 17 Simulator, iOS-26-5', commit: 'abc', checks: Object.fromEntries(DEVICE_CHECKS.map((c: string) => [c, { result: over[c] ?? (c === 'app-switcher-preview-hidden' ? 'look' : 'pass'), evidence: 'e' }])) });
  const ok = record(all(), { run: 'r', version: '1.0', seen: 'blurred, no title readable' });
  assert.equal(Object.values(ok.checks).filter(Boolean).length, SIMULATOR_CHECKS.length);
  assert.equal(ok.checks[PURCHASE_CHECK], false, 'a Simulator run never records the store purchase');
  assert.throws(() => record(all(), { run: 'r', version: '1.0' }), /DEVICE_GATE_NOT_PASSED/, 'no look, no switcher pass');
  assert.throws(() => record(all({ 'full-disk-changes-nothing': 'fail' }), { run: 'r', version: '1.0', seen: 'x' }), /full-disk/);
  assert.throws(() => record(all({ 'old-data-upgraded': 'not-run' }), { run: 'r', version: '1.0', seen: 'x' }), /old-data/);
  const noDevice = all(); delete (noDevice as { device?: string }).device;
  assert.throws(() => record(noDevice, { run: 'r', version: '1.0', seen: 'x' }), /DEVICE_UNNAMED/);
});

test('the backup check needs the whole test vault: an empty or partial backup is not "full-test-vault-backed-up"', async () => {
  const words = phrase(random), dir = mkdtempSync(join(tmpdir(), 'gate-full-'));
  // The gate's vault: 2 files and 2 notes.
  const v = await vaultWith(2); await v.add(draft({ folder: 'private', title: 'second note' }), true);
  assert.deepEqual(notFull(summary(v.snapshot())), []);
  const full = join(dir, 'full.kmp'); writeFileSync(full, v.backup(recoveryKey(words)));
  const ok = tool('full', full, words);
  assert.equal(ok.code, 0, ok.out); assert.match(ok.out, /^\{"count":4,"files":2/);
  // Gate run 46112815437: adding papers failed, and an empty vault's backup was recorded as a pass.
  const empty = join(dir, 'empty.kmp'); writeFileSync(empty, (await vaultWith(0)).backup(recoveryKey(words)));
  const none = tool('full', empty, words);
  assert.equal(none.code, 1); assert.match(none.out, /NOT_FULL_TEST_VAULT: 1 items, not 4; 0 files, not 2/);
  assert.deepEqual(notFull({ count: 0, files: 0 }), ['0 items, not 4', '0 files, not 2']);
  assert.deepEqual(notFull({ count: 4, files: 1 }), ['1 files, not 2']);
  // run.sh uses it for the check.
  assert.match(readFileSync('scripts/device-gate/run.sh', 'utf8'), /S=\$\(tool full "\$W\/good\.kmp" "\$WORDS"\) && flow check-backup/);
});

// Every tap in a gate flow proves its effect (gate runs 46118560120, 46124321633, 46128557523: on the iOS 26
// Simulator a tap can be reported done and never reach the app, and the flows after it start on the wrong screen).
// A tap passes when it sits in a retry that checks a result after it (tap.yaml, tab.yaml, press.yaml and type.yaml
// are built this way), or when the comment right above it names where its effect is checked or says it only closes
// the keyboard. Returns "file:line" for each tap that does neither.
export function unprovenTaps(dir: string): string[] {
  const bad: string[] = [];
  const indent = (l: string) => l.length - l.trimStart().length;
  for (const f of readdirSync(dir).filter(n => n.endsWith('.yaml'))) {
    const lines = readFileSync(join(dir, f), 'utf8').split('\n');
    lines.forEach((l, i) => {
      if (!/^\s*-\s+tapOn:/.test(l)) return;
      let c = i - 1; const notes: string[] = [];
      while (c >= 0 && /^\s*#/.test(lines[c])) notes.push(lines[c--]);
      if (notes.some(n => /Closes the keyboard|Effect checked by|A system alert/.test(n))) return;
      for (let r = i - 1; r >= 0; r--) {
        const t = lines[r];
        if (!t.trim() || /^\s*#/.test(t) || indent(t) >= indent(l)) continue;
        if (!/^\s*-\s+retry:/.test(t)) continue;
        let end = r + 1;
        while (end < lines.length && (!lines[end].trim() || /^\s*#/.test(lines[end]) || indent(lines[end]) > indent(t))) end++;
        if (lines.slice(i + 1, end).some(x => /^\s*-\s+(extendedWaitUntil|assertVisible|scrollUntilVisible):/.test(x))) return;
      }
      bad.push(`${f}:${i + 1}`);
    });
  }
  return bad;
}

test('every tap in the gate flows is retried until its effect shows, or names where its effect is checked', () => {
  const dir = join(__dirname, '..', '.maestro', 'gate');
  assert.deepEqual(unprovenTaps(dir), []);
  // The check itself sees a bare tap: a copy of the flows with one added must fail.
  const copy = mkdtempSync(join(tmpdir(), 'gate-flows-'));
  for (const f of readdirSync(dir)) writeFileSync(join(copy, f), readFileSync(join(dir, f)));
  writeFileSync(join(copy, 'lock.yaml'), readFileSync(join(dir, 'lock.yaml'), 'utf8') + '- tapOn: "Lock my papers ›"\n');
  assert.deepEqual(unprovenTaps(copy), [`lock.yaml:${readFileSync(join(copy, 'lock.yaml'), 'utf8').split('\n').length - 1}`]);
});
