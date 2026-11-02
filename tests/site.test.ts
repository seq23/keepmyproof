import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SITE, PAGES } from '../site/config.mjs';
import { render, renderAll, legalSections } from '../site/build.mjs';
import { fixture } from './site-fixture';
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

test('every page has a self canonical and hreflang twins that exist and link back; noindex only on utility pages; the split sitemaps list exactly the indexable pages', () => {
  const { files, pages } = renderAll(fixture());
  assert.ok(pages.some((p) => p.state), 'fixture state pages rendered');
  const byPath = new Map(pages.map((p) => [p.path, p]));
  for (const p of pages.filter((x) => !x.external)) {
    const s = files[p.file];
    assert.ok(s, `${p.path} emitted`);
    assert.ok(s.includes(`<link rel="canonical" href="${SITE.origin}${p.path}">`), `${p.path} canonical`);
    for (const [l, path] of Object.entries(p.alt || {})) {
      const twin = byPath.get(path as string);
      assert.ok(twin, `${p.path} twin ${l} ${path} exists`);
      assert.ok(s.includes(`hreflang="${l === 'zh' ? 'zh-Hans' : l}" href="${SITE.origin}${path}"`), `${p.path} hreflang ${l}`);
      assert.equal(twin!.alt?.[Object.entries(p.alt!).find(([, v]) => v === p.path)![0]], p.path, `${path} links back to ${p.path}`);
    }
    const fixed = PAGES.find((x) => Object.values(x).includes(p.path));
    assert.equal(s.includes('noindex'), fixed ? !fixed.index : false, `${p.path} robots`);
  }
  const children = [...files['sitemap.xml'].matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replace(SITE.origin + '/', ''));
  assert.ok(children.length >= 2 && children.every((c) => files[c]), 'sitemap index points at emitted sitemaps');
  const locs = children.flatMap((c) => [...files[c].matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])).sort();
  assert.deepEqual(locs, pages.filter((p) => p.index).map((p) => SITE.origin + p.path).sort());
  assert.ok(files['robots.txt'].includes(`Sitemap: ${SITE.origin}/sitemap.xml`));
  assert.equal(files[`${SITE.indexNowKey}.txt`], SITE.indexNowKey);
});

test('before launch: "coming soon to Google Play", no store link, no offers and never a rating; after the one switch: store links on every kind of page and offers whose prices are on the page', () => {
  const before = renderAll(fixture());
  for (const [p, s] of html(before.files)) {
    // Competitor pages cite competitors' App Store pages; no page may link to a store for our own app.
    assert.ok(!/play\.google\.com|apps\.apple\.com\/[^"]*keepmyproof|class="btn" href="https:\/\/apps\.apple/.test(s), p);
    for (const app of graph(s).filter((n) => /Application$/.test(n['@type']))) assert.ok(!app.offers && !app.installUrl && !app.aggregateRating && !app.review, `${p} app schema`);
  }
  assert.ok(visible(before.files['index.html']).includes('Coming soon to Google Play.'));
  const statePage = before.pages.find((p) => p.state && p.state.lang === 'en')!;
  assert.ok(visible(before.files[statePage.file]).includes('Coming soon to Google Play.'));
  const saved = { ...SITE.stores };
  try {
    SITE.stores.googlePlay = 'https://play.google.com/store/apps/details?id=com.keepmyproof.app';
    const after = renderAll(fixture());
    for (const p of [after.pages.find((x) => x.path === '/')!, after.pages.find((x) => x.state && x.state.lang === 'es')!]) {
      const s = after.files[p.file];
      assert.ok(s.includes(`href="${SITE.stores.googlePlay}"`), `${p.path} store link`);
      assert.ok(!visible(s).includes('Coming soon') && !visible(s).includes('Muy pronto'), `${p.path} no coming soon`);
    }
    for (const lang of ['en', 'es'] as const) {
      const s = after.files[fileOf(PAGES[0][lang])], app = graph(s).find((n) => n['@type'] === 'SoftwareApplication');
      assert.ok(!app.aggregateRating);
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
