import { test } from 'node:test';
import assert from 'node:assert/strict';
import { b64 } from '../src/core/crypto';
import { Vault, newestFirst } from '../src/core/vault';
import { activeLaunch, storeProducts, type StoreOfferings, type StorePackage } from '../src/billing/provider';
import { MemoryStore, draft, random } from './helpers';

// Simulator retest of fe26b0d (14 Nov 2026).

test('newest first: photos saved together with one typed date list by their own taken time, newest first', async () => {
  const saved = '2026-11-14T10:00:00.000Z';
  const vault = new Vault(new MemoryStore(), random(32), random, () => saved); await vault.load();
  const photo = (title: string, takenOn: string) =>
    draft({ folder: 'private', kind: 'photo', title, filename: 'p.jpg', mime: 'image/jpeg', bytes: b64(random(8)), takenOn, happenedOn: '2026-03-15' });
  // Picked oldest first, as the photo library hands them over; all saved in the same instant.
  await vault.addMany([photo('2012 4:29', '2012-08-08T16:29'), photo('2012 4:55', '2012-08-08T16:55'), photo('2018', '2018-03-30T12:14')], true);
  assert.deepEqual(vault.items('private').map(i => i.title), ['2018', '2012 4:55', '2012 4:29']);
  assert.deepEqual([...vault.snapshot().items].sort(newestFirst).map(i => i.title), ['2018', '2012 4:55', '2012 4:29']);
  // Different days still go by the day first; the later save wins a full tie.
  const later = new Vault(new MemoryStore(), random(32), random, (() => { let n = 0; return () => `2026-11-14T10:00:0${n++}.000Z`; })()); await later.load();
  await later.addMany([draft({ folder: 'private', title: 'older', happenedOn: '2026-01-02' }), draft({ folder: 'private', title: 'first save' }), draft({ folder: 'private', title: 'second save' }), draft({ folder: 'private', title: 'newer', happenedOn: '2026-12-01' })], true);
  assert.deepEqual(later.items('private').map(i => i.title), ['newer', 'second save', 'first save', 'older']);
});

// RevenueCat package shapes as react-native-purchases returns them on iOS: StoreKit's Decimal price arrives as a
// double, the package identifier can be custom, and the annual product may carry an intro offer.
const product = (identifier: string, price: number, priceString: string, period: string | null, extra: Record<string, unknown> = {}) => ({
  identifier, description: 'Invented', title: 'Invented', price, priceString, currencyCode: 'USD', pricePerWeek: null, pricePerMonth: null,
  pricePerYear: null, introPrice: null, discounts: [], productCategory: period ? 'SUBSCRIPTION' : 'NON_SUBSCRIPTION',
  productType: period ? 'AUTO_RENEWABLE_SUBSCRIPTION' : 'NON_CONSUMABLE', subscriptionPeriod: period, defaultOption: null, subscriptionOptions: null,
  presentedOfferingIdentifier: 'default', ...extra,
});
const pkg = (identifier: string, packageType: string, p: ReturnType<typeof product>) => ({ identifier, packageType, product: p, offeringIdentifier: 'default' });
const offering = (identifier: string, availablePackages: StorePackage[], metadata: Record<string, unknown> = {}) => ({ identifier, serverDescription: identifier, metadata, availablePackages });

test('Plus prices: the real store shapes give both plans with the store\'s own price text', () => {
  const annual = pkg('$rc_annual', 'ANNUAL', product('kmp_plus_annual', 19.990000000000002, '$19.99', 'P1Y',
    { introPrice: { price: 0, priceString: '$0.00', period: 'P1W', cycles: 1, periodUnit: 'WEEK', periodNumberOfUnits: 1 } }));
  const lifetime = pkg('$rc_lifetime', 'LIFETIME', product('kmp_plus_lifetime', 39.99000000000001, '$39.99', null));
  const def = offering('default', [annual, lifetime]);
  const { products, packages } = storeProducts({ current: def, all: { default: def } } as StoreOfferings, 'default');
  assert.deepEqual(products.map(p => [p.plan, p.id, p.price]), [['lifetime', 'kmp_plus_lifetime', '$39.99'], ['annual', 'kmp_plus_annual', '$19.99']]);
  assert.equal(packages.get('kmp_plus_annual'), annual);
  assert.equal(packages.get('kmp_plus_lifetime'), lifetime);
});

test('Plus prices: custom package identifiers are matched by product id, and the Play base plan suffix is read', () => {
  const def = offering('plus', [
    pkg('plus_year', 'CUSTOM', product('kmp_plus_annual:annual', 19.99, '$19.99', 'P1Y')),
    pkg('plus_forever', 'CUSTOM', product('kmp_plus_lifetime', 39.99, '$39.99', null)),
    pkg('$rc_monthly', 'MONTHLY', product('monthly', 2.99, '$2.99', 'P1M')),
  ]);
  const { products } = storeProducts({ current: def, all: { plus: def } } as StoreOfferings, 'default');
  assert.deepEqual(products.map(p => [p.plan, p.id]), [['lifetime', 'kmp_plus_lifetime'], ['annual', 'kmp_plus_annual:annual']]);
});

test('Plus prices: the launch-week lifetime comes from the current offering and is sold only in its week', () => {
  const def = offering('default', [pkg('$rc_lifetime', 'LIFETIME', product('kmp_plus_lifetime', 39.99000000000001, '$39.99', null)), pkg('$rc_annual', 'ANNUAL', product('kmp_plus_annual', 19.99, '$19.99', 'P1Y'))]);
  const launch = offering('launch', [pkg('$rc_lifetime', 'LIFETIME', product('kmp_plus_lifetime_launch', 29.989999999999998, '$29.99', null))],
    { launchStartsAt: '2026-12-01T00:00:00Z', launchEndsAt: '2026-12-07T00:00:00Z' });
  const { products, packages } = storeProducts({ current: launch, all: { default: def, launch } } as StoreOfferings, 'default');
  const life = products.find(p => p.plan === 'lifetime')!;
  assert.equal(activeLaunch(life, Date.parse('2026-12-03T00:00:00Z'))?.price, '$29.99');
  assert.equal(activeLaunch(life, Date.parse('2026-12-08T00:00:00Z')), null);
  assert.ok(packages.has('kmp_plus_lifetime_launch'));
});

test('Plus prices: offerings with no Plus product say STORE_PRODUCTS_MISSING (not a network error)', () => {
  const other = offering('default', [pkg('$rc_monthly', 'MONTHLY', product('monthly', 2.99, '$2.99', 'P1M'))]);
  assert.throws(() => storeProducts({ current: other, all: { default: other } } as StoreOfferings), /STORE_PRODUCTS_MISSING/);
  assert.throws(() => storeProducts({ current: null, all: {} }), /STORE_PRODUCTS_MISSING/);
});
