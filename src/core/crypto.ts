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
export async function passcodeHash(code: string, salt: string): Promise<string> {
  if (!/^\d{6}$/.test(code)) throw Error('PASSCODE_INVALID');
  return b64(await pbkdf2Async(sha256, utf8(code), unb64(salt), { c: 210_000, dkLen: 32 }));
}
export function equal(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
