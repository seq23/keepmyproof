import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SITE, PAGES } from '../site/config.mjs';
import { render, legalSections } from '../site/build.mjs';
import { approvedListPrice } from '../src/billing/provider';
import { FREE_LIMIT } from '../src/core/vault';
import topics from '../topics.json';

const html = (files: Record<string, string>) => Object.entries(files).filter(([p]) => p.endsWith('.html') && p !== '404.html');
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const visible = (s: string) => decode(s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<head>[\s\S]*?<\/head>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const graph = (s: string) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(s)![1])['@graph'] as any[];
const fileOf = (path: string) => (path.endsWith('/') ? `${path}index.html` : `${path}.html`).slice(1);

test('every launch folder and checklist item from topics.json is on the English and Spanish home pages', () => {
  const files = render(), launch = topics.topics.filter(t => t.release === 'launch');
  assert.equal(launch.length, topics.launch_folder_count);
  for (const lang of ['en', 'es'] as const) {
    const page = visible(files[fileOf(PAGES[0][lang])]);
    for (const t of launch) {
      assert.ok(page.includes((t as any).display_name[lang]), `${lang} ${t.id}`);
      for (const item of (t as any).checklist_items) assert.ok(page.includes(item.name[lang]), `${lang} ${item.id}`);
    }
  }
});

test('every page has a self canonical, hreflang pairs that exist, and noindex only on utility pages; sitemap lists exactly the indexable pages', () => {
  const files = render(), pages = html(files);
  assert.equal(pages.length, PAGES.length * 2);
  for (const p of PAGES) for (const lang of ['en', 'es'] as const) {
    const s = files[fileOf(p[lang])];
    assert.ok(s, `${p[lang]} emitted`);
    assert.ok(s.includes(`<link rel="canonical" href="${SITE.origin}${p[lang]}">`), `${p[lang]} canonical`);
    for (const l of ['en', 'es'] as const) assert.ok(s.includes(`hreflang="${l}" href="${SITE.origin}${p[l]}"`), `${p[lang]} hreflang ${l}`);
    assert.equal(s.includes('noindex'), !p.index, `${p[lang]} robots`);
  }
  const locs = [...files['sitemap.xml'].matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort();
  assert.deepEqual(locs, PAGES.filter(p => p.index).flatMap(p => [SITE.origin + p.en, SITE.origin + p.es]).sort());
  assert.ok(files['robots.txt'].includes(`Sitemap: ${SITE.origin}/sitemap.xml`));
  assert.equal(files[`${SITE.indexNowKey}.txt`], SITE.indexNowKey);
});

test('before launch: "coming soon", no store link or badge, no app or offer schema; after: links and offers whose prices are on the page', () => {
  const before = render();
  for (const [p, s] of html(before)) {
    assert.ok(!/apps\.apple\.com|play\.google\.com|MobileApplication|SoftwareApplication/.test(s), p);
  }
  assert.ok(visible(before['index.html']).includes('Coming soon to the App Store and Google Play.'));
  const saved = { ...SITE.stores };
  try {
    SITE.stores.appStore = 'https://apps.apple.com/us/app/keepmyproof/id1'; SITE.stores.googlePlay = 'https://play.google.com/store/apps/details?id=com.keepmyproof.app';
    for (const lang of ['en', 'es'] as const) {
      const s = render()[fileOf(PAGES[0][lang])], app = graph(s).find(n => n['@type'] === 'MobileApplication');
      assert.ok(s.includes(`href="${SITE.stores.appStore}"`) && s.includes(`href="${SITE.stores.googlePlay}"`));
      assert.ok(!visible(s).includes('Coming soon') && !visible(s).includes('Muy pronto'));
      for (const o of app.offers.filter((o: any) => o.price !== '0')) assert.ok(visible(s).includes(`$${o.price}`), `${lang} ${o.price}`);
    }
  } finally { Object.assign(SITE.stores, saved); }
});

test('site prices and free limit are the app\'s approved ones, and the published Terms state the same prices', () => {
  assert.equal(SITE.freeItems, FREE_LIMIT);
  assert.ok(approvedListPrice({ id: 'a', plan: 'annual', price: '', amount: Number(SITE.prices.yearlyUSD), currency: 'USD' }));
  assert.ok(approvedListPrice({ id: 'l', plan: 'lifetime', price: '', amount: Number(SITE.prices.lifetimeUSD), currency: 'USD' }));
  for (const lang of ['en', 'es']) {
    const { terms } = legalSections(readFileSync(`store/${lang}.md`, 'utf8')), text = terms.join(' ');
    for (const p of Object.values(SITE.prices)) assert.ok(text.includes(`$${p}`), `${lang} terms ${p}`);
    assert.ok(text.includes(String(SITE.freeItems)));
  }
  const files = render();
  for (const [p, s] of html(files)) for (const q of graph(s).filter(n => n['@type'] === 'FAQPage').flatMap(n => n.mainEntity))
    assert.ok(visible(s).includes(q.name) && visible(s).includes(q.acceptedAnswer.text), `${p} FAQ visible`);
});
