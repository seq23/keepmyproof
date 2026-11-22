import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { MockPurchases, acceptedKey, purchaseId, storeProducts, type Product, type Entitlement, type PurchasesProvider } from './provider';
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
    // A network or StoreKit error comes out of getOfferings (shown as "Couldn't reach"); offerings that came
    // back without the Plus products throw STORE_PRODUCTS_MISSING from storeProducts.
    const { products, packages } = storeProducts(await Purchases.getOfferings(), LIST_OFFERING);
    this.packages = packages; return products;
  }
  async entitlement() { return entitlement(await Purchases.getCustomerInfo()); }
  async purchase(id: string) {
    const product = (await this.products()).find(p => p.id === id); if (!product) throw Error('STORE_PRODUCTS_MISSING');
    const pkg = this.packages.get(purchaseId(product)); if (!pkg) throw Error('STORE_PRODUCTS_MISSING');
    return entitlement((await Purchases.purchasePackage(pkg)).customerInfo);
  }
  async restore() { return entitlement(await Purchases.restorePurchases()); }
  async appUserId() { return Purchases.getAppUserID(); }
  async refresh() { await Purchases.invalidateCustomerInfoCache(); return entitlement(await Purchases.getCustomerInfo()); }
}
let provider: PurchasesProvider | undefined;
export function purchases(): PurchasesProvider {
  if (provider) return provider;
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY;
  provider = acceptedKey(Platform.OS, key) ? new RevenueCat(key!) : new MockPurchases(); return provider;
}
