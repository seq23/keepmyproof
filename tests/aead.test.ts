import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { base64 } from '@scure/base';
import { aead } from '../src/core/aead';
import { AEAD_CHECK } from '../src/core/aead-check';
import { open, seal, utf8, decode } from '../src/core/crypto';
import { random } from './helpers';

test('the native known answer is a real v1 box: the JS AES-GCM makes it and opens it, so native and JS boxes interchange', () => {
  const c = AEAD_CHECK, d = (s: string) => base64.decode(s);
  assert.equal(base64.encode(aead.encrypt(d(c.key), d(c.nonce), d(c.aad), d(c.data))), c.box);
  assert.equal(base64.encode(aead.decrypt(d(c.key), d(c.nonce), d(c.aad), d(c.box))), c.data);
  // The same bytes framed as a sealed record (what CryptoKit / javax.crypto produce) open through crypto.open.
  const record = JSON.stringify({ v: 1, n: c.nonce, c: c.box });
  assert.equal(base64.encode(open(record, d(c.key), decode(d(c.aad)))), c.data);
  assert.throws(() => open(record, d(c.key), 'other-purpose'));
  const key = random(32);
  assert.equal(decode(open(seal(utf8('round trip'), key, 'vault-v1', random), key, 'vault-v1')), 'round trip');
});

test('the phone builds never reach the @noble AES-GCM: only src/core/aead.ts imports it, and it has a .native twin', () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name); if (f.isDirectory()) walk(p); else if (/\.tsx?$/.test(f.name)) files.push(p); } };
  walk('src'); walk('app');
  assert.ok(files.length > 10, 'no app sources were read');
  const users = files.filter(f => /@noble\/ciphers/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(users, [join('src', 'core', 'aead.ts')]);
  assert.ok(existsSync('src/core/aead.native.ts'), 'Metro needs aead.native.ts to swap out the JS AES-GCM on iOS and Android');
  const native = readFileSync('src/core/aead.native.ts', 'utf8');
  assert.ok(!/@noble/.test(native) && /requireNativeModule/.test(native) && /AEAD_NATIVE_MISMATCH/.test(native));
  assert.ok(/AES\.GCM\.seal/.test(readFileSync('modules/kmp-kdf/ios/KmpKdfModule.swift', 'utf8')));
  assert.ok(/AES\/GCM\/NoPadding/.test(readFileSync('modules/kmp-kdf/android/src/main/java/expo/modules/kmpkdf/KmpKdfModule.kt', 'utf8')));
});
