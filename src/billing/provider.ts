export type Plan = 'annual' | 'lifetime';
export interface Entitlement { plus: boolean; renewsOn: string | null; managementURL: string | null }
export interface LaunchOffer { price: string; amount: number; normalPrice: string; normalAmount: number; startsAt: string; endsAt: string; eligible: boolean; storeVerified: boolean }
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
