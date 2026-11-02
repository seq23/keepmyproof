// After a deploy: tells search engines about the live pages. Reads the LIVE sitemaps (so it only
// announces what is really served), then: IndexNow (Bing, Yandex, Seznam, Naver…), Bing Webmaster
// sitemap + URL batch when BING_WEBMASTER_API_KEY is set, and Google Search Console sitemap
// submission when GSC_SERVICE_ACCOUNT_JSON is set and has access to the property. Never prints a secret.
//   node scripts/ping-search.mjs            (keys from the environment, e.g. Boss OS vault:run)
// Exit 2 = NAMED STOP [SITEMAP_EMPTY] or [INDEXNOW_KEY_NOT_SERVED]; a missing optional key is a NAMED NOTE.
import { createSign } from 'node:crypto';
import { SITE } from '../site/config.mjs';

const host = new URL(SITE.origin).host;
async function get(url) { const r = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw Error(`${url} HTTP ${r.status}`); return r.text(); }
const locsOf = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

async function gscToken(sa) {
  const now = Math.floor(Date.now() / 1000), b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/siteverification', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` });
  if (!r.ok) throw Error(`token HTTP ${r.status}`);
  return (await r.json()).access_token;
}

async function main() {
  const index = await get(`${SITE.origin}/sitemap.xml`), children = locsOf(index);
  const sitemaps = /<sitemapindex/.test(index) ? children : [`${SITE.origin}/sitemap.xml`];
  const urls = /<sitemapindex/.test(index) ? (await Promise.all(children.map(get))).flatMap(locsOf) : children;
  if (!urls.length) { console.error('NAMED STOP [SITEMAP_EMPTY] the live sitemap lists no page'); process.exit(2); }
  console.log(`live sitemap: ${sitemaps.length} sitemaps, ${urls.length} URLs`);

  // IndexNow: the key file must be served first.
  const keyLive = (await get(`${SITE.origin}/${SITE.indexNowKey}.txt`).catch(() => '')).trim();
  if (keyLive !== SITE.indexNowKey) { console.error('NAMED STOP [INDEXNOW_KEY_NOT_SERVED]'); process.exit(2); }
  for (let i = 0; i < urls.length; i += 10000) {
    const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: SITE.indexNowKey, keyLocation: `${SITE.origin}/${SITE.indexNowKey}.txt`, urlList: urls.slice(i, i + 10000) }) });
    console.log(`IndexNow: ${urls.slice(i, i + 10000).length} URLs -> HTTP ${r.status}`);
  }

  // Bing Webmaster: sitemap feeds plus the most important URLs (daily quota applies).
  const bing = process.env.BING_WEBMASTER_API_KEY;
  if (!bing) console.log('NAMED NOTE [SECRET_MISSING_BING_WEBMASTER_API_KEY] Bing covered by IndexNow only');
  else {
    const call = (m, body) => fetch(`https://ssl.bing.com/webmaster/api.svc/json/${m}?apikey=${encodeURIComponent(bing)}`, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) }).then(async (r) => `${r.status}${r.ok ? '' : ` ${(await r.text()).slice(0, 120)}`}`);
    for (const feed of [`${SITE.origin}/sitemap.xml`, ...sitemaps]) console.log(`Bing SubmitFeed ${feed.replace(SITE.origin, '')}: ${await call('SubmitFeed', { siteUrl: `${SITE.origin}/`, feedUrl: feed })}`);
    const top = urls.filter((u) => !/\/[a-z-]+\/[a-z0-9-]+\/[a-z-]+$/.test(u.replace(SITE.origin, ''))).slice(0, 100);
    console.log(`Bing SubmitUrlbatch (${top.length} hub and core URLs): ${await call('SubmitUrlbatch', { siteUrl: `${SITE.origin}/`, urlList: top })}`);
  }

  // Google Search Console: submit each sitemap to the property the service account can see.
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) { console.log('NAMED NOTE [SECRET_MISSING_GSC_SERVICE_ACCOUNT_JSON] Google not told; it will find /sitemap.xml through robots.txt'); return; }
  const token = await gscToken(JSON.parse(raw)), auth = { authorization: `Bearer ${token}` };
  const sites = ((await (await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: auth })).json()).siteEntry || []).map((s) => s.siteUrl);
  let prop = sites.find((s) => s === `sc-domain:${host}`) || sites.find((s) => s === `${SITE.origin}/`);
  if (!prop && SITE.googleVerificationFile) {
    // Become a verified owner through the ownership file the site serves, then add the property.
    const v = await fetch('https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE', { method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ site: { type: 'SITE', identifier: `${SITE.origin}/` } }) });
    console.log(`GSC ownership via ${SITE.googleVerificationFile}: HTTP ${v.status}`);
    if (v.ok) { const a = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(`${SITE.origin}/`)}`, { method: 'PUT', headers: auth }); console.log(`GSC add property: HTTP ${a.status}`); if (a.ok) prop = `${SITE.origin}/`; }
  }
  if (!prop) { console.log(`NAMED STOP [GSC_NO_ACCESS] the service account sees ${sites.length} properties, none is ${host}: add it as an owner of the ${host} property in Search Console`); process.exitCode = 3; return; }
  for (const sm of [`${SITE.origin}/sitemap.xml`, ...sitemaps]) {
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/sitemaps/${encodeURIComponent(sm)}`, { method: 'PUT', headers: auth });
    console.log(`GSC sitemap ${sm.replace(SITE.origin, '')}: HTTP ${r.status}`);
  }
}
main().catch((e) => { console.error(`NAMED STOP [PING_FAILED] ${e.message}`); process.exit(1); });
