// Monthly watch on Vaultaire (the incumbent; PLAN.md "Watch him"): diffs vaultaire.app's sitemap
// against last month's copy in data/watch/vaultaire-sitemap.json. New English pages that touch our
// five folders are written to data/watch/vaultaire-diff.json and their topics are added as seeds to
// search-loop.config.json, so the search-loop engine builds pages on them that month.
//   node scripts/vaultaire-diff.mjs
// Exit 2 = NAMED STOP [SITEMAP_UNREAD] (no URL read). Names stay on the website side only (never store copy).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = join(ROOT, 'data', 'watch', 'vaultaire-sitemap.json'), DIFF = join(ROOT, 'data', 'watch', 'vaultaire-diff.json'), CFG = join(ROOT, 'search-loop.config.json');
export const OURS = { divorce: /divorce|custody|co-?parent|separation|alimony|child-support/i, workplace: /workplace|harass|retaliat|discriminat|wage|hostile-work|employ/i,
  va: /\bva\b|veteran|military|dd-?214|disability-claim/i, executor: /executor|estate|probate|death|inherit|will-|funeral|deceased/i, iep: /\biep\b|special-ed|school|504-plan/i };
const LANG_PREFIX = /^https:\/\/vaultaire\.app\/[a-z]{2}(?:-[a-z]{2,4})?\//i;

async function locs(url, depth = 0) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'KeepMyProof-sitemap-watch' } });
  if (!r.ok) throw Error(`${url} HTTP ${r.status}`);
  const xml = await r.text(), all = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (/<sitemapindex/.test(xml) && depth < 2) return (await Promise.all(all.map((u) => locs(u, depth + 1)))).flat();
  return all;
}
/** English pages that touch one of our folders: { url, folder, seed }. */
export function ourTopics(urls) {
  const out = [];
  for (const u of urls) {
    if (LANG_PREFIX.test(u)) continue;
    const path = new URL(u).pathname, folder = Object.keys(OURS).find((k) => OURS[k].test(path));
    if (folder) out.push({ url: u, folder, seed: path.split('/').filter(Boolean).pop().replace(/[-_]+/g, ' ').replace(/\b(iphone|android|app|vaultaire)\b/gi, '').replace(/\s+/g, ' ').trim() });
  }
  return out;
}

async function main() {
  let urls;
  try { urls = [...new Set(await locs('https://vaultaire.app/sitemap.xml'))]; } catch (e) { console.error(`NAMED STOP [SITEMAP_UNREAD] ${e.message}`); process.exit(2); }
  if (!urls.length) { console.error('NAMED STOP [SITEMAP_UNREAD] 0 URLs'); process.exit(2); }
  const total = urls.length;
  urls = urls.filter((u) => !LANG_PREFIX.test(u)); // translations of the same pages: English is enough to see a new topic
  const prev = existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, 'utf8')) : null, today = new Date().toISOString().slice(0, 10);
  const before = new Set(prev?.urls || []), added = prev ? urls.filter((u) => !before.has(u)) : [], removed = prev ? prev.urls.filter((u) => !urls.includes(u)) : [];
  const hits = ourTopics(added);
  writeFileSync(SNAP, JSON.stringify({ checked: today, all_languages: total, english: urls.length, urls: urls.sort() }, null, 1) + '\n');
  writeFileSync(DIFF, JSON.stringify({ checked: today, previous: prev?.checked || null, added: added.length, removed: removed.length, in_our_folders: hits }, null, 1) + '\n');
  if (hits.length) {
    const cfg = JSON.parse(readFileSync(CFG, 'utf8')), seeds = new Set(cfg.topics);
    for (const h of hits) if (h.seed.split(' ').length >= 2) seeds.add(h.seed.toLowerCase());
    cfg.topics = [...seeds].slice(0, 80);
    writeFileSync(CFG, JSON.stringify(cfg, null, 2) + '\n');
  }
  console.log(prev ? `vaultaire: ${urls.length} URLs (${added.length} new, ${removed.length} gone since ${prev.checked}); ${hits.length} new in our folders${hits.length ? ` -> seeds added: ${hits.map((h) => `${h.folder}: ${h.seed}`).join('; ')}` : ''}`
    : `vaultaire: ${urls.length} URLs recorded as the first snapshot (NAMED NOTE [FIRST_SNAPSHOT] the diff starts next month)`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
