// The busy line ("Working…") is drawn before a job starts: a large restore decrypts on the JS thread, and a job
// started in the same turn as setBusy froze the screen on a half-pressed button with no "Working…" (device gate runs
// 46158994320 and 46163383574, group E, 60 MB restore).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterPaint } from '../src/core/paint';

const g = globalThis as { requestAnimationFrame?: (cb: () => void) => unknown };

test('afterPaint waits for the next frame and one task after it, never only a microtask', async () => {
  const frames: (() => void)[] = [];
  const before = g.requestAnimationFrame;
  g.requestAnimationFrame = cb => { frames.push(cb); return frames.length; };
  try {
    let done = false;
    const p = afterPaint().then(() => { done = true; });
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.equal(done, false, 'resolved before any frame was drawn');
    assert.equal(frames.length, 1, 'asked for one frame');
    frames[0]();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.equal(done, false, 'resolved inside the frame callback, before the frame was handed to the screen');
    await p;
    assert.equal(done, true);
  } finally { g.requestAnimationFrame = before; }
});

test('without requestAnimationFrame it still waits one task', async () => {
  const before = g.requestAnimationFrame; delete g.requestAnimationFrame;
  try {
    let done = false;
    const p = afterPaint().then(() => { done = true; });
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.equal(done, false);
    await p; assert.equal(done, true);
  } finally { g.requestAnimationFrame = before; }
});

test('run() sets the busy state, waits for the frame, and only then finishes fields and starts the job', () => {
  const src = readFileSync('app/index.tsx', 'utf8');
  const body = src.slice(src.indexOf('async function run('), src.indexOf('const doRun ='));
  const at = (s: string) => { const i = body.indexOf(s); assert.ok(i >= 0, `run() has no ${s}`); return i; };
  assert.ok(at('setBusy(true)') < at('await afterPaint()'), 'the busy state is set before the wait');
  assert.ok(at('await afterPaint()') < at('await flushFields()'), 'the wait comes before the fields finish');
  assert.ok(at('await flushFields()') < at('await job()'), 'the job comes last');
});
