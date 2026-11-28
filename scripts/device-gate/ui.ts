// THE DEVICE GATE's eyes and finger (scripts/device-gate/checks.ts). Elements are found by their test id (app/index.tsx,
// src/ui.tsx: kmp-…), never by their words. Maestro's own "visible" counts an element inside the screen as visible even
// where the keyboard, the Save bar or the tab bar covers it (gate runs 46112815437, 46163383574: taps pressed a tab).
// So every tap here first reads the screen tree, makes the target's centre clear of the keyboard, the footer, the tab
// bar and the scroll view's edges (dismissing the keyboard or scrolling), checks it again, and taps that exact point.
// A target that cannot be made clear is a TestError (not-run), never an app failure.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { run, sleep, TestError, type Sim } from './sim';

export interface Node { attributes?: Record<string, string>; children?: Node[] }
export interface Box { x1: number; y1: number; x2: number; y2: number }
export interface El { id: string; text: string; box: Box; checked: boolean; enabled: boolean; value: string }

export function parseBounds(s: string | undefined): Box | null {
  const m = /^\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]$/.exec(s ?? '');
  if (!m) return null;
  const [x1, y1, x2, y2] = m.slice(1).map(Number) as [number, number, number, number];
  return x2 > x1 && y2 > y1 ? { x1, y1, x2, y2 } : null;
}
/** Every element with a size, in tree order. */
export function elements(root: Node): El[] {
  const out: El[] = [];
  const walk = (n: Node) => {
    const a = n.attributes ?? {}, box = parseBounds(a.bounds);
    if (box) out.push({ id: a['resource-id'] ?? '', text: a.text || a.accessibilityText || a.value || '', box, checked: a.checked === 'true',
      enabled: a.enabled !== 'false', value: a.value ?? '' });
    for (const c of n.children ?? []) walk(c);
  };
  walk(root); return out;
}
export const byId = (els: El[], id: string) => els.find(e => e.id === id);
export const center = (b: Box) => ({ x: Math.round((b.x1 + b.x2) / 2), y: Math.round((b.y1 + b.y2) / 2) });
const within = (a: Box, b: Box) => a.x1 >= b.x1 && a.x2 <= b.x2 && a.y1 >= b.y1 && a.y2 <= b.y2;
// The iOS keyboard as Maestro reports it (gate run 46163383574 hierarchies: inputView, SystemInputAssistantView).
const KEYBOARD = new Set(['inputView', 'SystemInputAssistantView', 'UIKeyboardLayoutStar Preview']);
export function keyboard(els: El[]): Box | null {
  const ks = els.filter(e => KEYBOARD.has(e.id)).map(e => e.box);
  return ks.length ? { x1: Math.min(...ks.map(b => b.x1)), y1: Math.min(...ks.map(b => b.y1)), x2: Math.max(...ks.map(b => b.x2)), y2: Math.max(...ks.map(b => b.y2)) } : null;
}
export const screenOf = (els: El[]) => els.find(e => e.id.startsWith('kmp-screen-'))?.id.slice('kmp-screen-'.length);

export type Clear = { ok: true; x: number; y: number } | { ok: false; why: 'missing' | 'keyboard' | 'tabs' | 'footer' | 'above' | 'below'; target?: Box; view?: Box };
/** Can a tap at the target's centre reach it? Not when any part of it lies under the footer (Save bar) or the tab bar
 *  it is not part of, under the keyboard, or outside the scroll view it lives in: it is scrolled clear first (a centre
 *  just clear of a bar was still pressed through it on the Simulator, gate run 46163383574). */
export function clear(els: El[], id: string): Clear {
  const t = byId(els, id);
  if (!t) return { ok: false, why: 'missing' };
  const c = center(t.box), kb = keyboard(els);
  for (const [bar, why] of [['kmp-tabs', 'tabs'], ['kmp-footer', 'footer']] as const) {
    const b = byId(els, bar)?.box;
    if (b && within(t.box, b)) return kb && overlaps(t.box, kb) ? { ok: false, why: 'keyboard', target: t.box } : { ok: true, ...c };
    if (b && overlaps(t.box, b)) return { ok: false, why, target: t.box };
  }
  if (kb && overlaps(t.box, kb)) return { ok: false, why: 'keyboard', target: t.box };
  const view = els.find(e => e.id.startsWith('kmp-screen-'))?.box;
  if (view && !within(t.box, view)) return { ok: false, why: c.y < (view.y1 + view.y2) / 2 ? 'above' : 'below', target: t.box, view };
  return { ok: true, ...c };
}
const overlaps = (a: Box, b: Box) => Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 2 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 2;

