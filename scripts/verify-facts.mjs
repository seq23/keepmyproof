// Re-fetches every source in site/data/facts/<folder>/*.json and keeps a fact only if its quote is
// on the page (whitespace-, case- and typography-insensitive) and it passes the offline gate
// (official source, no banned claim word, every number in the claim is in the quote).
// Writes site/data/verified/<folder>.json: the verified fact keys with their check date, and every
// fact or state that was dropped as a NAMED STOP line. The site generator publishes only facts
// whose key is in that manifest, and only states with at least 3 of them.
//   node scripts/verify-facts.mjs [--folder divorce] [--keep-on-fetch-error]
// Exit 0 = manifests written and at least one state page publishable; 2 = NAMED STOP [NO_FACTS] or
// [NOTHING_VERIFIED]. --keep-on-fetch-error (the weekly refresh) keeps a fact's previous check date
// when its source cannot be fetched at all, so one flaky government server does not unpublish pages;
// a page that answers and no longer has the quote always drops the fact.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { factProblems, factKey, quoteOnPage, sourceText, gateState, claimCounts } from '../site/lib/gate.mjs';
import { STATES } from '../site/lib/states.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FOLDERS = ['divorce', 'workplace', 'va', 'executor', 'iep'];
// KMP_FACTS_DIR / KMP_VERIFIED_DIR: preview a research branch's files without touching the repo's.
const FACTS_DIR = process.env.KMP_FACTS_DIR || join(ROOT, 'site', 'data', 'facts'), OUT_DIR = process.env.KMP_VERIFIED_DIR || join(ROOT, 'site', 'data', 'verified');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 KeepMyProof-fact-check';

/** Fetch a source as text. Some hosts (dol.gov) refuse a browser User-Agent and some states (CO, KY, ME,
 * MI, VT) refuse plain curl, so: plain `curl -sL` first, then a browser User-Agent on any 4xx or failure,
 * then Node fetch. PDFs go through pdftotext when installed. */
function curl(url, ua) {
  const args = ['-sL', '--max-time', '30', '-o', '-', '-w', '\n%{http_code}', ...(ua ? ['-A', ua] : []), url];
  const out = execFileSync('curl', args, { maxBuffer: 64 << 20 });
  const cut = out.lastIndexOf(0x0a), code = Number(out.subarray(cut + 1).toString());
  return { code, body: out.subarray(0, cut) };
}
const asText = (body) => (body.subarray(0, 5).toString() === '%PDF-' ? pdfText(body) : sourceText(body.toString('utf8')));
export async function fetchSourceText(url) {
  const tried = [];
  for (const ua of [null, UA]) {
    try { const r = curl(url, ua); tried.push(`curl${ua ? '+UA' : ''} ${r.code}`); if (r.code >= 200 && r.code < 300 && r.body.length > 100) return asText(r.body); }
    catch (e) { tried.push(`curl${ua ? '+UA' : ''} ${String(e.message).slice(0, 40)}`); }
  }
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
    tried.push(`fetch ${r.status}`);
    if (r.ok) return asText(Buffer.from(await r.arrayBuffer()));
  } catch (e) { tried.push(`fetch ${e.message}`); }
  throw Error(`FETCH_FAILED ${tried.join(', ')}`);
}
function pdfText(buf) {
  try { return execFileSync('pdftotext', ['-q', '-', '-'], { input: buf, maxBuffer: 64 << 20 }).toString('utf8'); }
  catch { throw Error('PDF_UNREADABLE pdftotext not available or failed'); }
}

/** Read every facts file: [{ folder, file, data }]. */
export function readFactsFiles(folders = FOLDERS) {
  const out = [];
  for (const folder of folders) {
    const dir = join(FACTS_DIR, folder);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) out.push({ folder, file: `${folder}/${f}`, data: JSON.parse(readFileSync(join(dir, f), 'utf8')) });
  }
  return out;
}

/**
 * The verification itself, with the fetcher injected (tests pass a fake one).
 * Returns per folder { facts: { key: date }, stops: [line], pages: n }.
 */
