// Browser stand-in for revenuecat.ts, used only by the free web preview (docs/preview.md): the store
// SDK is never loaded, prices are the mock's and nothing can be bought.
import { MockPurchases, type PurchasesProvider } from './provider';
const provider = new MockPurchases();
export function purchases(): PurchasesProvider { return provider; }
