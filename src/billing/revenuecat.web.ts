// Browser stand-in for revenuecat.ts, used only by the free web preview (docs/preview.md): the store
// SDK is never loaded, prices are the mock's and nothing can be bought. `?plus=1` on the preview's
// address shows the app as a Plus member (the paid screens: your own folders, the date-range PDF), so
// the tap-through and the reviewer can open them; the phone builds never load this file.
import { MockPurchases, type Entitlement, type PurchasesProvider } from './provider';

const plusPreview = typeof location !== 'undefined' && new URLSearchParams(location.search).get('plus') === '1';
const plus: Entitlement = { plus: true, renewsOn: null, managementURL: null };

class PreviewPlus extends MockPurchases {
  override async entitlement() { return { ...plus }; }
  override async restore() { return { ...plus }; }
  override async refresh() { return { ...plus }; }
}
const provider = plusPreview ? new PreviewPlus() : new MockPurchases();
export function purchases(): PurchasesProvider { return provider; }
