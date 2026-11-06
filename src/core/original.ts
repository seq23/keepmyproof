// "Remove the original from Photos?" after a photo import (owner ruling 6 Nov 2026: vault feature line).
// The safe choice is the default everywhere: nothing leaves Photos unless the person taps Remove AND then
// confirms the phone's own delete dialog. Declining either step changes nothing.
export type RemovePref = 'ask' | 'never';
/** The setting's default: offer the choice after each photo import (the offer itself removes nothing). */
export const DEFAULT_REMOVE_PREF: RemovePref = 'ask';
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
/** The platform delete. It must show the phone's own confirmation and reject when that is declined. */
export type SystemDelete = (assetId: string) => Promise<void>;
export type RemoveResult = 'removed' | 'kept';
/**
 * Runs only after the item is saved in the vault (`saved` is the vault's copy). Any refusal or failure
 * (permission, the system dialog declined, photo not found) keeps the original and reports 'kept'.
 */
export async function removeOriginal(assetId: string, saved: { bytes: string | null } | undefined, systemDelete: SystemDelete): Promise<RemoveResult> {
  if (!saved?.bytes) return 'kept';
  try { await systemDelete(assetId); return 'removed'; } catch { return 'kept'; }
}
