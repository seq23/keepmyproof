// The vault folder stays out of the phone's own backups (promise audit 27 Nov 2026: the site says the papers
// leave the phone only when you send a file or save your encrypted backup yourself, but the encrypted vault
// sat in Documents, which iCloud Backup copies every night).
// iOS: the folder is flagged "excluded from backup" (modules/kmp-kdf excludeFromBackup) at every vault open.
// Android: app.config.ts sets allowBackup: false, so Google's cloud backup takes nothing from the app.
export type BackupExclusion = 'excluded' | 'not-needed' | 'failed';
/** Flags the vault folder on iOS. Anything but a confirmed flag is 'failed': a native error, or the system
 *  reading the flag back as off. The caller retries at the next vault open. */
export async function keepOutOfBackup(os: string, folderUri: string, exclude: (uri: string) => Promise<boolean>): Promise<BackupExclusion> {
  if (os !== 'ios') return 'not-needed';
  try { return (await exclude(folderUri)) === true ? 'excluded' : 'failed'; } catch { return 'failed'; }
}
