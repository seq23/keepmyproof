// What a screen shows for who is looking (video watch 28 Nov 2026). Pure, so each rule has a test; app/index.tsx
// draws what these say.
import type { StringKey } from '../strings';

/**
 * The Plus page. A member who already has Plus is never asked to pay again (finding 6): no Buy or Subscribe
 * buttons, no Restore, no "Not now"; a subscriber gets Manage. Anyone without Plus (never bought, or it lapsed)
 * sees the plans, then Restore, then one Terms · Privacy line, then "Not now" last (finding 12).
 */
export function plusPage(plus: boolean, canManage: boolean) {
  return plus
    ? { plans: false, restore: false, notNow: false, manage: canManage }
    : { plans: true, restore: true, notNow: true, manage: false };
}
/** "With Plus you can also…" and its See Plus button on the PDF screen, and Home's own way in to Plus (findings 1, 6). */
export const upsell = (plus: boolean) => !plus;

/** Each folder's own footer. Only the folders about a legal matter mention a lawyer (finding 14): a folder the
 *  person made, and the catch-all Private folder, say it is dated and organized. */
const FOOT: Record<string, StringKey> = { 'va-disability-papers':'vaDisclaimer', 'tenant-repairs-deposit':'tenantFoot', 'home-inventory':'inventoryFoot',
  'divorce-prep':'folderFoot', 'workplace-evidence':'folderFoot', 'executor-papers':'folderFoot', 'iep-binder':'folderFoot' };
export const folderFoot = (id: string): StringKey => FOOT[id] ?? 'ownFoot';

/** The name the Back button uses: the folder's short name, or none (plain "← Back") when even that would wrap on a
 *  320 px screen (finding 14: "← Back to Divorce, custody or co-parenting log" took two lines). */
export const BACK_NAME_MAX = 20;
export const backName = (short: string) => [...short].length <= BACK_NAME_MAX ? short : null;
