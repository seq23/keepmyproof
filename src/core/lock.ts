import { b64, equal, LEGACY_ITERATIONS, passcodeHash, PASSCODE_ITERATIONS, recoveryKey, type Random } from './crypto';
/** iterations: PBKDF2 count the verifier was made with; absent on records made before 6 Nov 2026 (210,000). */
export interface LockRecord { salt: string; verifier: string; iterations?: number; attempts: number; nextTry: number; recovery: string; biometrics: boolean }
export interface LockStore { read(): Promise<LockRecord>; write(record: LockRecord): Promise<void> }
export async function createLock(code: string, words: string, biometrics: boolean, random: Random): Promise<LockRecord> {
  const salt = b64(random(16));
  return { salt, verifier: await passcodeHash(code, salt), iterations: PASSCODE_ITERATIONS, attempts: 0, nextTry: 0, recovery: b64(recoveryKey(words)), biometrics };
}
export class AppLock {
  constructor(private store: LockStore, private now = () => Date.now()) {}
  async unlock(code: string) {
    const r = await this.store.read();
    if (this.now() < r.nextTry) throw Error('WAIT');
    let ok = false;
    const iterations = r.iterations ?? LEGACY_ITERATIONS;
    if (/^\d{6}$/.test(code)) ok = equal(await passcodeHash(code, r.salt, iterations), r.verifier);
    if (!ok) {
      r.attempts += 1; r.nextTry = this.now() + Math.min(3_600_000, 1000 * 2 ** Math.min(r.attempts - 1, 12));
      await this.store.write(r); throw Error('PASSCODE_WRONG');
    }
    if (iterations >= PASSCODE_ITERATIONS) { await this.store.write({ ...r, attempts: 0, nextTry: 0 }); return; }
    // A legacy (210,000) verifier is re-made at the current count while the correct code is in hand.
    await this.store.write({ ...r, verifier: await passcodeHash(code, r.salt), iterations: PASSCODE_ITERATIONS, attempts: 0, nextTry: 0 });
  }
  /** Change the passcode: the current one is checked first, with the same waits as unlocking. */
  async change(current: string, next: string, random: Random) {
    if (!/^\d{6}$/.test(next)) throw Error('PASSCODE_INVALID');
    await this.unlock(current);
    const r = await this.store.read(), salt = b64(random(16));
    await this.store.write({ ...r, salt, verifier: await passcodeHash(next, salt), iterations: PASSCODE_ITERATIONS, attempts: 0, nextTry: 0 });
  }
  /** New recovery words, behind the passcode (checked with the same waits as unlocking). */
  async renewRecovery(code: string, words: string) {
    await this.unlock(code);
    const r = await this.store.read(); await this.store.write({ ...r, recovery: b64(recoveryKey(words)) });
  }
  /** Erase everything: only after the passcode is checked (same waits as unlocking); then wipe runs. */
  async erase(code: string, wipe: () => Promise<void>) { await this.unlock(code); await wipe(); }
  async reset(code: string, proof: { words: string } | { biometric: true }, biometricCheck: () => Promise<boolean>, random: Random) {
    const r = await this.store.read();
    if ('words' in proof) {
      if (this.now() < r.nextTry) throw Error('WAIT');
      let valid = false;
      try { valid = equal(b64(recoveryKey(proof.words)), r.recovery); } catch { /* invalid phrase is a failed guess */ }
      if (!valid) {
        r.attempts++; r.nextTry = this.now() + Math.min(3_600_000, 1000 * 2 ** Math.min(r.attempts - 1, 12));
        await this.store.write(r); throw Error('RECOVERY_INVALID');
      }
    } else if (!r.biometrics || !(await biometricCheck())) throw Error('BIOMETRIC_FAILED');
    const salt = b64(random(16));
    await this.store.write({ ...r, salt, verifier: await passcodeHash(code, salt), iterations: PASSCODE_ITERATIONS, attempts: 0, nextTry: 0 });
  }
}
