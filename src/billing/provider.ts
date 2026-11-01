export type Plan = 'annual' | 'lifetime';
export interface Entitlement { plus: boolean; renewsOn: string | null; managementURL: string | null }
export interface LaunchOffer { id: string; price: string; amount: number; normalPrice: string; normalAmount: number; startsAt: string; endsAt: string; eligible: boolean; storeVerified: boolean }
export interface Product { id: string; plan: Plan; price: string; amount: number; currency: string; launch?: LaunchOffer }
export interface PurchasesProvider {
  readonly mode: 'mock' | 'sandbox';
  products(): Promise<Product[]>;
  entitlement(): Promise<Entitlement>;
  purchase(id: string): Promise<Entitlement>;
  restore(): Promise<Entitlement>;
}
export const free: Entitlement = { plus: false, renewsOn: null, managementURL: null };
export class MockPurchases implements PurchasesProvider {
  readonly mode = 'mock';
  async products(): Promise<Product[]> { return [
    { id: 'preview-lifetime', plan: 'lifetime', price: '$39.99', amount: 39.99, currency: 'USD' },
    { id: 'preview-annual', plan: 'annual', price: '$19.99', amount: 19.99, currency: 'USD' },
  ]; }
  async entitlement() { return { ...free }; }
  async purchase(_id: string): Promise<Entitlement> { throw Error('REVENUECAT_KEY_MISSING'); }
  async restore() { return { ...free }; }
}
export function activeLaunch(p: Product, now = Date.now()): LaunchOffer | null {
  const o = p.launch;
  if (p.plan !== 'lifetime' || !o || !o.eligible || !o.storeVerified ||
      !Number.isFinite(Date.parse(o.startsAt)) || !Number.isFinite(Date.parse(o.endsAt)) ||
      Date.parse(o.endsAt) - Date.parse(o.startsAt) > 7 * 86400_000 ||
      now < Date.parse(o.startsAt) || now >= Date.parse(o.endsAt) || o.amount >= o.normalAmount || o.amount <= 0 ||
      (p.currency === 'USD' && (o.amount !== 29.99 || o.normalAmount !== 39.99))) return null;
  return o;
}
export function renewalDue(e: Entitlement, now = Date.now()): boolean {
  if (!e.plus || !e.renewsOn) return false;
  const left = Date.parse(e.renewsOn) - now; return left > 0 && left <= 7 * 86400_000;
}

export function approvedListPrice(product: Product): boolean {
  return Number.isFinite(product.amount) && product.amount > 0 &&
    (product.currency !== 'USD' || product.amount === (product.plan === 'annual' ? 19.99 : 39.99));
}

export interface StorePrice { id: string; price: string; amount: number; currency: string }
// The launch-week lifetime price is a separate store product placed in a RevenueCat "launch"
// offering whose metadata carries launchStartsAt / launchEndsAt. Stores have no intro offer for a
// one-time purchase, so this is the store-native route. Everything here comes from the store and
// RevenueCat; outside the dates activeLaunch() returns null and the list product is shown and sold.
export function withLaunch(list: Product, launch: StorePrice | null, meta: Record<string, unknown>): Product {
  if (list.plan !== 'lifetime' || !launch || launch.currency !== list.currency ||
      typeof meta.launchStartsAt !== 'string' || typeof meta.launchEndsAt !== 'string') return list;
  return { ...list, launch: { id: launch.id, price: launch.price, amount: launch.amount, normalPrice: list.price, normalAmount: list.amount,
    startsAt: meta.launchStartsAt, endsAt: meta.launchEndsAt, eligible: true, storeVerified: true } };
}
/** The store product a tap on this plan buys right now: the launch product only inside its week. */
export function purchaseId(p: Product, now = Date.now()): string { return activeLaunch(p, now)?.id ?? p.id; }
// Accepted keys: RevenueCat Test Store (test_) in any build, and the platform's own store key
// (appl_ on iOS, goog_ on Android). Anything else falls back to the mock, which cannot sell.
// A production build without a store key is refused by scripts/release-gate.mjs (REVENUECAT_KEY_MISSING).
export function acceptedKey(os: string, key: string | undefined): boolean {
  return !!key && (key.startsWith('test_') || (os === 'ios' && key.startsWith('appl_')) || (os === 'android' && key.startsWith('goog_')));
}
