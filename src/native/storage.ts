import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuth from 'expo-local-authentication';
import { File, Paths, Directory } from 'expo-file-system';
import { AppLock, createLock, type LockRecord, type LockStore } from '../core/lock';
import { b64, unb64, recoveryKey, type Random } from '../core/crypto';
import { clearTemporary } from '../core/cleanup';
import { Vault, prepareInstall, type InstallStore } from '../core/vault';
export const random: Random = n => Crypto.getRandomBytes(n);
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const AUTH = 'kmp-lock-v1', KEY = 'kmp-key-v1', BIO = 'kmp-bio-v1';
let db: SQLite.SQLiteDatabase | undefined;
export async function database(): Promise<InstallStore> {
  if (!db) {
    const directory = new Directory(Paths.document, 'vault'); directory.create({ intermediates: true, idempotent: true });
    db = await SQLite.openDatabaseAsync('vault.sqlite', {}, directory.uri);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY CHECK(id=1), ciphertext TEXT NOT NULL); CREATE TABLE IF NOT EXISTS orphaned (archivedOn TEXT NOT NULL, ciphertext TEXT NOT NULL)');
  }
  const connection = db;
  return {
    read: async () => (await connection.getFirstAsync<{ ciphertext: string }>('SELECT ciphertext FROM vault WHERE id=1'))?.ciphertext ?? null,
    write: async ciphertext => { await connection.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync('INSERT INTO vault(id,ciphertext) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET ciphertext=excluded.ciphertext', ciphertext);
    }); },
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
export async function hasSetup() {
  return prepareInstall(await database(), !!(await SecureStore.getItemAsync(AUTH, options)));
}
export async function biometricCheck(prompt: string): Promise<boolean> {
  if (!(await LocalAuth.hasHardwareAsync()) || !(await LocalAuth.isEnrolledAsync())) return false;
  const r = await LocalAuth.authenticateAsync({ promptMessage: prompt, disableDeviceFallback: true, biometricsSecurityLevel: 'strong' });
  return r.success;
}
export async function setup(code: string, words: string, biometrics: boolean) {
  const store = await database();
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
