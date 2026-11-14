// Browser stand-in for storage.ts, used only by the free web preview (docs/preview.md). Nothing is
// kept: the vault, lock and settings live in this page's memory and are gone on reload. The phone
// builds never load this file (Metro picks *.web.ts only for the web export).
import { AppLock, createLock, type LockRecord, type LockStore } from '../core/lock';
import { b64, unb64, recoveryKey, type Random } from '../core/crypto';
import { Vault, type AtomicStore } from '../core/vault';
import { isLang, type Lang } from '../core/model';
import type { PrefStore } from '../core/original';
export const random: Random = n => globalThis.crypto.getRandomValues(new Uint8Array(n));
const kept = new Map<string, string>();
let ciphertext: string | null = null;
const store: AtomicStore = { read: async () => ciphertext, write: async c => { ciphertext = c; } };
export const langChoice = {
  read: async (): Promise<Lang | null> => { const v = kept.get('lang'); return isLang(v) ? v : null; },
  write: async (lang: Lang) => { kept.set('lang', lang); },
};
export const removePrefStore: PrefStore = { read: async () => kept.get('remove') ?? null, write: async v => { kept.set('remove', v); } };
export const locks: LockStore = {
  read: async () => { const raw = kept.get('lock'); if (!raw) throw Error('LOCK_MISSING'); return JSON.parse(raw) as LockRecord; },
  write: async value => { kept.set('lock', JSON.stringify(value)); },
};
export const appLock = new AppLock(locks);
export async function hasSetup() { return kept.has('lock'); }
// A browser has no Face ID: the preview answers yes so the screens after it can be seen.
export async function biometricCheck(_prompt: string): Promise<boolean> { return true; }
export async function setup(code: string, words: string, biometrics: boolean) {
  if (ciphertext || kept.has('lock')) throw Error('SETUP_EXISTS');
  const key = random(32);
  kept.set('key', b64(key));
  await locks.write(await createLock(code, words, biometrics, random));
  const vault = new Vault(store, key, random); await vault.load(); return vault;
}
export async function loadVault() {
  const encoded = kept.get('key'); if (!encoded) throw Error('DEVICE_KEY_MISSING');
  const vault = new Vault(store, unb64(encoded), random); await vault.load(); return vault;
}
export async function unlock(code: string) { await appLock.unlock(code); return loadVault(); }
export async function unlockBiometric(_prompt: string) {
  if (!(await locks.read()).biometrics) throw Error('BIOMETRIC_FAILED');
  return loadVault();
}
export async function setBiometrics(enabled: boolean, _prompt: string) { await locks.write({ ...(await locks.read()), biometrics: enabled }); }
export async function backupKey() { return unb64((await locks.read()).recovery); }
export async function adoptRecovery(words: string) { await locks.write({ ...(await locks.read()), recovery: b64(recoveryKey(words)) }); }
export async function cleanTemps() {}
export async function cleanStartupTemps() {}
