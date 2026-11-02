import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { intakePosts, reportToOpenLoops } from '../scripts/lib/open-loops.mjs';
import { STOP_WORDS, OPEN_LOOPS, knownHere } from '../scripts/release-gate.mjs';

test('a stop in force is upserted with its plain words; a known stop that cleared is posted cleared', () => {
  const posts = intakePosts({ ...OPEN_LOOPS, known: knownHere(false), stops: [{ code: 'SUPPORT_ADDRESS_NOT_ON_DOMAIN', why: 'x' }], words: STOP_WORDS });
  const open = posts.filter(p => !p.cleared), cleared = posts.filter(p => p.cleared).map(p => p.stop);
  assert.deepEqual(open.map(p => p.stop), ['SUPPORT_ADDRESS_NOT_ON_DOMAIN']);
  assert.equal(open[0]!.title, STOP_WORDS.SUPPORT_ADDRESS_NOT_ON_DOMAIN!.title);
  assert.equal(open[0]!.repo, 'seq23/keepmyproof');
  assert.ok(cleared.includes('DEVICE_RELEASE_GATE_PENDING'));
  // Outside an EAS build the store keys cannot be seen: that stop is neither raised nor cleared.
  assert.ok(!posts.some(p => p.stop === 'REVENUECAT_KEY_MISSING'));
  assert.ok(knownHere(true).includes('REVENUECAT_KEY_MISSING'));
});

test('every stop the gate can raise has words, so each one can be cleared', () => {
  const raised = new Set([...readFileSync('scripts/release-gate.mjs', 'utf8').matchAll(/stop\('([A-Z_]+)'/g)].map(m => m[1]));
  assert.ok(raised.size >= 5);
  for (const code of raised) assert.ok(STOP_WORDS[code!], code);
});

test('no token: nothing is sent; a refused post is counted, never thrown', async () => {
  let calls = 0;
  const fetchImpl = (async () => { calls++; return { ok: false, status: 401 }; }) as any;
  const opts = { ...OPEN_LOOPS, known: ['A_STOP'], stops: [], words: {} };
  assert.deepEqual(await reportToOpenLoops(opts, { token: '', fetchImpl, log: () => {} }), { sent: 0, failed: 0, skipped: 1 });
  assert.equal(calls, 0);
  assert.deepEqual(await reportToOpenLoops(opts, { token: 't', fetchImpl, log: () => {} }), { sent: 0, failed: 1, skipped: 0 });
});
