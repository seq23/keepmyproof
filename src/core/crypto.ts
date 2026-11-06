import { gcm } from '@noble/ciphers/aes.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { base64, hex } from '@scure/base';
import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
export const utf8 = (s: string) => new TextEncoder().encode(s);
export const decode = (b: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(b);
export const b64 = (b: Uint8Array) => base64.encode(b);
export const unb64 = (s: string) => base64.decode(s);
export const hash = (b: Uint8Array) => hex.encode(sha256(b));
export type Random = (n: number) => Uint8Array;
export function phrase(random: Random): string { return entropyToMnemonic(random(16), wordlist); }
export function recoveryKey(words: string): Uint8Array {
  const normalized = words.trim().toLowerCase().split(/\s+/).join(' ');
  if (normalized.split(' ').length !== 12 || !validateMnemonic(normalized, wordlist)) throw Error('RECOVERY_INVALID');
  return hkdf(sha256, mnemonicToEntropy(normalized, wordlist), utf8('KeepMyProof recovery v1'), utf8('backup'), 32);
}
export function seal(data: Uint8Array, key: Uint8Array, purpose: string, random: Random): string {
  const nonce = random(12);
  return JSON.stringify({ v: 1, n: b64(nonce), c: b64(gcm(key, nonce, utf8(purpose)).encrypt(data)) });
}
export function open(data: string, key: Uint8Array, purpose: string): Uint8Array {
  const box = JSON.parse(data);
  if (box.v !== 1 || typeof box.n !== 'string' || typeof box.c !== 'string') throw Error('FORMAT_INVALID');
  const nonce = unb64(box.n);
  if (nonce.length !== 12) throw Error('FORMAT_INVALID');
  return gcm(key, nonce, utf8(purpose)).decrypt(unb64(box.c));
}
// PBKDF2-HMAC-SHA256 work factor. OWASP Password Storage Cheat Sheet (2023+): 600,000 iterations
// for PBKDF2-HMAC-SHA256. Records made before 6 Nov 2026 carry no count and used 210,000; they still
// verify and are re-hashed at the current count on the next correct unlock. Nothing below the old floor.
export const PASSCODE_ITERATIONS = 600_000;
export const LEGACY_ITERATIONS = 210_000;
/** Derives the 32-byte passcode verifier (base64). The app swaps in the phone's native PBKDF2 at start-up. */
export type Pbkdf2 = (code: string, salt: string, iterations: number) => Promise<string>;
export const jsPbkdf2: Pbkdf2 = async (code, salt, c) => b64(await pbkdf2Async(sha256, utf8(code), unb64(salt), { c, dkLen: 32 }));
let derive: Pbkdf2 = jsPbkdf2;
export function setPbkdf2(next: Pbkdf2) { derive = next; }
export async function passcodeHash(code: string, salt: string, iterations: number = PASSCODE_ITERATIONS): Promise<string> {
  if (!/^\d{6}$/.test(code)) throw Error('PASSCODE_INVALID');
  if (!Number.isInteger(iterations) || iterations < LEGACY_ITERATIONS) throw Error('KDF_TOO_WEAK');
  return derive(code, salt, iterations);
}
export function equal(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
