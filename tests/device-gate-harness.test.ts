// The device gate's own logic (scripts/device-gate/ui.ts, checks.ts, gate.ts): a tap is made only where it reaches its
// target, Home's count is read only from the line the app writes, and a check's tries add up to pass only when the app
// never did the wrong thing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clear, elements, keyboard, type AxNode } from '../scripts/device-gate/ui';
import { parseCount } from '../scripts/device-gate/checks';
import { decide, type Attempt } from '../scripts/device-gate/gate';
import { copy } from '../src/strings';

// AXe's describe-ui shape: frames in points, the testID as AXUniqueId.
const frame = (b: string) => { const [x1, y1, x2, y2] = b.match(/-?\d+/g)!.map(Number) as [number, number, number, number]; return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }; };
const el = (id: string, bounds: string, more: Partial<AxNode> = {}): AxNode => ({ AXUniqueId: id, frame: frame(bounds), ...more });
// A phone 402 x 874 pt: the scroll view from y 60 to 772, the tab bar 782-830 (gate run 46163383574, group B).
const screen = (...kids: AxNode[]): AxNode => ({ type: 'Application', frame: frame('[0,0][402,874]'), children: [el('kmp-screen-settings', '[0,60][402,772]'), ...kids] });
const tabs = el('kmp-tabs', '[10,782][392,830]');

test('AXe\'s tree: ids, words, values and the keyboard are read; zero-size elements are dropped', () => {
  const els = elements([screen(el('kmp-passcode', '[16,300][386,348]', { type: 'SecureTextField', AXValue: '••••••' }),
    { type: 'Keyboard', frame: frame('[0,539][402,874]') }, el('kmp-gone', '[0,0][0,0]'),
    el('kmp-tick', '[16,400][386,440]', { AXLabel: 'Bank statement', AXValue: '1' }))]);
  assert.equal(els.find(e => e.id === 'kmp-passcode')?.value, '••••••');
  assert.equal(keyboard(els)?.y1, 539);
  assert.equal(els.some(e => e.id === 'kmp-gone'), false);
  const tick = els.find(e => e.id === 'kmp-tick'); assert.equal(tick?.text, 'Bank statement'); assert.equal(tick?.checked, true);
});

test('a target in plain view is tapped at its centre', () => {
  assert.deepEqual(clear(elements(screen(tabs, el('kmp-lockNow', '[16,300][386,348]'))), 'kmp-lockNow'), { ok: true, x: 201, y: 324 });
});

test('a row under the tab bar is not clear (gate run 46112815437: the Restore link at y 793-841 pressed the Backup tab)', () => {
  const r = clear(elements(screen(tabs, el('kmp-restore', '[16,793][386,841]'))), 'kmp-restore');
  assert.equal(r.ok, false); assert.equal(!r.ok && r.why, 'tabs');
  // The tab itself is inside the bar: clear.
  assert.equal(clear(elements(screen({ ...tabs, children: [el('kmp-tab-backup', '[140,786][262,826]')] })), 'kmp-tab-backup').ok, true);
});

test('a field under the Save bar or the keyboard is not clear; the Save button inside the bar is', () => {
  const footer = { ...el('kmp-footer', '[16,459][386,527]'), children: [el('kmp-save', '[16,469][386,517]')] };
  const kb = el('inputView', '[0,539][402,874]');
  const els = elements(screen(footer, kb, el('kmp-name', '[17,507][385,553]'), el('kmp-pick', '[16,200][386,248]')));
  assert.equal(keyboard(els)?.y1, 539);
  const name = clear(els, 'kmp-name'); assert.equal(!name.ok && name.why, 'footer');
  assert.deepEqual(clear(els, 'kmp-save'), { ok: true, x: 201, y: 493 });
  assert.equal(clear(els, 'kmp-pick').ok, true);
  const under = clear(elements(screen(kb, el('kmp-unlock', '[16,600][386,648]'))), 'kmp-unlock');
  assert.equal(!under.ok && under.why, 'keyboard');
  // Its centre clear but its bottom under the keyboard top: scrolled, not tapped half under.
  const edge = clear(elements(screen(kb, el('kmp-unlock', '[16,500][386,560]'))), 'kmp-unlock');
  assert.equal(edge.ok, false);
});

test('a target off the scroll view is scrolled to, and a missing one is never tapped', () => {
  const below = clear(elements(screen(el('kmp-lockNow', '[16,900][386,948]'))), 'kmp-lockNow');
  assert.equal(!below.ok && below.why, 'below');
  const above = clear(elements(screen(el('kmp-lockNow', '[16,10][386,58]'))), 'kmp-lockNow');
  assert.equal(!above.ok && above.why, 'above');
  assert.deepEqual(clear(elements(screen()), 'kmp-lockNow'), { ok: false, why: 'missing' });
});

test('Home\'s count is read only from the line the app writes', () => {
  const t = copy('en');
  assert.equal(parseCount(t('homeIntro', { n: 4 })), 4);
  assert.equal(parseCount(t('plusCount', { n: 34 })), 34);
  assert.equal(parseCount('Free plan: 4 of 25 items used'), null, 'a changed line is not guessed at');
  assert.equal(parseCount(t('homeIntro', { n: 'x' })), null);
});

const A = (result: Attempt['result'], why: string = result): Attempt => ({ result, why });
test('a check\'s tries: pass only with no app failure; a failure twice is a suspected app bug; not-run is never a pass', () => {
  assert.deepEqual(decide([A('pass', 'ok')]), { result: 'pass', why: 'ok' });
  assert.equal(decide([A('not-run'), A('pass')]).result, 'pass', 'a harness problem before a pass is not the app');
  assert.equal(decide([A('fail')]).result, 'again');
  const twice = decide([A('fail', 'count 3'), A('fail', 'count 3')]);
  assert.equal(twice.result, 'fail'); assert.match(twice.why, /^SUSPECTED APP BUG: failed twice the same way/);
  assert.match(decide([A('fail', 'a'), A('fail', 'b')]).why, /failed twice on a clean state: a \| b/);
  const unstable = decide([A('fail', 'count 3'), A('pass')]);
  assert.equal(unstable.result, 'fail'); assert.match(unstable.why, /unstable/);
  assert.equal(decide([A('not-run'), A('not-run')]).result, 'again');
  assert.equal(decide([A('not-run'), A('not-run'), A('not-run')]).result, 'not-run');
  assert.equal(decide([A('fail'), A('not-run'), A('not-run')]).result, 'fail');
  assert.equal(decide([]).result, 'again');
});
