import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PDF_MARGINS, assemblePdf, exportHtml, originalArchive, type ExportOptions } from '../core/export';
import type { Item } from '../core/model';
import { tempFile } from './storage';
import { fromAsset, takePhoto as take, type Picked } from '../core/camera';
import { pressedAnchor } from '../anchor';
export type { Picked } from '../core/camera';
// The device gate's seam (src/gate.ts): only the gate build bundles it; in every other build this folds to null.
const gate: typeof import('../gate') | null = process.env.EXPO_PUBLIC_KMP_GATE === '1' ? require('../gate') : null;
const MAX_FILE = 25 * 1024 * 1024;
async function read(uri: string, filename: string, mime: string, size?: number): Promise<Picked> {
  const file = new File(uri);
  try {
    if ((size ?? file.size) > MAX_FILE) throw Error('FILE_TOO_LARGE');
    // The phone encodes base64 natively; in JS a 3 MB photo took seconds on an iPhone.
    return { filename, mime, bytes: await file.base64() };
  } finally { if (file.exists) file.delete(); }
}
/** Photos: several at once when `multiple` (finding 5). Files: one. null = cancelled. */
export async function pickAttachment(photo: boolean, multiple = false): Promise<Picked[] | null> {
  if (photo) {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: multiple,
      allowsMultipleSelection: multiple, selectionLimit: multiple ? 0 : 1,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current });
    if (r.canceled || !r.assets.length) return null;
    const out: Picked[] = [];
    // assetId: the library id, used only if the person later asks to remove the original from Photos.
    for (const a of r.assets) out.push(await fromAsset(a, read));
    return out;
  }
  const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true }); if (r.canceled) return null;
  const a = r.assets[0]; return [await read(a.uri, a.name, a.mimeType ?? 'application/octet-stream', a.size)];
}
/** The camera, straight into the vault: asked for only on the tap, never saved to Photos (see core/camera.ts). */
export const takePhoto = () => take({
  request: () => ImagePicker.requestCameraPermissionsAsync(),
  launch: () => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: true }),
}, read);
/** A saved file written to this app's temporary folder so it can be shown inside the app (finding 14).
 *  The temporary folder is emptied on every lock and every start. */
export async function viewFile(item: Item): Promise<string> {
  const f = tempFile(`view-${item.id.slice(0, 12)}-${item.filename ?? 'file'}`);
  await f.write(item.bytes!, { encoding: 'base64' }); return f.uri;
}
export async function pickBackup(): Promise<string | null> {
  if (gate) return gate.pickText();
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (r.canceled) return null;
  const f = new File(r.assets[0].uri);
  try { return await f.text(); } finally { if (f.exists) f.delete(); }
}
export async function shareBytes(bytes: Uint8Array | string, filename: string, mimeType: string) {
  if (gate) return gate.share(bytes, filename);
  const f = tempFile(filename);
  try { await f.write(bytes); await Sharing.shareAsync(f.uri, { mimeType, anchor: pressedAnchor() }); }
  finally { if (f.exists) f.delete(); }
}
export async function sharePdf(items: Item[], options: ExportOptions) {
  const metadata = new File((await Print.printToFileAsync({ html: exportHtml(items, options), margins: PDF_MARGINS })).uri);
  try {
    const pdf = await assemblePdf(await metadata.bytes(), items, async item => {
      const source = tempFile(`image-${item.id}`); await source.write(item.bytes!, { encoding: 'base64' });
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