export async function verifyFacts(files, { fetchText = fetchSourceText, today = new Date().toISOString().slice(0, 10), previous = {}, keepOnFetchError = false, concurrency = 10 } = {}) {
  const result = {}, pageCache = new Map();
  const getText = (url) => { if (!pageCache.has(url)) pageCache.set(url, fetchText(url).then((t) => ({ t }), (e) => ({ e: String(e.message || e) }))); return pageCache.get(url); };
  // Warm the cache with bounded concurrency.
  const urls = [...new Set(files.flatMap(({ data }) => Object.values(data.states || {}).flatMap((s) => (s.facts || []).map((f) => f.source_url)).filter(Boolean)))];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, async () => { while (i < urls.length) await getText(urls[i++]); }));
  for (const { folder, file, data } of files) {
    const r = (result[folder] ||= { facts: {}, stops: [], pages: 0, checked: 0 });
    const prev = previous[folder]?.facts || {};
    if (data.folder !== folder) r.stops.push(`NAMED STOP [FILE_FOLDER_MISMATCH] ${file}: folder is "${data.folder}"`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.subtopic || '')) { r.stops.push(`NAMED STOP [FILE_SUBTOPIC] ${file}: subtopic "${data.subtopic}" is not kebab-case`); continue; }
    for (const [code, reason] of Object.entries(data.skips || {})) r.stops.push(`NAMED SKIP [RESEARCH_SKIP] ${folder}/${data.subtopic}/${code}: ${reason}`);
    const counts = claimCounts(data);
    for (const [code, entry] of Object.entries(data.states || {})) {
      const where = `${folder}/${data.subtopic}/${code}`;
      if (!STATES[code]) { r.stops.push(`NAMED STOP [UNKNOWN_STATE] ${where}`); continue; }
      let ok = 0;
      for (const [n, f] of (entry.facts || []).entries()) {
        r.checked++;
        const problems = factProblems(f);
        if (problems.length) { for (const [c, d] of problems) r.stops.push(`NAMED STOP [${c}] ${where}#${n + 1}: ${d}`); continue; }
        const key = factKey(f), page = await getText(f.source_url);
        if (page.e) {
          if (keepOnFetchError && prev[key]) { r.facts[key] = prev[key]; ok++; r.stops.push(`NAMED NOTE [FETCH_FAILED_KEPT] ${where}#${n + 1}: ${page.e} (kept from ${prev[key]})`); }
          else r.stops.push(`NAMED STOP [FETCH_FAILED] ${where}#${n + 1}: ${f.source_url} ${page.e}`);
          continue;
        }
        if (!quoteOnPage(f.quote, page.t)) { r.stops.push(`NAMED STOP [QUOTE_NOT_ON_PAGE] ${where}#${n + 1}: ${f.source_url}`); continue; }
        r.facts[key] = today; ok++;
      }
      const g = gateState(entry, r.facts, counts);
      if (g.facts) r.pages++;
      else r.stops.push(`NAMED STOP [${g.stop[0]}] ${where}: ${g.stop[1]}, state page not published`);
    }
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2), only = args.includes('--folder') ? [args[args.indexOf('--folder') + 1]] : FOLDERS;
  const files = readFactsFiles(only);
  if (!files.length) { console.error('NAMED STOP [NO_FACTS] no files under site/data/facts/<folder>/'); process.exit(2); }
  const previous = Object.fromEntries(only.map((f) => [f, existsSync(join(OUT_DIR, `${f}.json`)) ? JSON.parse(readFileSync(join(OUT_DIR, `${f}.json`), 'utf8')) : {}]));
  const res = await verifyFacts(files, { previous, keepOnFetchError: args.includes('--keep-on-fetch-error') });
  mkdirSync(OUT_DIR, { recursive: true });
  let pages = 0;
  for (const folder of only) {
    const r = res[folder];
    if (!r) { console.log(`NAMED STOP [FOLDER_MISSING] ${folder}: no facts files`); continue; }
    pages += r.pages;
    const facts = Object.fromEntries(Object.entries(r.facts).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(join(OUT_DIR, `${folder}.json`), JSON.stringify({ schema: 'kmp-verified-v1', folder, facts, stops: r.stops }, null, 1) + '\n');
    const byCode = {};
    for (const s of r.stops) { const c = /\[(\w+)\]/.exec(s)[1]; byCode[c] = (byCode[c] || 0) + 1; }
    console.log(`${folder}: ${r.checked} facts checked, ${Object.keys(facts).length} verified, ${r.pages} state pages publishable; stops ${JSON.stringify(byCode)}`);
  }
  // Federal facts the free tools use (site/data/tool-facts.json): same checks, one manifest.
  const toolFile = join(ROOT, 'site', 'data', 'tool-facts.json');
  if (only === FOLDERS && existsSync(toolFile)) {
    const facts = JSON.parse(readFileSync(toolFile, 'utf8')).facts || [], ok = {}, stops = [];
    for (const f of facts) {
      const p = factProblems(f);
      if (p.length) { stops.push(`NAMED STOP [${p[0][0]}] tools/${f.id}: ${p[0][1]}`); continue; }
      try { if (quoteOnPage(f.quote, await fetchSourceText(f.source_url))) ok[factKey(f)] = new Date().toISOString().slice(0, 10); else stops.push(`NAMED STOP [QUOTE_NOT_ON_PAGE] tools/${f.id}`); }
      catch (e) { stops.push(`NAMED STOP [FETCH_FAILED] tools/${f.id}: ${e.message}`); }
    }
    writeFileSync(join(OUT_DIR, 'tools.json'), JSON.stringify({ schema: 'kmp-verified-v1', folder: 'tools', facts: ok, stops }, null, 1) + '\n');
    console.log(`tools: ${facts.length} facts checked, ${Object.keys(ok).length} verified${stops.length ? `; ${stops.join('; ')}` : ''}`);
  }
  if (!pages) { console.error('NAMED STOP [NOTHING_VERIFIED] no state page has 3 verified facts'); process.exit(2); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
