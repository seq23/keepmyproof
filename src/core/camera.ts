import { exifTime, showHappened } from './dates';
/** One file the person picked or took, ready for the vault. takenOn: the photo's own EXIF time. */
/** camera: taken in the app with the camera, so it was never in Photos (its own wording on the Add screen). */
export interface Picked { filename: string; mime: string; bytes: string; assetId?: string | null; takenOn?: string | null; camera?: boolean }
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
export async function takePhoto(api: CameraApi, read: ReadFile, now: () => Date = () => new Date()): Promise<Picked[] | null | 'denied' | 'unavailable'> {
  let granted: boolean;
  try { granted = (await api.request()).granted; } catch { return 'unavailable'; }
  if (!granted) return 'denied';
  let r: Awaited<ReturnType<CameraApi['launch']>>;
  try { r = await api.launch(); } catch { return 'unavailable'; }
  if (r.canceled || !r.assets?.length) return null;
  // A camera photo has no library id: it was never in Photos, so there is nothing to offer to remove. Its
  // "taken" time is the photo's own EXIF time, as for an import; a camera that writes none was still used
  // right now, so the moment of the shot stands in.
  const p = await fromAsset(r.assets[0], read);
  return [{ ...p, assetId: null, camera: true, takenOn: p.takenOn ?? wallClock(now()) }];
}
const pad = (n: number) => String(n).padStart(2, '0');
/** A local wall-clock time as YYYY-MM-DDTHH:MM, the shape exifTime gives. */
export const wallClock = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** What the Add screen does with a camera result: keep the photo, or say why not and open the library. */
export type CameraStep = { picked: Picked[] } | { fallback: 'cameraOff' | 'cameraNone' } | null;
export function cameraStep(got: Awaited<ReturnType<typeof takePhoto>>): CameraStep {
  if (got === 'denied') return { fallback: 'cameraOff' };
  if (got === 'unavailable') return { fallback: 'cameraNone' };
  return got?.length ? { picked: got } : null;
}
/** The one title for a photo nobody named: "Photo <taken time>" (11/2/2026 6:01 PM), else its file name.
 *  Used for camera photos and for photos imported several at once. */
export function photoTitle(p: Pick<Picked, 'filename' | 'takenOn'>, label: (date: string) => string, locale: string): string {
  return p.takenOn ? label(showHappened(p.takenOn, locale)) : p.filename;
}
