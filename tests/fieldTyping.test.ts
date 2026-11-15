import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';
import ts from 'typescript';
import * as dates from '../src/core/dates';

// ApprovalPrep's sim retest (14 Nov 2026): fast typing on iOS lost letters, because a controlled `value` on a
// screen that redraws each key fights the native box on the new architecture. KeepMyProof's Field had the same
// shape, and its date box rewrote the text (adding slashes) on every key. These tests run the real <Field> from
// src/ui.tsx with a small hook runtime and a model of the phone's text box: the box holds its own text, every key
// reports the box's text, and a `value` the app sends to the box replaces what is in it (what a controlled box
// does). The parent re-renders late, the way a busy screen does, and Save reads whatever the parent last heard.
const TextInput = (props: any) => props;
const View = (props: any) => props;
function mountField() {
  let slots: any[] = []; let at = 0; let dirty = false; let effects: (() => void)[] = [];
  const hooks: any = {
    createContext: (v: unknown) => ({ v }), useContext: (c: { v: unknown }) => c.v,
    useRef: (init: unknown) => { const k = at++; return (slots[k] ??= { current: init }); },
    useState: (init: unknown) => {
      const k = at++; const slot = (slots[k] ??= { v: init });
      return [slot.v, (u: any) => { const v = typeof u === 'function' ? u(slot.v) : u; if (!Object.is(v, slot.v)) { slot.v = v; dirty = true; } }];
    },
    useEffect: (fn: () => void, deps: unknown[]) => {
      const k = at++; const prev = slots[k];
      if (!prev || deps.some((d, j) => !Object.is(d, prev.deps[j]))) { slots[k] = { deps }; effects.push(fn); }
    },
  };
  hooks.default = hooks;
  const js = ts.transpileModule(readFileSync('src/ui.tsx', 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const output = { exports: {} as any };
  const el = (type: any, props: any, key: any) => ({ type, props, key });
  new Script(`(function(require,module,exports){${js}\n})`).runInThisContext()((id: string) => {
    if (id === 'react') return hooks;
    if (id === 'react/jsx-runtime') return { jsx: el, jsxs: el };
    if (id === 'react-native') return { TextInput, View, Text: View, Pressable: View, StyleSheet: { create: (s: unknown) => s }, useColorScheme: () => 'light' };
    if (id === './core/dates') return dates;
    throw new Error(`unexpected import ${id}`);
  }, output, output.exports);
  const find = (node: any): any => !node || typeof node !== 'object' ? null : node.type === TextInput ? node : [node.props?.children].flat(9).map(find).find(Boolean) ?? null;
  // The phone's box: its own text, re-created (cursor reset) when the app gives it a new key.
  const phone = { text: '', key: undefined as unknown, props: {} as any, recreated: 0 };
  const render = (props: any) => {
    do {
      at = 0; dirty = false; effects = [];
      const input = find(output.exports.Field(props));
      if (input.key !== phone.key) { if (phone.key !== undefined) phone.recreated++; phone.key = input.key; phone.text = input.props.defaultValue ?? input.props.value ?? ''; }
      if (input.props.value !== undefined) phone.text = input.props.value;
      phone.props = input.props;
      for (const run of effects) run();
    } while (dirty);
  };
  return { render, phone };
}

/** A parent that saves each change and redraws its box `lag` keys late, then taps Save. */
function typeFast(words: string, opts: { lag?: number; dropAfter?: number; field?: Record<string, unknown> } = {}) {
  const { render, phone } = mountField();
  let heard = '';
  const history: string[] = [''];
  const props = (value: string) => ({ label: 'Answer', ...opts.field, value, onChange: (v: string) => { heard = v; history.push(v); } });
  render(props(''));
  let typingRecreates = 0;
  [...words].forEach((ch, n) => {
    phone.text += ch;
    if (opts.dropAfter === undefined || n < opts.dropAfter) phone.props.onChangeText(phone.text);
    const before = phone.recreated;
    render(props(history[Math.max(0, history.length - 1 - (opts.lag ?? 0))]));
    typingRecreates += phone.recreated - before;
  });
  return { get heard() { return heard; }, history, phone, render, props, typingRecreates,
    blur: () => { phone.props.onEndEditing?.({ nativeEvent: { text: phone.text } }); phone.props.onBlur?.({ nativeEvent: { text: phone.text } }); render(props(heard)); } };
}

test('fast typing with the screen redrawing a few keys late keeps every letter (item name, note, tags, recovery words)', () => {
  for (const words of ['Lease renewal letter, March 2026', 'Landlord texted about the leak again', 'rent, repairs, landlord', 'abandon ability able about above absent']) {
    for (const lag of [0, 1, 2, 3]) {
      const typed = typeFast(words, { lag, field: { multiline: true } });
      assert.equal(typed.phone.text, words, `the box shows what she typed (lag ${lag})`);
      assert.equal(typed.heard, words, `Save keeps "${words}" whole (lag ${lag})`);
      assert.equal(typed.typingRecreates, 0, 'the box is never rewritten while she types');
    }
  }
});

test('a fast-typed date gives 03/15/2026: no lost digits, and the box is never rewritten mid-typing', () => {
  for (const lag of [0, 1, 2, 3]) {
    const typed = typeFast('03152026', { lag, field: { keyboard: 'date' } });
    assert.equal(typed.heard, '03/15/2026', `Save reads the date with its slashes (lag ${lag})`);
    assert.equal(typed.typingRecreates, 0, `no cursor jumps while typing (lag ${lag})`);
    typed.blur();
    assert.equal(typed.phone.text, '03/15/2026', 'the slashes show once she leaves the box');
    assert.equal(typed.heard, '03/15/2026');
  }
  // Typed with her own slashes, or edited after the slashes went in, it reads the same.
  assert.equal(typeFast('03/15/2026', { lag: 2, field: { keyboard: 'date' } }).heard, '03/15/2026');
  const again = typeFast('0315', { field: { keyboard: 'date' } }); again.blur();
  assert.equal(again.phone.text, '03/15');
  for (const ch of '2026') { again.phone.text += ch; again.phone.props.onChangeText(again.phone.text); again.render(again.props(again.heard)); }
  assert.equal(again.heard, '03/15/2026');
});

test('a passcode typed fast keeps all six digits', () => {
  for (const lag of [0, 1, 2]) {
    const typed = typeFast('482913', { lag, field: { numeric: true, secret: true } });
    assert.equal(typed.heard, '482913', `lag ${lag}`);
  }
});

test('search hears every key as she types, so results update with each letter', () => {
  const typed = typeFast('leak', { lag: 0 });
  assert.deepEqual(typed.history, ['', 'l', 'le', 'lea', 'leak']);
});

test('a change the phone never reported is still saved when she leaves the box', () => {
  const typed = typeFast('Water damage photos', { dropAfter: 'Water'.length });
  assert.equal(typed.heard, 'Water');
  typed.blur();
  assert.equal(typed.heard, 'Water damage photos');
});

test('a real new value from the screen (a cleared box, a loaded item) still replaces the box', () => {
  const typed = typeFast('123456', { lag: 2, field: { numeric: true } });
  typed.render(typed.props(''));
  assert.equal(typed.phone.text, '');
  typed.render(typed.props('03/01/2026'));
  assert.equal(typed.phone.text, '03/01/2026');
});

test('no screen uses a bare TextInput, and Field never writes `value` into the phone box', () => {
  let checked = 0; const bare: string[] = [];
  const scan = (dir: string) => { for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) { scan(path); continue; }
    if (!/\.tsx?$/.test(e.name) || path === join('src', 'ui.tsx')) continue;
    checked++; if (/<TextInput\b/.test(readFileSync(path, 'utf8'))) bare.push(path);
  } };
  scan('app'); scan('src');
  assert.ok(checked > 20, `scanned ${checked} files`);
  assert.deepEqual(bare, []);
  const { render, phone } = mountField();
  render({ label: 'x', value: 'y', onChange: () => {} });
  assert.equal(phone.props.value, undefined);
  assert.equal(phone.props.defaultValue, 'y');
});
