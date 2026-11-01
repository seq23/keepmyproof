import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { MockPurchases, acceptedKey, approvedListPrice, purchaseId, withLaunch, type Product, type Entitlement, type PurchasesProvider, type StorePrice } from './provider';
const entitlement = (info: CustomerInfo): Entitlement => {
  const active = info.entitlements.active.plus;
  return { plus: !!active, renewsOn: active?.willRenew ? active.expirationDate : null, managementURL: info.managementURL };
};
const LIST_OFFERING = 'default';
class RevenueCat implements PurchasesProvider {
  readonly mode = 'sandbox';
  private packages = new Map<string, PurchasesPackage>();
  constructor(key: string) { Purchases.configure({ apiKey: key, diagnosticsEnabled: false, automaticDeviceIdentifierCollectionEnabled: false }); }
  async products(): Promise<Product[]> {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    // List prices always come from the list offering; a launch offering only adds its lifetime product.
    const list: PurchasesOffering | null = offerings.all[LIST_OFFERING] ?? current;
    if (!list) throw Error('STORE_PRODUCTS_MISSING');
    const results: Product[] = [];
    for (const [plan, pkg] of [['lifetime', list.lifetime], ['annual', list.annual]] as const) {
      if (!pkg) continue;
      const p = pkg.product;
      if (plan === 'annual' && p.subscriptionPeriod !== 'P1Y') continue;
      if (plan === 'lifetime' && p.subscriptionPeriod !== null) continue;
      // No trials or discounted annual terms in v0.
      if (plan === 'annual' && (p.introPrice || p.defaultOption?.freePhase || p.defaultOption?.introPhase)) continue;
      let result: Product = { id: p.identifier, plan, price: p.priceString, amount: p.price, currency: p.currencyCode };
      if (!approvedListPrice(result)) continue;
      this.packages.set(p.identifier, pkg);
      const launchPkg = plan === 'lifetime' && current && current.identifier !== list.identifier ? current.lifetime : null;
      if (launchPkg && launchPkg.product.subscriptionPeriod === null) {
        const l = launchPkg.product; const launch: StorePrice = { id: l.identifier, price: l.priceString, amount: l.price, currency: l.currencyCode };
        result = withLaunch(result, launch, current!.metadata ?? {});
        if (result.launch) this.packages.set(l.identifier, launchPkg);
      }
      results.push(result);
    }
    if (!results.length) throw Error('STORE_PRODUCTS_MISSING'); return results;
  }
  async entitlement() { return entitlement(await Purchases.getCustomerInfo()); }
  async purchase(id: string) {
    const product = (await this.products()).find(p => p.id === id); if (!product) throw Error('STORE_PRODUCTS_MISSING');
    const pkg = this.packages.get(purchaseId(product)); if (!pkg) throw Error('STORE_PRODUCTS_MISSING');
    return entitlement((await Purchases.purchasePackage(pkg)).customerInfo);
  }
  async restore() { return entitlement(await Purchases.restorePurchases()); }
}
let provider: PurchasesProvider | undefined;
export function purchases(): PurchasesProvider {
  if (provider) return provider;
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY;
  provider = acceptedKey(Platform.OS, key) ? new RevenueCat(key!) : new MockPurchases(); return provider;
}
