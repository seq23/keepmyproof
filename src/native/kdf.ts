import { requireNativeModule } from 'expo';
import { jsPbkdf2, type Pbkdf2 } from '../core/crypto';
// The passcode's PBKDF2 runs in the phone's own crypto library (modules/kmp-kdf: CommonCrypto on iOS,
// javax.crypto on Android), off the UI thread. In Hermes JS the same 210,000 rounds took ~25 s on an
// iPhone. requireNativeModule throws at start-up if the module is not linked, so a build without it
// fails loudly instead of quietly taking a minute per unlock.
const native = requireNativeModule<{ pbkdf2Sha256(code: string, salt: string, iterations: number, length: number): Promise<string> }>('KmpKdf');
const nativePbkdf2: Pbkdf2 = (code, salt, iterations) => native.pbkdf2Sha256(code, salt, iterations, 32);
let checked: Promise<void> | undefined;
/** Native PBKDF2, first proven equal to the JS reference on a cheap 3-round case (NAMED STOP KDF_NATIVE_MISMATCH). */
export const phonePbkdf2: Pbkdf2 = async (code, salt, iterations) => {
  checked ??= Promise.all([nativePbkdf2(code, salt, 3), jsPbkdf2(code, salt, 3)]).then(([a, b]) => {
    if (a !== b) throw Error('KDF_NATIVE_MISMATCH');
  });
  try { await checked; } catch (e) { checked = undefined; throw e; }
  return nativePbkdf2(code, salt, iterations);
};
