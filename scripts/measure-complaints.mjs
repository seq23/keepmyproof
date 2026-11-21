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
  { slug: 'talkingparents', name: 'TalkingParents', app: 'TalkingParents: Co-Parent App', id: 1092220726, kind: 'co-parenting app' },
];
// What was lost, named next to the loss word (review of #66, 21 Nov 2026: a bare "lost|gone" counted
// "BUGS ARE GONE" and "the price has gone up"). A review counts as data loss only when a loss word and a
// thing a person keeps in the app sit in the same clause, at most four words apart, in either order.
const LOSS = String.raw`(?:lost|lose|losing|loses|gone|disappeared|disappear|vanished|deleted|erased|wiped(?: out)?|missing)`;
const GAP = String.raw`(?:[^\s.!?;]+\s+){0,4}?`;
export const KEPT = {
  files: String.raw`(?:photos?|pictures?|pics|videos?|files?|documents?|images?|media|memories|everything|data|vault)`,
  messages: String.raw`(?:messages?|texts?|threads?|conversations?|chats?|records?|transcripts?|journal|entries)`,
};
const near = (noun) => new RegExp(String.raw`\b${LOSS}\s+${GAP}${noun}\b|\b${noun}\s+${GAP}${LOSS}\b`, 'gi');
// Not a loss: relief ("I thought I lost everything"), a negation or a worry ("can't be deleted", "from being
// deleted", "make sure my videos are not lost", "end up losing"), the person's own act ("I erased some videos
// by accident", "I deleted the app"), or an imperative ("Lose the videos when you load the app").
const RELIEF = /\bthought (?:i|we) (?:had )?(?:lost|lose)\b/i;
const NOT_A_LOSS = /\b(?:not|never|n't|cannot|can't|won't|wouldn't|from being|end up|afraid of|worried about|concerned about)\s+(?:\S+\s+){0,2}$|\b(?:i|we)\s+(?:\S+\s+)?$/i;
const IMPERATIVE = /(?:^|[.!?]\s+)$/;
const lostKind = (kind) => ({ test: (raw) => { const t = raw.replace(/[\u2018\u2019]/g, "'"); return !RELIEF.test(t) && [...t.matchAll(near(KEPT[kind]))].some((m) => {
  const before = t.slice(Math.max(0, m.index - 40), m.index), loss = new RegExp(String.raw`^${LOSS}\b`, 'i').test(m[0]);
  const at = loss ? before : t.slice(Math.max(0, m.index + m[0].search(new RegExp(String.raw`\b${LOSS}\b`, 'i')) - 40), m.index + m[0].search(new RegExp(String.raw`\b${LOSS}\b`, 'i')));
  if (NOT_A_LOSS.test(at)) return false;
  if (loss && IMPERATIVE.test(before) && /^lose\b/i.test(m[0])) return false;
  return true;
}); } });
export const THEMES = {
  lost_files: lostKind('files'),
  lost_messages: lostKind('messages'),
  price: /\b(?:subscription|subscribe|subscribed|expensive|overpriced|price|pricing|charged|charging|refund|paywall)\b/i,
};
export const MIN_SAMPLE = 20;

/** lost = a review that names lost photos/files OR lost messages (counted once). */
export function countThemes(reviews) {
  const counts = Object.fromEntries([...Object.keys(THEMES), 'lost'].map((k) => [k, 0]));
  for (const r of reviews) {
    const t = `${r.title}. ${r.body}`.replace(/\s+/g, ' ');
    let anyLost = false;
    for (const [k, re] of Object.entries(THEMES)) if (re.test(t)) { counts[k]++; if (k.startsWith('lost_')) anyLost = true; }
    if (anyLost) counts.lost++;
  }
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
  writeFileSync(file, JSON.stringify({ schema: 'kmp-alternatives-v1', method: 'Apple public reviews feed, US store, up to the 150 most recent reviews per app; a review counts as lost data only when it names what was lost (photos, videos or files; or messages and records) within four words of a loss word such as lost, gone or deleted, so \"bugs are gone\" or \"the price has gone up\" do not count; a price complaint names the subscription, price, charges or a refund. Rules: scripts/measure-complaints.mjs.', apps: rows, stops }, null, 1) + '\n');
  for (const r of rows) console.log(`${r.name}: ${r.sample} reviews, lost ${r.counts.lost} (files ${r.counts.lost_files}, messages ${r.counts.lost_messages}), price ${r.counts.price}`);
  if (prev) console.log(`previous run: ${prev.apps.map((a) => a.measured).join(',')}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
