import { exifTime } from './dates';
/** One file the person picked or took, ready for the vault. takenOn: the photo's own EXIF time. */
export interface Picked { filename: string; mime: string; bytes: string; assetId?: string | null; takenOn?: string | null }
/** What the image picker hands back for one photo (library or camera alike). */
export interface PickerAsset { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null;
  assetId?: string | null; exif?: Record<string, unknown> | null }
export type ReadFile = (uri: string, filename: string, mime: string, size?: number) => Promise<Picked>;
/**
 * The one way a picked or taken photo becomes a vault file, so a camera photo and an imported photo record
 * their dates the same way: the vault stamps "saved" when it is saved, and the photo's own EXIF
 * DateTimeOriginal becomes takenOn. read() deletes the picker's temporary copy whatever happens.
 */
export async function fromAsset(a: PickerAsset, read: ReadFile): Promise<Picked> {
  return { ...(await read(a.uri, a.fileName ?? 'photo.jpg', a.mimeType ?? 'image/jpeg', a.fileSize ?? undefined)),
    assetId: a.assetId ?? null, takenOn: exifTime(a.exif?.DateTimeOriginal) };
}
/** The camera calls this module needs; files.ts passes expo-image-picker's, tests pass fakes. */
export interface CameraApi {
  request(): Promise<{ granted: boolean }>;
  launch(): Promise<{ canceled: boolean; assets: PickerAsset[] | null }>;
}
/**
 * Take one photo straight into the vault. The permission is asked here, only after the person tapped "Take a
 * photo". The photo is never saved to the phone's Photos library and nothing is uploaded.
 * 'denied': the camera is off for the app; 'unavailable': no camera or it failed to open. Either way the
 * caller offers the photo library instead; nothing throws.
 */
export async function takePhoto(api: CameraApi, read: ReadFile): Promise<Picked[] | null | 'denied' | 'unavailable'> {
  let granted: boolean;
  try { granted = (await api.request()).granted; } catch { return 'unavailable'; }
  if (!granted) return 'denied';
  let r: Awaited<ReturnType<CameraApi['launch']>>;
  try { r = await api.launch(); } catch { return 'unavailable'; }
  if (r.canceled || !r.assets?.length) return null;
  // A camera photo has no library id: it was never in Photos, so there is nothing to offer to remove.
  return [{ ...(await fromAsset(r.assets[0], read)), assetId: null }];
}
