// SYNDICATION: KeepMyProof's own Blogger blog and WordPress.com blog each get a short summary of
// one KeepMyProof page a day, linking back to the page. No one signs in after the one-time setup
// (scripts/syndication-setup.mjs). Run by .github/workflows/syndicate.yml after the site build.
//
// Lanes
//   blogger    Blogger API v3 posts.insert. Every run trades the stored Google refresh token
//              (KMP_BLOGGER_REFRESH_TOKEN, from a consent screen set to "In production", so it does
//              not expire after 7 days) for a one-hour access token held in memory only.
//   wordpress  WordPress.com REST v1.1 posts/new on keepmyproof.wordpress.com, sent with ONE stored
//              bearer token (KMP_WPCOM_ACCESS_TOKEN) from WordPress.com's authorization-code flow,
//              made by ~/bin/wpcom-connect.mjs kmp. WordPress.com tokens from that flow do not expire.
//              (The password grant is gone: application passwords need two-step login, which the
//              account does not have.) The app's client id and secret stay in the vault only.
//
// What a post says (never a copy of the page: that would be duplicate content):
//   the page's H1 as title, its answer-first paragraph (already through the site's fact and
//   banned-word gate), 3-5 of the page's own checklist bullets, the official source names and
//   check date when the page has them, "Educational only. Not legal advice.", and "Read the full
//   guide on KeepMyProof" linking to the canonical URL. A post whose text trips the site's banned
//   claim words (site/lib/gate.mjs) is never sent. Neither platform lets a free blog set
//   rel=canonical (Blogger's API has no field; WordPress.com free sites ignore it), so the visible
//   link back is the canonical signal.
//
// Which pages: English only (Spanish, Chinese and Korean wait), the five folder checklists first,
// then the state pages taken one folder at a time in turn (divorce first), so every folder leads.
//
// Limits: at most 1 post a day (Central) per platform; the ledger (data/syndication-ledger.json)
// means a page never goes to the same platform twice.
//
// Rule 0: one `OUTPUT syndicate …` census line every run. Missing secrets = NAMED STOP
// KMP_BLOGGER_NOT_SET_UP / KMP_WORDPRESS_NOT_SET_UP; a refused sign-in = KMP_BLOGGER_AUTH_FAILED /
// WPCOM_TOKEN_REFUSED (WordPress.com answered 401/403 to the stored token). Each is one Open Loops row (BOSS_OPEN_LOOPS_TOKEN intake, never an
// email), closed the first run it clears; exit 0, the next day's run retries. A lane that is set
// up, has pages and room, and posts nothing exits 1. No pages found at all exits 1.
//
//   node scripts/syndicate.mjs [--lane blogger|wordpress|all] [--dry-run]
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bannedWord, htmlText } from '../site/lib/gate.mjs';
import { reportToOpenLoops } from './lib/open-loops.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGIN = 'https://keepmyproof.com';
export const WPCOM_SITE = 'keepmyproof.wordpress.com';
export const DAILY_CAP = 1;
export const FOLDERS = ['divorce', 'workplace', 'va', 'executor', 'iep'];
export const SECRETS = {
  blogger: ['KMP_BLOGGER_CLIENT_ID', 'KMP_BLOGGER_CLIENT_SECRET', 'KMP_BLOGGER_REFRESH_TOKEN', 'KMP_BLOGGER_BLOG_ID'],
  wordpress: ['KMP_WPCOM_ACCESS_TOKEN'],
};
const SETUP = 'cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/syndication-setup.mjs';
const MIRROR = 'cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/mirror-syndication-secrets.mjs';
const WPCOM_CONNECT = `rerun ~/bin/wpcom-connect.mjs kmp (cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/bin/wpcom-connect.mjs kmp), then copy the token to GitHub: ${MIRROR}`;
export const STOP_WORDS = {
  KMP_BLOGGER_NOT_SET_UP: { title: 'KeepMyProof: Blogger auto-posting is not set up', next_step: `Enable the Blogger API and publish the consent screen in the rclone client's Google Cloud project, then run: ${SETUP} blogger` },
  KMP_BLOGGER_AUTH_FAILED: { title: 'KeepMyProof: Google refused the Blogger sign-in', next_step: `The saved Blogger sign-in was refused (revoked, or the consent screen is back in Testing). Run again: ${SETUP} blogger` },
  KMP_WORDPRESS_NOT_SET_UP: { title: 'KeepMyProof: WordPress.com auto-posting is not set up', next_step: `No KMP_WPCOM_ACCESS_TOKEN secret yet: ${WPCOM_CONNECT}` },
  WPCOM_TOKEN_REFUSED: { title: 'KeepMyProof: WordPress.com refused the saved posting token', next_step: `The stored KMP_WPCOM_ACCESS_TOKEN was refused (revoked or for the wrong account): ${WPCOM_CONNECT}` },
};
export const OPEN_LOOPS = { repo: 'seq23/keepmyproof', business: 'spry', finish: 'KeepMyProof guides post to its Blogger and WordPress.com blogs by themselves, 1 a day each' };

