// Daily Search Console truth for keepmyproof.com (search-readiness e4, e5, i6), written by
// .github/workflows/search-console-daily.yml and committed to data/search-console/:
//   gsc_truth.json          query × page clicks, impressions, CTR and position, rolling 28 days
//   gsc_query_history.json  every query ever seen, with first/last seen and best position, so a target
//                           does not vanish when it leaves the 28-day window
//   index_coverage.json     URL Inspection state per page, 150 URLs a day (oldest-inspected first), 8 at a time
// Never prints a secret. Exit 2 = NAMED STOP [SECRET_MISSING_GSC_SERVICE_ACCOUNT_JSON]; 3 = [GSC_NO_ACCESS].
//   node scripts/search-console.mjs          (keys from the environment, e.g. Boss OS vault:run)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { SITE } from '../site/config.mjs';
import { gscToken, gscProperty } from './lib/gsc.mjs';

const DIR = new URL('../data/search-console/', import.meta.url);
const PER_DAY = 150, PARALLEL = 8;
const day = (d) => d.toISOString().slice(0, 10);
const read = (f, fallback) => (existsSync(new URL(f, DIR)) ? JSON.parse(readFileSync(new URL(f, DIR), 'utf8')) : fallback);
const write = (f, o) => writeFileSync(new URL(f, DIR), JSON.stringify(o, null, 1) + '\n');
const locsOf = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

async function sitemapUrls() {
  const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw Error(`${u} HTTP ${r.status}`); return r.text(); };
  const index = await get(`${SITE.origin}/sitemap.xml`);
  return /<sitemapindex/.test(index) ? (await Promise.all(locsOf(index).map(get))).flatMap(locsOf) : locsOf(index);
}

async function main() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) { console.error('NAMED STOP [SECRET_MISSING_GSC_SERVICE_ACCOUNT_JSON] nothing read; set the Actions secret'); process.exit(2); }
  const auth = { authorization: `Bearer ${await gscToken(JSON.parse(raw), 'https://www.googleapis.com/auth/webmasters')}` };
  const prop = await gscProperty(auth, SITE.origin, process.env.GSC_SITE_URL);
  if (!prop) { console.error(`NAMED STOP [GSC_NO_ACCESS] the service account cannot read a ${SITE.origin} property`); process.exit(3); }
  mkdirSync(DIR, { recursive: true });
  const now = new Date(), end = new Date(now.getTime() - 3 * 86400000), start = new Date(end.getTime() - 27 * 86400000);

  // 1. Query × page truth, rolling 28 days (Search Console data lags about 3 days).
  const rows = [];
  for (let startRow = 0; startRow < 100000; startRow += 25000) {
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/searchAnalytics/query`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(60000), body: JSON.stringify({ startDate: day(start), endDate: day(end), dimensions: ['query', 'page'], rowLimit: 25000, startRow, dataState: 'all' }) });
    if (!r.ok) throw Error(`searchAnalytics HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
    const got = (await r.json()).rows || [];
    rows.push(...got.map((x) => ({ query: x.keys[0], page: x.keys[1], clicks: x.clicks, impressions: x.impressions, ctr: Number(x.ctr.toFixed(4)), position: Number(x.position.toFixed(1)) })));
    if (got.length < 25000) break;
  }
  const sum = (k) => rows.reduce((a, x) => a + x[k], 0);
  write('gsc_truth.json', { schema: 'kmp-gsc-truth-v1', site: SITE.origin, property: prop, window: { start: day(start), end: day(end) }, generated_at: now.toISOString(),
    totals: { rows: rows.length, clicks: sum('clicks'), impressions: sum('impressions'), queries: new Set(rows.map((x) => x.query)).size, pages: new Set(rows.map((x) => x.page)).size }, rows });

  // 2. Query history: never forget a query once seen.
  const hist = read('gsc_query_history.json', { schema: 'kmp-gsc-query-history-v1', queries: {} });
  for (const x of rows) {
    const h = hist.queries[x.query] || (hist.queries[x.query] = { first_seen: day(end), best_position: x.position, pages: [] });
    h.last_seen = day(end); h.best_position = Math.min(h.best_position, x.position);
    if (!h.pages.includes(x.page)) h.pages = [...h.pages, x.page].slice(-10);
  }
  hist.updated_at = now.toISOString();
  write('gsc_query_history.json', hist);

  // 3. URL Inspection, rotating: never-inspected first, then oldest.
  const cov = read('index_coverage.json', { schema: 'kmp-index-coverage-v1', site: SITE.origin, urls: {} });
  const urls = await sitemapUrls();
  const live = new Set(urls);
  for (const u of Object.keys(cov.urls)) if (!live.has(u)) delete cov.urls[u];
  const queue = urls.slice().sort((a, b) => String(cov.urls[a]?.inspected_at || '').localeCompare(String(cov.urls[b]?.inspected_at || ''))).slice(0, PER_DAY);
  // A time budget, so a slow API ends the day's rotation early instead of hanging the job.
  const deadline = Date.now() + 8 * 60000;
  let done = 0, failed = 0, skipped = 0, i = 0;
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (i < queue.length) {
      const u = queue[i++];
      if (Date.now() > deadline) { skipped++; continue; }
      const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', { method: 'POST', signal: AbortSignal.timeout(30000), headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ inspectionUrl: u, siteUrl: prop }) }).catch(() => null);
      if (!r?.ok) { failed++; continue; }
      const s = (await r.json()).inspectionResult?.indexStatusResult || {};
      cov.urls[u] = { verdict: s.verdict || 'UNKNOWN', state: s.coverageState || 'unknown', last_crawl: s.lastCrawlTime || null, inspected_at: now.toISOString() };
      done++;
    }
  }));
  const states = {};
  for (const v of Object.values(cov.urls)) states[v.state] = (states[v.state] || 0) + 1;
  Object.assign(cov, { property: prop, generated_at: now.toISOString(), sitemap_urls: urls.length, inspected: Object.keys(cov.urls).length, states });
  write('index_coverage.json', cov);

  console.log(`OUTPUT search-console property=${prop} rows=${rows.length} clicks=${sum('clicks')} impressions=${sum('impressions')} inspected_today=${done} inspect_failed=${failed} inspect_skipped=${skipped} known=${cov.inspected}/${urls.length}`);
  if (queue.length && !done) { console.error(`NAMED STOP [URL_INSPECTION_FAILED] 0 of ${queue.length} inspections answered`); process.exit(4); }
}
main().catch((e) => { console.error(`NAMED STOP [SEARCH_CONSOLE_FAILED] ${e.message}`); process.exit(1); });
