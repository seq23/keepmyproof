// Google Search Console access for the Boss OS search service account (GSC_SERVICE_ACCOUNT_JSON).
// Shared by scripts/ping-search.mjs (sitemap submission) and scripts/search-console.mjs (daily data).
import { createSign } from 'node:crypto';

export async function gscToken(sa, scope = 'https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/siteverification') {
  const now = Math.floor(Date.now() / 1000), b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` });
  if (!r.ok) throw Error(`token HTTP ${r.status}`);
  return (await r.json()).access_token;
}

/** The property the service account can read for this origin: sc-domain first, then the URL prefix. */
export async function gscProperty(auth, origin, preferred) {
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: auth });
  const sites = ((await r.json()).siteEntry || []).map((s) => s.siteUrl);
  const host = new URL(origin).host;
  return [preferred, `sc-domain:${host}`, `${origin}/`].find((p) => p && sites.includes(p)) || null;
}