// ── reading the built site ────────────────────────────────────────────────────

const m1 = (re, s) => (re.exec(s) || [])[1];
const text = (h) => htmlText(h).replace(/\s+/g, ' ').trim();

/** What a post may carry from one built page, or null when the page is not a guide we post. */
export function readPage(html) {
  const url = m1(/<link rel="canonical" href="([^"]+)"/, html);
  if (!url || !url.startsWith(`${ORIGIN}/`)) return null;
  const path = url.slice(ORIGIN.length);
  if (/^\/(es|zh|ko)\//.test(path)) return null;
  const main = html.slice(html.indexOf('<main'));
  const h1 = m1(/<h1[^>]*>([\s\S]*?)<\/h1>/, main), answer = m1(/<p class="definition answer">([\s\S]*?)<\/p>/, main);
  if (!h1 || !answer) return null;
  // The page's own checklist: the first plain list whose items are not links.
  let bullets = [];
  for (const [, inner] of main.matchAll(/<ul>([\s\S]*?)<\/ul>/g)) {
    const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => x[1]);
    if (items.length >= 3 && !items.some(i => /<a\b/.test(i))) { bullets = items.map(text).slice(0, 5); break; }
  }
  if (bullets.length < 3) return null;
  const sourcesBlock = m1(/<ol class="sources">([\s\S]*?)<\/ol>/, main) || '';
  const sources = [...new Set([...sourcesBlock.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => text(x[1])))];
  const checked = m1(/Sources checked ([^<.]+(?:, \d{4})?)/, main);
  const folder = FOLDERS.find(f => path.startsWith(`/${f}/`));
  const kind = folder && /^\/[^/]+\/[^/]+\/[^/]+$/.test(path) ? 'state' : null;
  return { url, path, title: text(h1), answer: text(answer), bullets, sources, checked: checked?.trim() ?? null, kind, folder: folder ?? null };
}

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p)); else if (name.endsWith('.html')) out.push(p);
  }
  return out.sort();
}

/** The posting order: the five folder checklists (hubs.json order), then state pages folder by folder in turn. */
export function queue(dist, hubs) {
  const pages = new Map();
  for (const f of htmlFiles(dist)) {
    const p = readPage(readFileSync(f, 'utf8'));
    if (p) pages.set(p.path, p);
  }
  const checklists = Object.values(hubs.hubs).map(h => pages.get(`/${h.en.slug}`)).filter(Boolean).map(p => ({ ...p, kind: 'checklist' }));
  const byFolder = FOLDERS.map(f => [...pages.values()].filter(p => p.kind === 'state' && p.folder === f).sort((a, b) => a.path.localeCompare(b.path)));
  const states = [];
  for (let i = 0; byFolder.some(l => i < l.length); i++) for (const l of byFolder) if (i < l.length) states.push(l[i]);
  return [...checklists, ...states];
}

// ── the post ──────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function postHtml(p) {
  const lead = p.kind === 'state' ? 'Papers people often keep for this:' : 'What to gather:';
  return [
    `<p>${esc(p.answer)}</p>`,
    `<p><strong>${lead}</strong></p>`,
    `<ul>${p.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`,
    p.sources.length ? `<p>Facts from official sources: ${esc(p.sources.join('; '))}${p.checked ? ` (checked ${esc(p.checked)})` : ''}.</p>` : '',
    '<p><em>Educational only. Not legal advice.</em></p>',
    `<p><a href="${esc(p.url)}">Read the full guide on KeepMyProof</a></p>`,
  ].filter(Boolean).join('\n');
}

