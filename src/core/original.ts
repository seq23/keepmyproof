// "Remove the original from Photos?" after a photo import (owner ruling 6 Nov 2026: vault feature line).
// The safe choice is the default everywhere: nothing leaves Photos unless the person taps Remove AND then
// confirms the phone's own delete dialog. Declining either step changes nothing.
export type RemovePref = 'ask' | 'never';
/** The setting's default: off. Nothing is pre-picked for the person (sim review 14 Nov 2026); they can
 *  turn the offer on at setup or in Settings (the offer itself still removes nothing). */
export const DEFAULT_REMOVE_PREF: RemovePref = 'never';
export const isRemovePref = (v: unknown): v is RemovePref => v === 'ask' || v === 'never';
export interface PrefStore { read(): Promise<string | null>; write(v: RemovePref): Promise<void> }
export async function readRemovePref(store: PrefStore): Promise<RemovePref> {
  try { const v = await store.read(); return isRemovePref(v) ? v : DEFAULT_REMOVE_PREF; } catch { return DEFAULT_REMOVE_PREF; }
}
/**
 * Whether to offer removal after a save. Only a NEW photo item whose library id is known, on a phone whose
 * system shows its own delete confirmation (iOS; Android's photo picker returns copies we cannot delete).
 */
export function shouldOffer(o: { pref: RemovePref; kind: string; assetId: string | null | undefined; editing: boolean; systemConfirm: boolean }) {
  return o.pref === 'ask' && o.kind === 'photo' && !o.editing && o.systemConfirm && typeof o.assetId === 'string' && o.assetId.length > 0;
}
/** The platform delete. It must show the phone's own confirmation (once for all of them) and reject when that is declined. */
export type SystemDelete = (assetIds: string[]) => Promise<void>;
export type RemoveResult = 'removed' | 'kept';
/**
 * Runs only after the item is saved in the vault (`saved` is the vault's copy). Any refusal or failure
 * (permission, the system dialog declined, photo not found) keeps the original and reports 'kept'.
 */
export async function removeOriginal(assetId: string, saved: { bytes: string | null } | undefined, systemDelete: SystemDelete): Promise<RemoveResult> {
  return removeOriginals([assetId], [saved], systemDelete);
}
/** Several photos added at once: one system dialog for all of them, and only when every one of them is
 *  saved in the vault; otherwise nothing is touched. */
export async function removeOriginals(assetIds: string[], saved: ({ bytes: string | null } | undefined)[], systemDelete: SystemDelete): Promise<RemoveResult> {
  if (!assetIds.length || assetIds.length !== saved.length || !saved.every(i => i?.bytes)) return 'kept';
  try { await systemDelete(assetIds); return 'removed'; } catch { return 'kept'; }
}
/**
 * Which vault lines each platform shows (owner ruling 6 Nov 2026: make the vault obvious, honestly). Only iOS,
 * which can remove the original (Photos' own dialog), is told it can; only Android is told the original stays in
 * Google Photos and how to delete it there, with a fingerprint lock line. The web preview stands in for the
 * iPhone build, so it never shows Android wording (video watch 28 Nov 2026, findings 3 and 9), and it cannot
 * remove an original, so it is not told it can.
 */
export function vaultLines(os: string) {
  if (os === 'ios') return { lock: 'vaultLock', photo: 'photoCopy', settings: 'removeSwitch' } as const;
  if (os === 'android') return { lock: 'vaultLockAndroid', photo: 'photoCopyAndroid', settings: 'androidNote' } as const;
  return { lock: 'vaultLock', photo: 'photoCopyPlain', settings: null } as const;
}
/** The hint under a photo. Pinch-to-zoom is the iOS scroll view's own zoom (app/index.tsx), which Android and
 *  the web preview do not have, so only iOS is told it can pinch (promise audit 27 Nov 2026). */
export const photoHint = (os: string) => os === 'ios' ? 'photoZoom' as const : 'photoFullScreen' as const;
