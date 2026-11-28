import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuth from 'expo-local-authentication';
import { File, Paths, Directory } from 'expo-file-system';
import { AppLock, createLock, type LockRecord, type LockStore } from '../core/lock';
import { b64, unb64, recoveryKey, setPbkdf2, type Random } from '../core/crypto';
import { phonePbkdf2 } from './kdf';
import { clearTemporary } from '../core/cleanup';
import { Vault, startInstall, type InstallStore } from '../core/vault';
import { isLang, type Lang } from '../core/model';
import type { PrefStore } from '../core/original';
import type { HeardStore } from '../core/heard';
import { Platform } from 'react-native';
import { keepOutOfBackup } from '../core/backup';
import { excludeFromBackup } from './backup';
setPbkdf2(phonePbkdf2);
// The device gate's seam (src/gate.ts): only the gate build bundles it; in every other build this folds to null.
const gate: typeof import('../gate') | null = process.env.EXPO_PUBLIC_KMP_GATE === '1' ? require('../gate') : null;
export const random: Random = n => Crypto.getRandomBytes(n);
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
// The launch clean-up (startup): a new install forgets what an earlier install left in the Keychain. Every
// Keychain write waits for it, so a language picked on the first screen is never wiped by it.
let launchDone: Promise<unknown> = Promise.resolve();
const write = async (key: string, value: string, opts = options) => { await launchDone; await SecureStore.setItemAsync(key, value, opts); };
const AUTH = 'kmp-lock-v1', KEY = 'kmp-key-v1', BIO = 'kmp-bio-v1', LANG = 'kmp-lang-v1', REMOVE = 'kmp-remove-original-v1', HEARD = 'kmp-heard-v1';
/** The language picked on the first screen or in Settings. null = follow the phone's language. */
export const langChoice = {
  read: async (): Promise<Lang | null> => { const v = await SecureStore.getItemAsync(LANG, options); return isLang(v) ? v : null; },
  write: async (lang: Lang) => { await write(LANG, lang); },
};
/** Settings: offer to remove the original from Photos after a photo import ('ask', the default, or 'never'). */
export const removePrefStore: PrefStore = {
  read: () => SecureStore.getItemAsync(REMOVE, options),
  write: async v => { await write(REMOVE, v); },
};
/** How the person found the app (src/core/heard.ts). Kept on this phone only. */
export const heardStore: HeardStore = {
  read: () => SecureStore.getItemAsync(HEARD, options),
  write: async v => { await write(HEARD, v); },
};
let db: SQLite.SQLiteDatabase | undefined;
export async function database(): Promise<InstallStore & { erase(): Promise<void> }> {
  if (!db) {
    const directory = new Directory(Paths.document, 'vault'); directory.create({ intermediates: true, idempotent: true });
    // Out of iCloud and computer backups before the first write (src/core/backup.ts). A flag that did not stick
    // is retried at the next launch; the vault still opens, because locking the person out of their own
    // papers over a backup flag would be worse than the encrypted file sitting in a backup.
    if (await keepOutOfBackup(Platform.OS, directory.uri, excludeFromBackup) === 'failed') console.warn('NAMED STOP [BACKUP_EXCLUDE_FAILED] vault folder not flagged; retrying at next launch');
    db = await SQLite.openDatabaseAsync('vault.sqlite', {}, directory.uri);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY CHECK(id=1), ciphertext TEXT NOT NULL); CREATE TABLE IF NOT EXISTS orphaned (archivedOn TEXT NOT NULL, ciphertext TEXT NOT NULL)');
  }
  const connection = db;
  return {
    read: async () => (await connection.getFirstAsync<{ ciphertext: string }>('SELECT ciphertext FROM vault WHERE id=1'))?.ciphertext ?? null,
    write: async ciphertext => { await connection.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync('INSERT INTO vault(id,ciphertext) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET ciphertext=excluded.ciphertext', ciphertext);
      // Gate build only: the place an interrupted save or restore is cut, written but not committed.
      if (gate) await gate.at('vault-write');
    }); },
    // Erase everything (Settings): the vault and any set-aside copy, then the file is rewritten so the
    // deleted pages are not left in it.
    erase: async () => {
      await connection.execAsync('DELETE FROM vault; DELETE FROM orphaned;');
      await connection.execAsync('VACUUM; PRAGMA wal_checkpoint(TRUNCATE);');
    },
    archive: async () => { await connection.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync("INSERT INTO orphaned(archivedOn,ciphertext) SELECT ?, ciphertext FROM vault WHERE id=1", new Date().toISOString());
      await tx.runAsync('DELETE FROM vault WHERE id=1');
    }); },
  };
}
export const locks: LockStore = {
  read: async () => { const raw = await SecureStore.getItemAsync(AUTH, options); if (!raw) throw Error('LOCK_MISSING'); return JSON.parse(raw) as LockRecord; },
  write: async value => { await SecureStore.setItemAsync(AUTH, JSON.stringify(value), options); },
};
export const appLock = new AppLock(locks);
const KEYS = [BIO, KEY, AUTH, HEARD, REMOVE, LANG];
async function forgetKeychain() { for (const k of KEYS) await SecureStore.deleteItemAsync(k, options); }
/** iOS keeps Keychain entries after the app is deleted, but deletes the app's own files. The vault file
 *  not being there yet means this is a new install: any passcode, key or setting left in the Keychain
 *  by an earlier install of the app is cleared and setup starts fresh (sim review 14 Nov 2026). */
