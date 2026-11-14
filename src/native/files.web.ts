// Browser stand-in for files.ts, used only by the free web preview (docs/preview.md). A browser has
// no photo library, file picker or share sheet like the phone's, so each one says what the phone does
// and lets the person carry on. Nothing is read from or saved to the computer.
import { b64, utf8 } from '../core/crypto';
import type { ExportOptions } from '../core/export';
import type { Item } from '../core/model';
export interface Picked { filename: string; mime: string; bytes: string; assetId?: string | null }
const say = (text: string) => globalThis.alert(`Preview only: ${text}`);
const SAMPLE = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#efe7da"/><text x="160" y="126" font-family="sans-serif" font-size="20" fill="#6d6458" text-anchor="middle">Sample picture</text></svg>';
let lastBackup: string | null = null;
export async function pickAttachment(photo: boolean): Promise<Picked | null> {
  say(`on a phone this opens your ${photo ? 'photos' : 'files'}. Here it adds a sample picture.`);
  return { filename: photo ? 'sample-photo.svg' : 'sample-file.svg', mime: 'image/svg+xml', bytes: b64(utf8(SAMPLE)), assetId: null };
}
export async function pickBackup(): Promise<string | null> {
  say(lastBackup ? 'on a phone you choose your backup file. Here it uses the backup you just made.'
    : 'on a phone you choose your backup file. Make a backup in this preview first, then come back.');
  return lastBackup;
}
export async function shareBytes(bytes: Uint8Array | string, filename: string, _mimeType: string) {
  if (typeof bytes === 'string' && filename.endsWith('.kmp')) lastBackup = bytes;
  say(`on a phone this opens the share sheet to save ${filename}. Nothing is saved from this preview.`);
}
export async function sharePdf(_items: Item[], _options: ExportOptions) {
  say('on a phone this makes the PDF and opens the share sheet. Nothing is saved from this preview.');
}
export async function shareOriginals(_items: Item[]) {
  say('on a phone this opens the share sheet to save your original files. Nothing is saved from this preview.');
}
