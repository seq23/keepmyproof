import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { b64, unb64 } from '../core/crypto';
import { assemblePdf, exportHtml, originalArchive, type ExportOptions } from '../core/export';
import type { Item } from '../core/model';
import { tempFile } from './storage';
const MAX_FILE = 25 * 1024 * 1024;
export interface Picked { filename: string; mime: string; bytes: string; assetId?: string | null }
async function read(uri: string, filename: string, mime: string, size?: number): Promise<Picked> {
  const file = new File(uri);
  try {
    if ((size ?? file.size) > MAX_FILE) throw Error('FILE_TOO_LARGE');
    return { filename, mime, bytes: b64(await file.bytes()) };
  } finally { if (file.exists) file.delete(); }
}
export async function pickAttachment(photo: boolean): Promise<Picked | null> {
  if (photo) {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current });
    if (r.canceled) return null;
    const a = r.assets[0];
    // assetId: the library id, used only if the person later asks to remove the original from Photos.
    return { ...(await read(a.uri, a.fileName ?? 'photo.jpg', a.mimeType ?? 'image/jpeg', a.fileSize)), assetId: a.assetId ?? null };
  }
  const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true }); if (r.canceled) return null;
  const a = r.assets[0]; return read(a.uri, a.name, a.mimeType ?? 'application/octet-stream', a.size);
}
export async function pickBackup(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (r.canceled) return null;
  const f = new File(r.assets[0].uri);
  try { return await f.text(); } finally { if (f.exists) f.delete(); }
}
export async function shareBytes(bytes: Uint8Array | string, filename: string, mimeType: string) {
  const f = tempFile(filename);
  try { f.write(bytes); await Sharing.shareAsync(f.uri, { mimeType }); }
  finally { if (f.exists) f.delete(); }
}
export async function sharePdf(items: Item[], options: ExportOptions) {
  const metadata = new File((await Print.printToFileAsync({ html: exportHtml(items, options) })).uri);
  try {
    const pdf = await assemblePdf(await metadata.bytes(), items, async item => {
      const source = tempFile(`image-${item.id}`); source.write(unb64(item.bytes!));
      let converted: File | undefined;
      try {
        converted = new File((await manipulateAsync(source.uri, [], { format: SaveFormat.PNG })).uri);
        return await converted.bytes();
      } finally { if (source.exists) source.delete(); if (converted?.exists) converted.delete(); }
    });
    await shareBytes(pdf, 'KeepMyProof.pdf', 'application/pdf');
  } finally { if (metadata.exists) metadata.delete(); }
}
export async function shareOriginals(items: Item[]) {
  await shareBytes(originalArchive(items), 'KeepMyProof-originals.zip', 'application/zip');
}