// ── state ─────────────────────────────────────────────────────────────────────

export const centralDay = (now) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const posted = (ledger, lane) => new Set(ledger.filter(e => e.lane === lane).map(e => e.url));
const postedOn = (ledger, lane, day) => ledger.filter(e => e.lane === lane && e.day === day).length;

class HttpError extends Error { constructor(status, body) { super(`HTTP ${status}: ${String(body).slice(0, 200)}`); this.status = status; } }

async function call(http, method, url, { json, form, token } = {}) {
  const headers = { 'user-agent': 'keepmyproof-syndicate/1' };
  let body;
  if (form) { body = new URLSearchParams(form).toString(); headers['content-type'] = 'application/x-www-form-urlencoded'; }
  else if (json) { body = JSON.stringify(json); headers['content-type'] = 'application/json'; }
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await http(url, { method, headers, body });
  const raw = await r.text();
  if (!r.ok) throw new HttpError(r.status, raw);
  return raw.trim() ? JSON.parse(raw) : {};
}

// ── lanes ─────────────────────────────────────────────────────────────────────

const LANES = {
  blogger: {
    stopPrefix: 'KMP_BLOGGER',
    stops: ['KMP_BLOGGER_NOT_SET_UP', 'KMP_BLOGGER_AUTH_FAILED'],
    authFailed: 'KMP_BLOGGER_AUTH_FAILED',
    async token(env, http) {
      return (await call(http, 'POST', 'https://oauth2.googleapis.com/token', { form: {
        client_id: env.KMP_BLOGGER_CLIENT_ID, client_secret: env.KMP_BLOGGER_CLIENT_SECRET,
        refresh_token: env.KMP_BLOGGER_REFRESH_TOKEN, grant_type: 'refresh_token' } })).access_token;
    },
    async post(env, http, token, p) {
      const res = await call(http, 'POST', `https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(env.KMP_BLOGGER_BLOG_ID)}/posts/`, {
        token, json: { kind: 'blogger#post', title: p.title, content: postHtml(p), labels: ['KeepMyProof', p.folder ?? 'checklists'] } });
      return res.url || res.id;
    },
  },
  wordpress: {
    stopPrefix: 'KMP_WORDPRESS',
    stops: ['KMP_WORDPRESS_NOT_SET_UP', 'WPCOM_TOKEN_REFUSED'],
    authFailed: 'WPCOM_TOKEN_REFUSED',
    // The stored token is the sign-in: no token call. A 401/403 on the post is WPCOM_TOKEN_REFUSED.
    refusedOnPost: true,
    async token(env) { return String(env.KMP_WPCOM_ACCESS_TOKEN).trim(); },
    async post(env, http, token, p) {
      const res = await call(http, 'POST', `https://public-api.wordpress.com/rest/v1.1/sites/${WPCOM_SITE}/posts/new`, {
        token, json: { title: p.title, content: postHtml(p), excerpt: p.answer, status: 'publish', tags: `KeepMyProof,${p.folder ?? 'checklists'}` } });
      return res.URL || res.ID;
    },
  },
};

