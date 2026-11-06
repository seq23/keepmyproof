import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEARD, HEARD_SUBJECT, HEARD_WORDS, SUPPORT_EMAIL, heardMail, readHeard, saveHeard, sendHeard, type HeardAnswer, type HeardStore } from '../src/core/heard';

// The app makes no network call of its own here: any fetch during these flows fails the test.
function noFetch() {
  const calls: unknown[] = []; const real = globalThis.fetch;
  globalThis.fetch = (async (...a: unknown[]) => { calls.push(a); throw Error('NETWORK_CALL'); }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = real; } };
}
const memory = () => { let v: string | null = null; const store: HeardStore = { read: async () => v, write: async x => { v = x; } }; return { store, get: () => v }; };

test('choosing or skipping only saves on the phone: no mail opened, no fetch', async () => {
  const net = noFetch(), m = memory(), opened: string[] = [];
  try {
    assert.equal(await readHeard(m.store), null);
    for (const h of [...HEARD, 'skip'] as HeardAnswer[]) { await saveHeard(m.store, h); assert.equal(await readHeard(m.store), h); }
    await assert.rejects(saveHeard(m.store, 'tracking-id' as HeardAnswer), /HEARD_INVALID/);
    assert.deepEqual(opened, []); assert.deepEqual(net.calls, []);
  } finally { net.restore(); }
});

test('"Send my answer" hands the mail app one email to support whose body is the choice only; still no fetch', async () => {
  const net = noFetch();
  try {
    for (const h of HEARD) {
      const opened: string[] = [];
      assert.equal(await sendHeard(h, { canOpen: async () => true, open: async u => { opened.push(u); } }), true);
      assert.equal(opened.length, 1);
      const u = new URL(opened[0]!);
      assert.equal(u.protocol, 'mailto:'); assert.equal(u.pathname, SUPPORT_EMAIL);
      assert.deepEqual([...u.searchParams.keys()].sort(), ['body', 'subject']);
      assert.equal(u.searchParams.get('subject'), HEARD_SUBJECT);
      assert.equal(u.searchParams.get('body'), HEARD_WORDS[h]);
    }
    const none: string[] = [];
    assert.equal(await sendHeard('google', { canOpen: async () => false, open: async u => { none.push(u); } }), false);
    assert.deepEqual(none, []); assert.deepEqual(net.calls, []);
    assert.throws(() => heardMail('skip' as never), /HEARD_INVALID/);
  } finally { net.restore(); }
});