const yamlString = (s: string) => JSON.stringify(s);
export class Ui {
  private n = 0;
  constructor(private sim: Sim, private dir: string, private log: (s: string) => void) { mkdirSync(dir, { recursive: true }); }
  /** The screen tree now (Maestro's hierarchy of the whole screen, system alerts included). */
  tree(): El[] {
    for (let k = 0; k < 3; k++) {
      const r = run('maestro', ['--device', this.sim.udid, 'hierarchy'], { timeout: 90_000 });
      const at = r.out.indexOf('{');
      if (r.status === 0 && at >= 0) { try { this.last = r.out.slice(at); return elements(JSON.parse(this.last)); } catch { /* retried */ } }
      this.log(`hierarchy read failed (${r.status}): ${(r.err || r.out).trim().slice(-300)}`);
    }
    throw new TestError('Maestro could not read the screen tree 3 times');
  }
  last = '';
  saveTree(file: string) { try { this.tree(); } catch { /* keep the last one read */ } writeFileSync(file, this.last || '{}'); }
  /** Runs Maestro commands (YAML list items) as one flow. */
  flow(name: string, commands: string): void {
    const file = join(this.dir, `${String(++this.n).padStart(3, '0')}-${name}.yaml`);
    writeFileSync(file, `appId: com.keepmyproof.app\n---\n${commands}`);
    const r = run('maestro', ['--device', this.sim.udid, 'test', file], { timeout: 180_000 });
    if (r.status !== 0) throw new TestError(`Maestro step ${name} failed: ${(r.out + r.err).trim().split('\n').slice(-6).join(' | ').slice(0, 400)}`);
  }
  tapPoint(x: number, y: number, name = 'tap') { this.flow(name, `- tapOn:\n    point: "${x},${y}"\n`); }
  private swipe(view: Box, dy: number) {
    // A slow drag in the scroll view's left margin (no button there), so the content moves by about dy, no fling.
    const x = view.x1 + 8, mid = Math.round((view.y1 + view.y2) / 2), half = Math.max(-((view.y2 - view.y1) / 2 - 20), Math.min((view.y2 - view.y1) / 2 - 20, dy / 2));
    this.flow('scroll', `- swipe:\n    start: "${x},${Math.round(mid + half)}"\n    end: "${x},${Math.round(mid - half)}"\n    duration: 1200\n- waitForAnimationToEnd:\n    timeout: 3000\n`);
  }
  /** Makes the element's centre clear (see clear()) and returns the point to tap. */
  clearPoint(id: string): { x: number; y: number } {
    let seen = '';
    for (let k = 0; k < 8; k++) {
      const els = this.tree(), c = clear(els, id);
      if (c.ok) return c;
      seen += ` ${c.why}`;
      const view = els.find(e => e.id.startsWith('kmp-screen-'))?.box;
      if (c.why === 'keyboard') {
        // The keyboard is closed by a tap on the screen title (a plain text: the scroll view lets it close the keyboard).
        const h = byId(els, 'kmp-heading'), kb = keyboard(els);
        if (h && kb && center(h.box).y < kb.y1 && (!view || within(h.box, view))) { const p = center(h.box); this.tapPoint(p.x, p.y, 'close-keyboard'); }
        else if (view) this.swipe(view, -(view.y2 - view.y1));
        else throw new TestError(`${id}: under the keyboard, and no title to close it with`);
      } else if (!view) throw new TestError(`${id}: ${c.why}, and no scroll view to move it`);
      else if (c.why === 'missing') this.swipe(view, (view.y2 - view.y1) * 0.6);
      else {
        // Bring the target's centre to the middle of the part of the scroll view that is not covered.
        const bars = ['kmp-tabs', 'kmp-footer'].map(b => byId(els, b)?.box).filter((b): b is Box => !!b && b.y1 > view.y1);
        const kb = keyboard(els), bottom = Math.min(view.y2, ...bars.map(b => b.y1), kb ? kb.y1 : view.y2);
        this.swipe(view, center(c.target!).y - Math.round((view.y1 + bottom) / 2));
      }
    }
    throw new TestError(`${id}: could not be made clear to tap (${seen.trim()})`);
  }
  tap(id: string) { const p = this.clearPoint(id); this.log(`tap ${id} at ${p.x},${p.y}`); this.tapPoint(p.x, p.y, `tap-${id}`); }
  /** Types into a text box (found and made clear like a tap), then checks the box holds it. */
  type(id: string, text: string, secret = false) {
    const p = this.clearPoint(id), had = byId(this.tree(), id)?.value.length ?? 0; this.log(`type into ${id}`);
    // A box that already holds text (a refused passcode, a title the app filled in) is emptied first.
    this.flow(`type-${id}`, `- tapOn:\n    point: "${p.x},${p.y}"\n${had ? `- eraseText: ${had + 10}\n` : ''}- inputText: ${yamlString(text)}\n`);
    const got = this.waitFor(els => { const e = byId(els, id); return e && (secret ? e.value.replace(/[^•●]/g, '').length === text.length || e.value === text : e.value.trim() === text.trim()) ? e : undefined; }, 10_000, `${id} to hold what was typed`, false);
    if (!got) throw new TestError(`${id}: the box does not hold what was typed (it shows "${byId(this.tree(), id)?.value ?? '—'}")`);
  }
  /** Polls the screen until `pick` returns something; undefined after `ms` (or a TestError when `must`). */
  waitFor<T>(pick: (els: El[]) => T | undefined | false | null, ms: number, what: string, must = true): T | undefined {
    const end = Date.now() + ms;
    for (;;) {
      const v = pick(this.tree());
      if (v) return v;
      if (Date.now() > end) { if (must) throw new TestError(`waited ${Math.round(ms / 1000)} s for ${what}`); return undefined; }
      // eslint-disable-next-line no-await-in-loop
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
  }
  screen(): string | undefined { return screenOf(this.tree()); }
  text(id: string): string | undefined { return byId(this.tree(), id)?.text; }
}
export { sleep };
