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
      (p.currency === 'USD' && (cents(o.amount) !== 2999 || cents(o.normalAmount) !== 3999))) return null;
  return o;
}
export function renewalDue(e: Entitlement, now = Date.now()): boolean {
  if (!e.plus || !e.renewsOn) return false;
  const left = Date.parse(e.renewsOn) - now; return left > 0 && left <= 7 * 86400_000;
}

/** Prices compared in cents: StoreKit's Decimal reaches JS as a double (19.99 can arrive as 19.990000000000002). */
const cents = (amount: number) => Math.round(amount * 100);
export function approvedListPrice(product: Product): boolean {
  return Number.isFinite(product.amount) && product.amount > 0 &&
    (product.currency !== 'USD' || cents(product.amount) === (product.plan === 'annual' ? 1999 : 3999));
}

// The store products, by id (App Store / RevenueCat Test Store; Google Play adds ":<base plan>" to a subscription).
export const PRODUCT_IDS = { annual: ['kmp_plus_annual', 'yearly'], lifetime: ['kmp_plus_lifetime', 'lifetime'], launch: ['kmp_plus_lifetime_launch'] } as const;
/** The parts of a RevenueCat package this app reads (react-native-purchases PurchasesPackage). */
export interface StorePackage {
  identifier: string; packageType?: string;
  product: { identifier: string; price: number; priceString: string; currencyCode: string; subscriptionPeriod?: string | null; productCategory?: string | null };
}
export interface StoreOffering<P extends StorePackage = StorePackage> { identifier: string; metadata?: Record<string, unknown> | null; availablePackages: P[] }
export interface StoreOfferings<P extends StorePackage = StorePackage> { current: StoreOffering<P> | null; all: Record<string, StoreOffering<P>> }
const baseId = (id: string) => id.split(':')[0];
/** Which plan a package sells: by product id first, so a custom package identifier still works; then by
 *  RevenueCat's package type; then by the product's own term (one year, or no term at all). */
export function planOf(pkg: StorePackage): Plan | 'launch' | null {
  const id = baseId(pkg.product.identifier);
  for (const plan of ['launch', 'annual', 'lifetime'] as const) if ((PRODUCT_IDS[plan] as readonly string[]).includes(id)) return plan;
  if (pkg.packageType === 'ANNUAL') return 'annual';
  if (pkg.packageType === 'LIFETIME') return 'lifetime';
  if (pkg.product.subscriptionPeriod === 'P1Y') return 'annual';
  if (pkg.packageType === 'CUSTOM' && !pkg.product.subscriptionPeriod && pkg.product.productCategory !== 'SUBSCRIPTION') return 'lifetime';
  return null;
}
const priceOf = (p: StorePackage['product']): StorePrice => ({ id: p.identifier, price: p.priceString, amount: p.price, currency: p.currencyCode });
/** The Plus products from RevenueCat's offerings, with the package that buys each (keyed by product id). Shows
 *  the store's own priceString. The list offering ("default", else the current one) gives the list prices; a
 *  separate current offering adds the launch-week lifetime. Throws STORE_PRODUCTS_MISSING when nothing matches. */
export function storeProducts<P extends StorePackage>(offerings: StoreOfferings<P>, listId = 'default'): { products: Product[]; packages: Map<string, P> } {
  const list = offerings.all[listId] ?? offerings.current;
  if (!list) throw Error('STORE_PRODUCTS_MISSING');
  const packages = new Map<string, P>(), products: Product[] = [];
  const find = (o: StoreOffering<P> | null | undefined, plan: Plan | 'launch') => o?.availablePackages.find(p => planOf(p) === plan);
  for (const plan of ['lifetime', 'annual'] as const) {
    const pkg = find(list, plan); if (!pkg) continue;
    let result: Product = { ...priceOf(pkg.product), plan };
    if (!approvedListPrice(result)) continue;
    packages.set(pkg.product.identifier, pkg);
    const current = offerings.current;
    const launchPkg = plan === 'lifetime' && current && current.identifier !== list.identifier ? find(current, 'launch') ?? find(current, 'lifetime') : undefined;
    if (launchPkg && !launchPkg.product.subscriptionPeriod) {
      result = withLaunch(result, priceOf(launchPkg.product), current!.metadata ?? {});
      if (result.launch) packages.set(launchPkg.product.identifier, launchPkg);
    }
    products.push(result);
  }
  if (!products.length) throw Error('STORE_PRODUCTS_MISSING');
  return { products, packages };
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
