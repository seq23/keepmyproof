// Counts complaints in competitors' most recent US App Store reviews (Apple's public reviews feed)
// and writes site/data/alternatives.json for the "alternative to" pages. Counts only: no review is
// quoted and no reviewer is named. Competitor names appear on the website only, never in store copy
// (scripts/validate.mjs honest-claims). Re-run monthly; each page shows the date and sample size.
//   node scripts/measure-complaints.mjs
// Exit 2 = NAMED STOP [NO_REVIEWS_READ] when no competitor's feed could be read.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const COMPETITORS = [
  { slug: 'keepsafe', name: 'Keepsafe', app: 'Secret Photo Vault: Keepsafe', id: 510873505, kind: 'photo vault' },
  { slug: 'private-photo-vault', name: 'Private Photo Vault', app: 'Private Photo Vault - Pic Safe', id: 417571834, kind: 'photo vault' },
  { slug: 'vaultaire', name: 'Vaultaire', app: 'Photo Vault - Vaultaire', id: 6758529311, kind: 'photo vault' },
  { slug: 'timestamp-it', name: 'Timestamp It', app: 'Timestamp It - Proof Camera', id: 327756085, kind: 'timestamp camera' },
  { slug: 'appclose', name: 'AppClose', app: 'AppClose', id: 1019290876, kind: 'co-parenting app' },
  { slug: 'ourfamilywizard', name: 'OurFamilyWizard', app: 'OurFamilyWizard Co-Parent App', id: 497405393, kind: 'co-parenting app' },
];
export const THEMES = {
  lost: /\b(?:lost|lose|losing|gone|disappeared|vanished|deleted my|wiped)\b/i,
  price: /\b(?:subscription|subscribe|subscribed|expensive|overpriced|price|pricing|charged|charging|refund|paywall)\b/i,
};
export const MIN_SAMPLE = 20;

export function countThemes(reviews) {
  const counts = Object.fromEntries(Object.keys(THEMES).map((k) => [k, 0]));
  for (const r of reviews) for (const [k, re] of Object.entries(THEMES)) if (re.test(`${r.title} ${r.body}`)) counts[k]++;
  return counts;
}

async function reviewsOf(id) {
  const out = [];
  for (let page = 1; page <= 3; page++) {
    const r = await fetch(`https://itunes.apple.com/us/rss/customerreviews/page=${page}/id=${id}/sortby=mostrecent/json`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) break;
    const entries = (await r.json())?.feed?.entry || [];
    const list = (Array.isArray(entries) ? entries : [entries]).filter((e) => e['im:rating']);
    if (!list.length) break;
    out.push(...list.map((e) => ({ title: e.title?.label || '', body: e.content?.label || '' })));
  }
  return out;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10), rows = [], stops = [];
  for (const c of COMPETITORS) {
    let reviews = [];
    try { reviews = await reviewsOf(c.id); } catch (e) { stops.push(`NAMED STOP [FEED_UNREAD] ${c.name}: ${e.message}`); continue; }
    if (reviews.length < MIN_SAMPLE) { stops.push(`NAMED STOP [SAMPLE_TOO_SMALL] ${c.name}: ${reviews.length} recent reviews (< ${MIN_SAMPLE}); no page`); continue; }
    rows.push({ ...c, measured: today, sample: reviews.length, counts: countThemes(reviews),
      store_url: `https://apps.apple.com/us/app/id${c.id}`, feed_url: `https://itunes.apple.com/us/rss/customerreviews/id=${c.id}/sortby=mostrecent/json` });
  }
  for (const s of stops) console.log(s);
  if (!rows.length) { console.error('NAMED STOP [NO_REVIEWS_READ] no competitor feed could be read'); process.exit(2); }
  const file = join(ROOT, 'site', 'data', 'alternatives.json');
  const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  writeFileSync(file, JSON.stringify({ schema: 'kmp-alternatives-v1', method: 'Apple public reviews feed, US store, up to the 150 most recent reviews per app; a review counts once per theme if its title or text matches the theme words in scripts/measure-complaints.mjs.', apps: rows, stops }, null, 1) + '\n');
  for (const r of rows) console.log(`${r.name}: ${r.sample} reviews, lost ${r.counts.lost}, price ${r.counts.price}`);
  if (prev) console.log(`previous run: ${prev.apps.map((a) => a.measured).join(',')}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