/** One lane's run. Mutates `ledger`; returns its census row and any stop. Network only through `http`. */
export async function runLane(lane, { pages, ledger, env, http, now, dry }) {
  const L = LANES[lane], day = centralDay(now);
  const row = { lane, posted: 0, state: '' };
  const missing = SECRETS[lane].filter(k => !String(env[k] ?? '').trim());
  if (missing.length) return { ...row, state: 'not_set_up', stop: { code: `${L.stopPrefix}_NOT_SET_UP`, why: `missing ${missing.join(', ')}` } };
  const done = posted(ledger, lane);
  const todo = pages.filter(p => !done.has(p.url));
  const room = Math.max(DAILY_CAP - postedOn(ledger, lane, day), 0);
  const held = [];
  const next = [];
  for (const p of todo) {
    if (next.length >= room) break;
    const bad = bannedWord(htmlText(postHtml(p)));
    if (bad) { held.push(`${p.path} (${bad})`); continue; }
    next.push(p);
  }
  Object.assign(row, { unposted: todo.length, room, held });
  if (dry) return { ...row, state: 'dry_run', would_post: next.map(p => `${p.title} -> ${p.url}`) };
  if (!next.length) return { ...row, state: 'posting' };
  let token;
  try { token = await L.token(env, http); if (!token) throw new HttpError(0, 'no access_token'); }
  catch (e) { return { ...row, state: 'auth_failed', stop: { code: L.authFailed, why: String(e.message) } }; }
  row.state = 'posting';
  for (const p of next) {
    try {
      const id = await L.post(env, http, token, p);
      ledger.push({ lane, url: p.url, day, at: now.toISOString(), id: String(id ?? '') });
      row.posted++;
    } catch (e) {
      if (L.refusedOnPost && (e.status === 401 || e.status === 403)) return { ...row, state: 'auth_failed', stop: { code: L.authFailed, why: String(e.message) } };
      return { ...row, state: 'post_refused', error: String(e.message) };
    }
  }
  return row;
}

// ── main ──────────────────────────────────────────────────────────────────────

export async function main({ argv = process.argv.slice(2), env = process.env, http = fetch, now = new Date(),
  dist = join(ROOT, 'site/dist'), ledgerPath = join(ROOT, 'data/syndication-ledger.json'), log = console.log } = {}) {
  const laneArg = argv.includes('--lane') ? argv[argv.indexOf('--lane') + 1] : 'all';
  const lanes = laneArg === 'all' ? ['blogger', 'wordpress'] : [laneArg];
  if (!lanes.every(l => LANES[l])) { log(`NAMED STOP [SYNDICATE_BAD_LANE] ${laneArg}`); return 1; }
  const dry = argv.includes('--dry-run') || /^(1|true|yes)$/i.test(env.SYNDICATION_DRY_RUN ?? '');
  if (!existsSync(dist)) { log(`NAMED STOP [SYNDICATE_NO_SITE] ${relative(ROOT, dist)} is missing: run node site/build.mjs first`); return 1; }
  const pages = queue(dist, JSON.parse(readFileSync(join(ROOT, 'site/data/hubs.json'), 'utf8')));
  if (!pages.length) { log('NAMED STOP [SYNDICATE_NO_PAGES] the built site has no English checklist or state page to post'); return 1; }
  const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : [];
  const rows = [];
  for (const lane of lanes) rows.push(await runLane(lane, { pages, ledger, env, http, now, dry }));
  const stops = rows.filter(r => r.stop).map(r => r.stop);
  if (!dry) {
    writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
    const known = lanes.flatMap(l => LANES[l].stops);
    await reportToOpenLoops({ ...OPEN_LOOPS, known, stops, words: STOP_WORDS },
      { token: env.BOSS_OPEN_LOOPS_TOKEN, fetchImpl: http, log });
  }
  for (const s of stops) log(`NAMED STOP [${s.code}] ${s.why}. ${STOP_WORDS[s.code].next_step}`);
  for (const r of rows) {
    for (const h of r.held ?? []) log(`NAMED SKIP [BANNED_WORD] ${r.lane}: ${h} not posted`);
    for (const w of r.would_post ?? []) log(`dry-run ${r.lane}: would post ${w}`);
  }
  log(`OUTPUT syndicate ${dry ? 'dry-run ' : ''}pages=${pages.length} ${rows.map(r => `${r.lane}=${r.posted}(${r.state}${r.unposted !== undefined ? `,left=${r.unposted - r.posted}` : ''})`).join(' ')}`);
  let fail = 0;
  for (const r of rows) {
    if (r.state === 'post_refused') { log(`NAMED STOP [SYNDICATE_POST_REFUSED] ${r.lane}: ${r.error}`); fail = 1; }
    if (r.state === 'posting' && r.unposted && r.room && !r.posted) { log(`NAMED STOP [SYNDICATE_POSTED_NOTHING] ${r.lane}: ${r.unposted} pages waiting, room ${r.room}, nothing posted`); fail = 1; }
  }
  return fail;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().then((code) => process.exit(code));
