// Where the app is, in words: one source for every sentence that names the stores (review of #66,
// 21 Nov 2026: FAQs said "coming soon to Google Play" only while the badges named both stores).
// Status comes from SITE.stores (site/config.mjs): a URL = live there, null = coming soon there.
import { SITE } from '../config.mjs';

const NAMES = {
  en: { appStore: 'the App Store (iPhone)', googlePlay: 'Google Play (Android)' },
  es: { appStore: 'el App Store (iPhone)', googlePlay: 'Google Play (Android)' },
  zh: { appStore: 'App Store（iPhone）', googlePlay: 'Google Play（Android）' },
  ko: { appStore: 'App Store(iPhone)', googlePlay: 'Google Play(Android)' },
};
const SAY = {
  en: { and: ' and ', live: (x) => `It is on ${x} now.`, soon: (x) => `It is coming soon to ${x}.` },
  es: { and: ' y ', live: (x) => `Ya está en ${x}.`, soon: (x) => `Llegará muy pronto a ${x}.` },
  zh: { and: '和', live: (x) => `现已登陆 ${x}。`, soon: (x) => `即将登陆 ${x}。` },
  ko: { and: '와 ', live: (x) => `지금 ${x}에서 받을 수 있습니다.`, soon: (x) => `${x} 출시 예정입니다.` },
};
const ORDER = ['appStore', 'googlePlay'];

/** The stores, split by status: { live: [...keys], soon: [...keys] }. */
export function storeStatus(stores = SITE.stores) {
  return { live: ORDER.filter((k) => stores[k]), soon: ORDER.filter((k) => !stores[k]) };
}
/** One sentence naming both stores with their real status, e.g. "It is coming soon to the App Store (iPhone) and Google Play (Android)." */
export function storeLine(lang, stores = SITE.stores) {
  const n = NAMES[lang], s = SAY[lang], { live, soon } = storeStatus(stores), names = (ks) => ks.map((k) => n[k]).join(s.and);
  return [live.length ? s.live(names(live)) : '', soon.length ? s.soon(names(soon)) : ''].filter(Boolean).join(' ');
}
/** The operating systems for search data: both, whatever the launch status. */
export const OPERATING_SYSTEMS = 'iOS, Android';
