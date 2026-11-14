import { requireNativeModule } from 'expo';
import { base64 } from '@scure/base';
import { AEAD_CHECK } from './aead-check';
import type { Aead } from './aead';
export type { Aead } from './aead';
// The phone's own AES-256-GCM (modules/kmp-kdf: CryptoKit on iOS, javax.crypto on Android), so
// nothing outside the OS encrypts on a phone. Same v1 box as the JS version: 12-byte nonce,
// ciphertext || 16-byte tag, purpose as AAD. Proven against a fixed known answer before first use
// (NAMED STOP AEAD_NATIVE_MISMATCH); requireNativeModule throws at start-up if the module is missing.
const native = requireNativeModule<{
  aesGcmSeal(key: string, nonce: string, aad: string, data: string): string;
  aesGcmOpen(key: string, nonce: string, aad: string, box: string): string;
}>('KmpKdf');
let proven = false;
function prove() {
  if (proven) return;
  const c = AEAD_CHECK;
  if (native.aesGcmSeal(c.key, c.nonce, c.aad, c.data) !== c.box || native.aesGcmOpen(c.key, c.nonce, c.aad, c.box) !== c.data)
    throw Error('AEAD_NATIVE_MISMATCH');
  proven = true;
}
const e = (b: Uint8Array) => base64.encode(b), d = (s: string) => base64.decode(s);
export const aead: Aead = {
  encrypt: (key, nonce, aad, data) => { prove(); return d(native.aesGcmSeal(e(key), e(nonce), e(aad), e(data))); },
  decrypt: (key, nonce, aad, box) => { prove(); return d(native.aesGcmOpen(e(key), e(nonce), e(aad), e(box))); },
  encryptB64: (key, nonce, aad, data) => { prove(); return native.aesGcmSeal(e(key), e(nonce), e(aad), e(data)); },
  decryptB64: (key, nonce, aad, box) => { prove(); return d(native.aesGcmOpen(e(key), e(nonce), e(aad), box)); },
};
