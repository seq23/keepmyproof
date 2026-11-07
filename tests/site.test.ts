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

test('every language home links to every other language home, and llms.txt links to all four', () => {
  const { files, pages } = renderAll(fixture());
  const langs = ['en', 'es', 'zh', 'ko'] as const;
  const home = (l: string) => (PAGES.find((x) => x.id === 'home') as any)[l] ?? (PAGES.find((x) => x.id === 'checklists') as any)[l];
  for (const l of langs) {
    const s = files[fileOf(home(l))];
    assert.ok(s, `${l} home ${home(l)} emitted`);
    const hl = (o: string) => (o === 'zh' ? 'zh-Hans' : o);
    // A page with a translation links to it (zh/ko homes pair with /checklists); otherwise to that language's home.
    const target = (o: string) => pages.find((p: any) => p.path === home(l))?.alt?.[o] ?? home(o);
    for (const o of langs.filter((x) => x !== l)) assert.ok(s.includes(`<a class="lang" href="${target(o)}" hreflang="${hl(o)}"`), `${l} home links to ${o} at ${target(o)}`);
  }
  for (const l of langs) assert.ok(files['llms.txt'].includes(`(${SITE.origin}${home(l)})`), `llms.txt links ${l} home`);
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

test('before launch: "coming soon to Google Play", no store link, no install link, never a rating, and only the approved list prices as coming-soon Offers; after the one switch: store links on every kind of page and offers whose prices are on the page', () => {
  const before = renderAll(fixture());
  const listPrices = ['0', SITE.prices.yearlyUSD, SITE.prices.lifetimeUSD];
  let apps = 0, withOffer = 0, noOffer = 0;
  for (const [p, s] of html(before.files)) {
    // Competitor pages cite competitors' App Store pages; no page may link to a store for our own app.
    assert.ok(!/play\.google\.com|apps\.apple\.com\/[^"]*keepmyproof|class="btn" href="https:\/\/apps\.apple/.test(s), p);
    for (const app of graph(s).filter((n) => /Application$/.test(n['@type']))) {
      assert.ok(!app.installUrl && !app.aggregateRating && !app.review, `${p} app schema`);
      if (app['@type'] !== 'SoftwareApplication') { assert.ok(!app.offers, `${p} tool schema has no offers`); continue; }
      apps++;
      // Search-readiness c5: an Offer price only where the visible page prints it; anywhere else the app node has no offers.
      const shown = listPrices.slice(1).every((pr) => visible(s).includes(`$${pr}`));
      if (!shown) { assert.ok(!app.offers, `${p} shows no price, so its app schema carries no Offer`); noOffer++; continue; }
      withOffer++;
      // Search-readiness c3: a priced Offer, never an invented price, never a claim it can be bought today.
      assert.deepEqual(app.offers.map((o: any) => o.price), listPrices, `${p} offers are the approved list prices`);
      for (const o of app.offers) {
        assert.ok(o.priceCurrency === 'USD' && !o.availability, `${p} offer currency, no availability claim`);
        assert.equal(o.url, `${SITE.origin}/#price`, `${p} offer points at the price section`);
        assert.ok(o.description, `${p} offer says coming soon`);
      }
    }
  }
  assert.ok(apps > 100, `every kind of page carries the app node (${apps})`);
  assert.ok(withOffer >= 2 && noOffer > 100, `offers only on the pages that print the prices (${withOffer} with, ${noOffer} without)`);
  const home = before.files['index.html'];
  assert.ok(home.includes('<h2 id="price">'), 'home has the price section the offers point at');
  for (const pr of listPrices.slice(1)) assert.ok(visible(home).includes(`$${pr}`), `home shows $${pr}`);
  for (const o of graph(home).find((n) => n['@type'] === 'SoftwareApplication').offers) assert.ok(visible(home).includes(o.description), 'offer description is what the page says');
  assert.ok(visible(before.files['index.html']).includes('Coming soon to the App Store (iPhone) and Google Play (Android).'));
  const statePage = before.pages.find((p) => p.state && p.state.lang === 'en')!;
  assert.ok(visible(before.files[statePage.file]).includes('Coming soon to the App Store (iPhone) and Google Play (Android).'));
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
      assert.deepEqual(app.installUrl, [SITE.stores.googlePlay]);
      for (const o of app.offers) assert.ok(o.url === SITE.stores.googlePlay && !o.description, `${lang} offer points at the store, no coming soon`);
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

test('every hreflang, in the head or on a language link, points at an emitted page in that language', () => {
  const { files } = renderAll(fixture());
  const langOf = (s: string) => /<html lang="([^"]+)"/.exec(s)?.[1];
  const fileFor = (href: string) => { const p = href.replace(SITE.origin, ''); return files[fileOf(p)] ?? files[`${p.replace(/^\//, '')}/index.html`]; };
  let n = 0;
  for (const [p, s] of html(files)) {
    if (/<script type="application\/ld\+json">/.test(s) === false) continue;
    const refs = [...s.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g), ...s.matchAll(/<a class="lang" href="([^"]+)" hreflang="([^"]+)"/g)]
      .map((m) => (m[0].startsWith('<link') ? { lang: m[1], href: m[2] } : { lang: m[2], href: m[1] }));
    for (const { lang, href } of refs) {
      const target = fileFor(href);
      assert.ok(target, `${p}: hreflang ${lang} -> ${href} is not an emitted page`);
      if (lang !== 'x-default') assert.equal(langOf(target!), lang, `${p}: hreflang ${lang} -> ${href} is a ${langOf(target!)} page`);
      n++;
    }
  }
  assert.ok(n > 100, `only ${n} hreflang references read`);
});

test('state pages name each source once and point facts to it by number; neighbour links and the state index never repeat a page title per state (template filler)', () => {
  const fx = fixture();
  // All three facts on a state page share one source, as most real executor and IEP pages do.
  for (const e of Object.values((fx.facts.executor[0] as any).states) as any[]) for (const f of e.facts) f.source_url = e.facts[0].source_url;
  const verified: Record<string, string> = {};
  const { factKey } = require('../site/lib/gate.mjs');
  for (const e of Object.values((fx.facts.executor[0] as any).states) as any[]) for (const f of e.facts) verified[factKey(f)] = '2026-11-02';
  fx.verified.executor = verified;
  const { files } = renderAll(fx);
  const ca = files['executor/fixture-topic/california.html'];
  assert.ok(ca, 'California state page emitted');
  const factsUl = /<ul class="facts">([\s\S]*?)<\/ul>/.exec(ca)![1], sources = /<ol class="sources">([\s\S]*?)<\/ol>/.exec(ca)![1];
  assert.equal((factsUl.match(/<li>/g) ?? []).length, 3, 'one list item per fact');
  assert.equal((factsUl.match(/href="https:\/\/courts\.example\.gov\/ca\/rule-1"/g) ?? []).length, 3, 'each fact links its source');
  assert.equal((sources.match(/<li>/g) ?? []).length, 1, 'the shared source is listed once');
  assert.equal((visible(factsUl).match(/California Fixture Court/g) ?? []).length, 0, 'the source name is not repeated after each fact');
  const near = /<h2>Neighbouring states<\/h2><ul class="links">([\s\S]*?)<\/ul>/.exec(ca)![1];
  assert.ok(/>Oregon<\/a>/.test(near) || />Nevada<\/a>/.test(near), 'neighbour links name the state');
  assert.ok(!/Fixture rules in/.test(near), 'neighbour links do not repeat the page title');
  const index = visible(files['executor/index.html']);
  assert.equal((index.match(/Fixture rules in/g) ?? []).length, 0, 'the state index does not repeat the subtopic title once per state');
  assert.equal((index.match(/Fixture rules/g) ?? []).length, 1, 'the state index names the subtopic once');
});
