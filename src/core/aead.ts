import { gcm } from '@noble/ciphers/aes.js';
// AES-256-GCM for the web preview and the Node tests only. On iOS and Android, Metro resolves
// ./aead.native.ts instead, so the phone builds encrypt with the OS (CryptoKit / javax.crypto) and
// never bundle this file (tests/aead.test.ts checks the import graph).
export type Aead = {
  encrypt(key: Uint8Array, nonce: Uint8Array, aad: Uint8Array, data: Uint8Array): Uint8Array;
  decrypt(key: Uint8Array, nonce: Uint8Array, aad: Uint8Array, box: Uint8Array): Uint8Array;
};
export const aead: Aead = {
  encrypt: (key, nonce, aad, data) => gcm(key, nonce, aad).encrypt(data),
  decrypt: (key, nonce, aad, box) => gcm(key, nonce, aad).decrypt(box),
};
