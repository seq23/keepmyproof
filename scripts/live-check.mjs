// Post-deploy live check (search-readiness h4): what keepmyproof.com really serves after a deploy, read
// from the edge, not from the build. Crawl files, icons, the share card, the homepage's structured data,
// the IndexNow key, the About and vault pages, a real 404, and a sample of sitemap URLs answering on the
// first hop. Read-only, no credentials. Exit 1 with every failure named.
//   node scripts/live-check.mjs [origin]
import { SITE } from '../site/config.mjs';

const origin = process.argv[2] || SITE.origin, bad = [], ok = [];
const get = (path, opts = {}) => fetch(path.startsWith('http') ? path : origin + path, { redirect: 'manual', signal: AbortSignal.timeout(20000), ...opts }).catch((e) => ({ status: 0, error: e.message, headers: new Map(), text: async () => '' }));
const check = (name, pass, why) => (pass ? ok : bad).push(pass ? name : `${name}: ${why}`);

const robots = await get('/robots.txt'), robotsText = await robots.text();
check('robots.txt', robots.status === 200 && /Sitemap: https:\/\/keepmyproof\.com\/sitemap\.xml/.test(robotsText) && /User-agent: GPTBot\s+Allow: \//.test(robotsText), `status ${robots.status}, sitemap line or AI crawlers missing`);
const index = await get('/sitemap.xml'), indexText = await index.text();
const children = [...indexText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check('sitemap index', index.status === 200 && children.length >= 2, `status ${index.status}, ${children.length} child sitemaps`);
const urls = [];
for (const c of children) { const r = await get(c), t = await r.text(); check(`sitemap ${c.replace(origin, '')}`, r.status === 200, `status ${r.status}`); urls.push(...[...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])); }
check('sitemap URLs', urls.length > 100, `only ${urls.length}`);
for (const f of ['/llms.txt', '/favicon.ico', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/og.png', '/site.webmanifest', '/logo.svg']) { const r = await get(f); check(f, r.status === 200, `status ${r.status}`); }
const key = await get(`/${SITE.indexNowKey}.txt`);
check('IndexNow key', key.status === 200 && (await key.text()).trim() === SITE.indexNowKey, `status ${key.status} or wrong body`);
const home = await get('/'), html = await home.text();
const graph = (() => { try { return JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1])['@graph']; } catch { return []; } })();
const org = graph.find((n) => n['@type'] === 'Organization');
check('home JSON-LD', ['Organization', 'WebSite', 'WebPage', 'FAQPage', 'SoftwareApplication'].every((t) => graph.some((n) => n['@type'] === t)), `types: ${graph.map((n) => n['@type']).join(', ')}`);
check('Organization sameAs and parent', org?.sameAs?.length && org?.parentOrganization?.name, 'sameAs or parentOrganization missing');
// No analytics (owner ruling 6 Nov 2026; the privacy page says so): the edge must not inject a third-party
// script such as Cloudflare Web Analytics. Fetched as a browser would, since injection only targets browsers.
const asBrowser = await (await get('/', { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36' } })).text();
const thirdParty = [...asBrowser.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map((m) => m[1]);
check('no third-party script (no analytics)', asBrowser.length > 1000 && !thirdParty.length && !/cloudflareinsights/.test(asBrowser), `served ${thirdParty.join(', ') || 'a beacon'}`);
check('home links About', /href="\/about"/.test(html), 'no /about link');
for (const p of ['/about', '/vault', '/es/boveda', '/custody-log']) { const r = await get(p); check(p, r.status === 200, `status ${r.status}`); }
const nf = await get(`/no-such-page-${Date.now()}`);
check('real 404', nf.status === 404, `status ${nf.status}`);
const sample = urls.filter((_, i) => i % Math.max(1, Math.floor(urls.length / 25)) === 0).slice(0, 25);
const firstHop = await Promise.all(sample.map(async (u) => [u, (await get(u)).status]));
for (const [u, s] of firstHop) if (s !== 200) bad.push(`${u.replace(origin, '')}: answers ${s} on the first hop`);
check(`${sample.length} sampled sitemap URLs answer 200 on the first hop`, firstHop.every(([, s]) => s === 200), 'see above');

console.log(`OUTPUT live-check origin=${origin} passed=${ok.length} failed=${bad.length} sitemap_urls=${urls.length}`);
for (const b of bad) console.error(`NAMED STOP [LIVE_CHECK] ${b}`);
process.exit(bad.length ? 1 : 0);
