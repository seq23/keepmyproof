// The app store this phone buys from, by platform. Every screen line that names a store, or says where to
// cancel, takes it from here, so the iPhone app never names Google Play and the Android app never names the
// App Store (Apple 2.3.10; review of #76, 24 Nov 2026). The web preview reads as iPhone.
import type { StringKey } from '../strings';
export type StoreName = 'App Store' | 'Google Play';
export const storeName = (os: string): StoreName => os === 'android' ? 'Google Play' : 'App Store';
/** The yearly plan's renewal terms, with that store's own cancel path. */
export const annualTermsKey = (os: string): StringKey => os === 'android' ? 'annualTermsAndroid' : 'annualTerms';