export async function hasSetup() {
  const installed = new File(new Directory(Paths.document, 'vault'), 'vault.sqlite').exists;
  return startInstall({ installed, store: await database(), hasLock: async () => !!(await SecureStore.getItemAsync(AUTH, options)), forget: forgetKeychain });
}
/** Launch: fresh = no vault file on this phone, so there is nothing to open and the first screen can show at
 *  once; done = the clean-up and the install check (true when a vault is set up). Keychain writes wait for it. */
export function startup(): { fresh: boolean; done: Promise<boolean> } {
  const fresh = !new File(new Directory(Paths.document, 'vault'), 'vault.sqlite').exists;
  const done = (gate ? gate.beforeStart(options) : Promise.resolve()).then(cleanStartupTemps).then(hasSetup);
  launchDone = done.catch(() => {});
  return { fresh, done };
}
export async function biometricCheck(prompt: string): Promise<boolean> {
  if (!(await LocalAuth.hasHardwareAsync()) || !(await LocalAuth.isEnrolledAsync())) return false;
  const r = await LocalAuth.authenticateAsync({ promptMessage: prompt, disableDeviceFallback: true, biometricsSecurityLevel: 'strong' });
  return r.success;
}
export async function setup(code: string, words: string, biometrics: boolean) {
  await launchDone; const store = await database();
  if (await store.read() || await SecureStore.getItemAsync(AUTH, options)) throw Error('SETUP_EXISTS');
  const key = random(32); const lock = await createLock(code, words, biometrics, random);
  await SecureStore.setItemAsync(KEY, b64(key), options);
  if (biometrics) await SecureStore.setItemAsync(BIO, b64(key), { ...options, requireAuthentication: true });
  await locks.write(lock);
  const vault = new Vault(store, key, random); await vault.load(); return vault;
}
export async function unlock(code: string) { await appLock.unlock(code); return loadVault(); }
export async function loadVault() {
  const encoded = await SecureStore.getItemAsync(KEY, options); if (!encoded) throw Error('DEVICE_KEY_MISSING');
  const vault = new Vault(await database(), unb64(encoded), random); await vault.load(); return vault;
}
export async function unlockBiometric(prompt: string) {
  const record = await locks.read();
  if (!record.biometrics || !(await biometricCheck(prompt))) throw Error('BIOMETRIC_FAILED');
  const key = await SecureStore.getItemAsync(BIO, { ...options, requireAuthentication: true, authenticationPrompt: prompt });
  if (!key) throw Error('BIOMETRIC_FAILED');
  const vault = new Vault(await database(), unb64(key), random); await vault.load(); return vault;
}
export async function setBiometrics(enabled: boolean, prompt: string) {
  const r = await locks.read();
  if (enabled) {
    if (!(await biometricCheck(prompt))) throw Error('BIOMETRIC_FAILED');
    const key = await SecureStore.getItemAsync(KEY, options); if (!key) throw Error('DEVICE_KEY_MISSING');
    await SecureStore.setItemAsync(BIO, key, { ...options, requireAuthentication: true });
  } else await SecureStore.deleteItemAsync(BIO, options);
  await locks.write({ ...r, biometrics: enabled });
}
export async function backupKey() { return unb64((await locks.read()).recovery); }
export async function adoptRecovery(words: string) {
  const r = await locks.read(); await locks.write({ ...r, recovery: b64(recoveryKey(words)) });
}
/** Which biometric unlock this phone has (src/core/bio.ts): Face ID, Touch ID, fingerprint or face. */
export async function bioTypes(): Promise<number[]> {
  try { return (await LocalAuth.supportedAuthenticationTypesAsync()).map(Number); } catch { return []; }
}
export async function changePasscode(current: string, next: string) { await appLock.change(current, next, random); }
export async function renewRecovery(code: string, words: string) { await appLock.renewRecovery(code, words); }
/** Settings → Erase everything on this phone: after the passcode, the vault, its keys and this app's
 *  settings are deleted. Nothing is kept anywhere by us; a backup the person saved is theirs and stays. */
export async function eraseAll(code: string) {
  await appLock.erase(code, async () => {
    const store = await database(); await store.erase();
    await forgetKeychain(); await cleanTemps();
  });
}
export const tempDirectory = () => new Directory(Paths.cache, 'outgoing');
export async function cleanTemps() {
  const dir = tempDirectory(); if (dir.exists) dir.delete(); dir.create({ intermediates: true, idempotent: true });
}
export function tempFile(name: string) {
  const dir = tempDirectory(); dir.create({ intermediates: true, idempotent: true });
  return new File(dir, name.replace(/[^a-zA-Z0-9._-]/g, '_'));
}

export async function cleanStartupTemps() {
  await clearTemporary(async name => {
    const directory = new Directory(Paths.cache, name); if (directory.exists) directory.delete();
  });
  await cleanTemps();
}
