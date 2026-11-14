import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppLock, createLock, type LockRecord, type LockStore } from '../src/core/lock';
import { b64, jsPbkdf2, LEGACY_ITERATIONS, passcodeHash, PASSCODE_ITERATIONS, phrase, setPbkdf2, unb64 } from '../src/core/crypto';
import { random } from './helpers';

const memory = (start: LockRecord) => { let r = start; const store: LockStore = { read: async () => structuredClone(r), write: async n => { r = n; } }; return { store, get: () => r }; };

test('PBKDF2 reference matches the RFC 7914 PBKDF2-HMAC-SHA256 vector (the native module is checked against it)', async () => {
  const out = await jsPbkdf2('passwd', b64(new TextEncoder().encode('salt')), 1);
  assert.equal(Buffer.from(unb64(out)).toString('hex'), '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc');
});

test('new passcodes use at least the OWASP 600,000 PBKDF2 rounds and go through the installed (native) deriver', async () => {
  const seen: number[] = [];
  setPbkdf2(async (c, s, n) => { seen.push(n); return jsPbkdf2(c, s, n); });
  try {
    const r = await createLock('182736', phrase(random), false, random);
    assert.ok(r.iterations! >= 600_000 && PASSCODE_ITERATIONS >= 600_000);
    assert.deepEqual(seen, [r.iterations]);
    assert.equal(r.verifier, await jsPbkdf2('182736', r.salt, r.iterations!));
    const m = memory(r); await new AppLock(m.store).unlock('182736');
    assert.deepEqual(seen, [r.iterations, r.iterations]);
  } finally { setPbkdf2(jsPbkdf2); }
});

test('a pre-6-Nov record (210,000 rounds, no count) still unlocks and is re-made at the current count; wrong code leaves it alone', async () => {
  const salt = b64(random(16));
  const legacy: LockRecord = { salt, verifier: await jsPbkdf2('182736', salt, LEGACY_ITERATIONS), attempts: 0, nextTry: 0, recovery: '', biometrics: false };
  const m = memory(legacy); let now = 0; const lock = new AppLock(m.store, () => now);
  await assert.rejects(lock.unlock('000000'), /PASSCODE_WRONG/);
  assert.equal(m.get().iterations, undefined); assert.equal(m.get().verifier, legacy.verifier);
  now = m.get().nextTry; await lock.unlock('182736');
  assert.equal(m.get().iterations, PASSCODE_ITERATIONS);
  assert.equal(m.get().verifier, await passcodeHash('182736', salt, PASSCODE_ITERATIONS));
  await lock.unlock('182736');
  await assert.rejects(lock.unlock('182737'), /PASSCODE_WRONG/);
});

test('a lock record claiming fewer rounds than the old floor is refused, never verified cheaply', async () => {
  const salt = b64(random(16));
  const weak: LockRecord = { salt, verifier: await jsPbkdf2('182736', salt, 1), iterations: 1, attempts: 0, nextTry: 0, recovery: '', biometrics: false };
  await assert.rejects(new AppLock(memory(weak).store).unlock('182736'), /KDF_TOO_WEAK/);
});
