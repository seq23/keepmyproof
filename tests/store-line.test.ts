// Every sentence about where the app is names both stores from one source, SITE.stores (review of #66,
// 21 Nov 2026: FAQs said "coming soon to Google Play" only, and the search data said Android only).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';
import { htmlText } from '../site/lib/gate.mjs';
import { storeLine } from '../site/lib/stores.mjs';

test('no page names one store as the only place the app is coming, and the search data lists both systems', () => {
  const { files } = renderAll();
  const bad: string[] = [];
  for (const [f, h] of Object.entries(files)) {
    if (!f.endsWith('.html')) continue;
    const t = htmlText(h);
    if (/coming soon to Google Play\.|iPhone after that|llegará muy pronto a Google Play\.|después, en iPhone|vendrá después|即将登陆 Google Play。|(?<!와 )Google Play 출시 예정입니다/i.test(t)) bad.push(f);
    for (const m of h.matchAll(/"operatingSystem":"([^"]+)"/g)) if (m[1] !== 'Any (runs in the browser)' && m[1] !== 'iOS, Android') bad.push(`${f}: ${m[1]}`);
  }
  assert.deepEqual(bad.slice(0, 5), []);
});

test('the store line follows SITE.stores for each store separately, in every language', () => {
  assert.equal(storeLine('en', { appStore: null, googlePlay: null }), 'It is coming soon to the App Store (iPhone) and Google Play (Android).');
  assert.equal(storeLine('en', { appStore: 'https://apps.apple.com/app/id6834891698', googlePlay: null }), 'It is on the App Store (iPhone) now. It is coming soon to Google Play (Android).');
  for (const l of ['es', 'zh', 'ko']) { const s = storeLine(l, { appStore: null, googlePlay: null }); assert.ok(s.includes('App Store') && s.includes('Google Play'), l); }
});
