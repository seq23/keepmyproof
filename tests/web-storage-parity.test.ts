import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The free web preview (docs/preview.md) swaps src/native/storage.ts for storage.web.ts. An export the
// app uses that only the phone file has is `undefined` in the preview, and the screen fails there only:
// 14 Nov 2026, heardStore was missing and every choice on "How did you hear about KeepMyProof?" showed
// "That did not finish". tsc never sees it (it resolves storage.ts), so this test does.
const exportsOf = (file: string) => new Set([...readFileSync(new URL(`../src/native/${file}`, import.meta.url), 'utf8')
  .matchAll(/^export\s+(?:const|let|async\s+function|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]));

// What the app reads from storage (app/index.tsx: import * as device from '../src/native/storage').
const used = new Set([...readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8').matchAll(/\bdevice\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]));

test('the web preview storage exports everything the app reads from the phone storage', () => {
  const phone = exportsOf('storage.ts'), web = exportsOf('storage.web.ts');
  assert.ok(used.size >= 5, `found only ${used.size} device.* uses in app/index.tsx`);
  const unknown = [...used].filter(name => !phone.has(name));
  assert.deepEqual(unknown, [], `app reads device.${unknown.join(', device.')}, which storage.ts does not export (pattern drift)`);
  const missing = [...used].filter(name => !web.has(name));
  assert.deepEqual(missing, [], `storage.web.ts is missing: ${missing.join(', ')}`);
});
