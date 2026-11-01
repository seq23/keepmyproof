import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage, INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import { MockPurchases, approvedListPrice, type Product, type Entitlement, type PurchasesProvider } from './provider';
const entitlement = (info: CustomerInfo): Entitlement => {
  const active = info.entitlements.active.plus;
  return { plus: !!active, renewsOn: active?.willRenew ? active.expirationDate : null, managementURL: info.managementURL };
};
class RevenueCat implements PurchasesProvider {
  readonly mode = 'sandbox';
  private packages = new Map<string, PurchasesPackage>();
  constructor(key: string) { Purchases.configure({ apiKey: key, diagnosticsEnabled: false, automaticDeviceIdentifierCollectionEnabled: false }); }
  async products(): Promise<Product[]> {
    const current = (await Purchases.getOfferings()).current;
    if (!current) throw Error('STORE_PRODUCTS_MISSING');
    const results: Product[] = [];
    for (const [plan, pkg] of [['lifetime', current.lifetime], ['annual', current.annual]] as const) {
      if (!pkg) continue;
      const p = pkg.product;
      if (plan === 'annual' && p.subscriptionPeriod !== 'P1Y') continue;
      if (plan === 'lifetime' && p.subscriptionPeriod !== null) continue;
      // No trials or discounted annual terms in v0.
      if (plan === 'annual' && (p.introPrice || p.defaultOption?.freePhase || p.defaultOption?.introPhase)) continue;
      const result: Product = { id: p.identifier, plan, price: p.priceString, amount: p.price, currency: p.currencyCode };
      if (!approvedListPrice(result)) continue;
      const meta = current.metadata;
      // Only a store-returned, eligible non-renewing intro can drive launch copy.
      // Current stores generally expose subscription-only intros; no fake discount fallback.
      if (plan === 'lifetime' && p.introPrice && p.introPrice.price > 0 && p.introPrice.cycles === 1) {
        const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([p.identifier]);
        if (typeof meta.launchStartsAt === 'string' && typeof meta.launchEndsAt === 'string') result.launch = {
          price: p.introPrice.priceString, amount: p.introPrice.price, normalPrice: p.priceString, normalAmount: p.price,
          startsAt: meta.launchStartsAt, endsAt: meta.launchEndsAt, storeVerified: true,
          eligible: eligibility[p.identifier]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE,
        };
      }
      this.packages.set(p.identifier, pkg); results.push(result);
    }
    if (!results.length) throw Error('STORE_PRODUCTS_MISSING'); return results;
  }
  async entitlement() { return entitlement(await Purchases.getCustomerInfo()); }
  async purchase(id: string) {
    await this.products(); const pkg = this.packages.get(id); if (!pkg) throw Error('STORE_PRODUCTS_MISSING');
    return entitlement((await Purchases.purchasePackage(pkg)).customerInfo);
  }
  async restore() { return entitlement(await Purchases.restorePurchases()); }
}
let provider: PurchasesProvider | undefined;
export function purchases(): PurchasesProvider {
  if (provider) return provider;
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY;
  // This v0 intentionally accepts only RevenueCat Test Store keys; real-money builds fail closed.
  provider = key?.startsWith('test_') ? new RevenueCat(key) : new MockPurchases(); return provider;
}
