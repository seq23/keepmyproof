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
 * Which vault lines a phone shows (owner ruling 6 Nov 2026: make the vault obvious, honestly). Only a phone
 * that can remove the original (iOS, `systemConfirm`) is told it can; Android is told the original stays in
 * Google Photos and how to delete it there, and its lock line says fingerprint, not Face ID.
 */
export function vaultLines(systemConfirm: boolean) {
  return systemConfirm
    ? { lock: 'vaultLock', photo: 'photoCopy' } as const
    : { lock: 'vaultLockAndroid', photo: 'photoCopyAndroid' } as const;
}
/** The hint under a photo. Pinch-to-zoom is the iOS scroll view's own zoom (app/index.tsx), which Android and
 *  the web preview do not have, so only iOS is told it can pinch (promise audit 27 Nov 2026). */
export const photoHint = (os: string) => os === 'ios' ? 'photoZoom' as const : 'photoFullScreen' as const;
