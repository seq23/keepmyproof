import { requireNativeModule } from 'expo';
// The iOS "excluded from backup" flag lives in the app's own native module (modules/kmp-kdf), next to the
// passcode KDF and AES-GCM. Called on iOS only (src/core/backup.ts); Android never calls it.
const native = requireNativeModule<{ excludeFromBackup(uri: string): Promise<boolean> }>('KmpKdf');
export const excludeFromBackup = (uri: string) => native.excludeFromBackup(uri);
