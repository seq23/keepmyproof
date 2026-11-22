// The facts gate shared by scripts/verify-facts.mjs (which fetches the sources) and the site
// generator (which never touches the network). One definition of: what counts as an official
// source, how a quote is matched, the fact key the verified manifest stores, and the banned words.
import { createHash } from 'node:crypto';

export const MIN_FACTS = 3;

// Banned claim words (owner ruling 2 Nov 2026; R-ADV-01/03). "best interest(s) of the child" is the
// statutory custody standard, not a claim, so it alone is allowed.
export const BANNED = [
  /\bcourt[\s-]*ready\b/i, /\badmissible\b/i, /\bproves\b/i, /\bbest\b(?!\s+interests?\b)/i, /\bwin\s+your\s+case\b/i,
  /\blist[oa]s?\s+para\s+(?:la\s+)?(?:corte|tribunal)\b/i, /\badmisibles?\b/i, /\bgan(?:e|ar)\s+su\s+caso\b/i, /\b(?:el|la|los|las)\s+mejor(?:es)?\b/i,
  /可(?:以)?证明(?!书)|能证明|证明了|法庭(?:可)?(?:采纳|采信)|可采纳|最好的|最佳(?!利益)|打赢官司|赢得官司|胜诉/, /승소|최고의|법정에서\s*(?:인정|채택)|증거\s*능력|입증합니다|증명합니다/,
];
export const bannedWord = (text) => { for (const re of BANNED) { const m = re.exec(String(text)); if (m) return m[0]; } return null; };

// Official sources only: government domains, plus the federally funded Parent Center network and
// state agencies whose only site is not on .gov (Florida's Department of Commerce publishes the state
// minimum wage at floridajobs.org; no .gov host answers for it, checked 21 Nov 2026).
const OFFICIAL_EXTRA = new Set(['parentcenterhub.org', 'pacourts.us', 'floridajobs.org']);
export function officialSource(url) {
  let u; try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  const h = u.hostname.toLowerCase().replace(/^www\./, '');
  return /\.(?:gov|mil)$/.test(h) || /(?:^|\.)(?:state\.[a-z]{2}\.us|[a-z]{2}\.us)$/.test(h) || OFFICIAL_EXTRA.has(h);
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', sect: '§', hellip: '...', dollar: '$', percnt: '%', comma: ',', period: '.', colon: ':', semi: ';', lpar: '(', rpar: ')', sol: '/', num: '#', excl: '!', quest: '?' };
const decodeOnce = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
/** Entities decoded until stable (two rounds: some pages double-encode, e.g. &amp;dollar; for $). */
export const decode = (s) => { const once = decodeOnce(s); return once === String(s) ? once : decodeOnce(once); };
/** Visible-ish text of an HTML page (scripts, styles and tags removed, entities decoded). */
export const htmlText = (html, joiner = ' ') => decode(String(html).replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, joiner));
/** Source text for quote matching: tags as spaces (quotes across table cells) and inline tags removed. */
export const sourceText = (html) => `${htmlText(html)}\n${htmlText(String(html).replace(/<\/?(?:a|b|i|em|strong|span|abbr|sup|sub|u|small|mark|code)\b[^>]*>/gi, ''))}`;
/** Whitespace-, case-, quote- and dash-insensitive form. */
export const norm = (s) => String(s).normalize('NFKC').replace(/[‘’‚′`´]/g, "'").replace(/[“”„″]/g, '"').replace(/[‐-―−]/g, '-').replace(/­/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
/** Same words in the same order, punctuation ignored (a fallback for typographic differences). */
export const loose = (s) => norm(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const quoteOnPage = (quote, pageText) => norm(pageText).includes(norm(quote)) || loose(pageText).includes(loose(quote));

/** The key the verified manifest stores: binds the exact source and quote (editing either needs a re-check). */
export const factKey = (f) => createHash('sha256').update(`${String(f.source_url).trim()}\n${norm(f.quote)}`).digest('hex').slice(0, 20);

// "No invented numbers": every number in a claim must be in its quote (as digits or a number word).
const WORDS = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 45: 'forty-five', 50: 'fifty', 60: 'sixty', 90: 'ninety', 100: 'hundred', 120: 'one hundred twenty', 180: 'one hundred eighty', 1000: 'thousand' };
// Form and document identifiers (DD-214, SF-180, W-2, VA Form 21-526EZ) are names, not quantities.
const IDENT = /\b(?:[A-Z]{1,4}-\d[\w-]*|(?:DD|SF|NA)\s+(?:Form\s+)?\d+|[Ff]orm(?:ulario)?\s+(?:[A-Z]{1,4}[- ]?)?\d[\w-]*|\d+-\d+[A-Z]+)\b/g;
const numbersIn = (s) => (String(s).replace(IDENT, ' ').match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || []).map((n) => n.replace(/,/g, '').replace(/\.0+$/, ''));
export function numberNotInQuote(f) {
  const q = norm(f.quote), qn = new Set(numbersIn(f.quote)), ql = loose(f.quote);
  for (const n of [...numbersIn(f.claim_en), ...numbersIn(f.claim_es)]) {
    if (qn.has(n)) continue;
    const w = WORDS[Number(n)];
    if (w && (q.includes(w) || ql.includes(loose(w)))) continue;
    return n;
  }
  return null;
}

/** Problems with a fact that need no network: shape, official source, banned words, numbers. */
export function factProblems(f) {
  const p = [];
  for (const k of ['claim_en', 'claim_es', 'source_url', 'source_name', 'quote']) if (typeof f?.[k] !== 'string' || !f[k].trim()) p.push(['FACT_SHAPE', `missing ${k}`]);
  if (p.length) return p;
  if (!officialSource(f.source_url)) p.push(['NOT_OFFICIAL', new URL(f.source_url).hostname]);
  if (norm(f.quote).length < 8) p.push(['QUOTE_TOO_SHORT', f.quote]);
  const b = bannedWord(`${f.claim_en} ${f.claim_es}`);
  if (b) p.push(['BANNED_WORD', b]);
  const n = numberNotInQuote(f);
  if (n) p.push(['NUMBER_NOT_IN_QUOTE', n]);
  p.push(...rateProblems(f));
  return p;
}

// Dated pay rates (files with "dated_rates": true, the minimum-wage file). Every dollar amount a claim
// states carries `rate: { kind, usd, from?, until? }`: kind is one word or a list ("tipped" rows that also
// state the combined minimum are ["tipped", "basic"]), usd is the amount as written in the claims and the
// quote, from/until are ISO days when the source dates the amount (the claims then name from's year, so a
// dated amount never reads as timeless). A rate is a sourced number like any other: the shape is checked
// here, and which rates a page may show on a given day is datedRates() below.
export const DOLLAR = /\$\s?\d/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const kindsOf = (f) => [].concat(f.rate?.kind || []);
export function rateProblems(f) {
  const r = f?.rate;
  if (!r) return [];
  const p = [];
  if (!kindsOf(f).length || kindsOf(f).some((k) => !/^[a-z]+(?:-[a-z]+)*$/.test(k))) p.push(['RATE_SHAPE', `kind ${JSON.stringify(r.kind)}`]);
  if (!/^\d{1,3}(?:,\d{3})*(?:\.\d{2,3})?$/.test(String(r.usd))) p.push(['RATE_SHAPE', `usd ${r.usd}`]);
  else for (const [k, t] of [['claim_en', f.claim_en], ['claim_es', f.claim_es], ['quote', f.quote]]) if (!new RegExp(`\\$\\s?${String(r.usd).replace(/[.,]/g, '\\$&')}(?!\\d)`).test(t)) p.push(['RATE_NOT_STATED', `$${r.usd} is not in ${k}`]);
  for (const d of ['from', 'until']) if (r[d] !== undefined && !ISO.test(r[d])) p.push(['RATE_SHAPE', `${d} ${r[d]}`]);
  if (ISO.test(r.from || '')) for (const k of ['claim_en', 'claim_es']) if (!f[k].includes(r.from.slice(0, 4))) p.push(['RATE_UNDATED_CLAIM', `${k} does not name ${r.from.slice(0, 4)}`]);
  return p;
}

/**
 * Which of a page's facts may show on `today` (an ISO day) when its file has dated rates:
 *  - a dollar amount with no rate tag never shows (UNTAGGED_RATE);
 *  - a dated rate shows until a later rate of the same kind takes effect, or until its own `until`;
 *    one that starts after today shows as the coming rate;
 *  - an undated rate (read on its `checked` day) stops showing once a dated rate of the same kind takes
 *    effect after that day, or once a rate of the same kind read on a later day is in force: the older
 *    table may not have caught up, and an old number beside the new one is the stale-number bug.
 * Rates come first: the basic rate in force (newest first), then the coming basic rate (soonest first), then
 * the other rates the same way; then the other facts in their own order.
 * Returns { facts, dropped: [[code, fact]] }.
 */
export function datedRates(facts, today) {
  const dated = {}, read = {}, max = (o, k, v) => { if (!o[k] || v > o[k]) o[k] = v; };
  for (const f of facts) {
    if (!f.rate || (f.rate.from && f.rate.from > today) || (f.rate.until && f.rate.until < today)) continue;
    for (const k of kindsOf(f)) { if (f.rate.from) max(dated, k, f.rate.from); max(read, k, f.checked || ''); }
  }
  const keep = [], dropped = [];
  for (const f of facts) {
    const r = f.rate;
    if (!r) { if (DOLLAR.test(f.claim_en) || DOLLAR.test(f.claim_es)) dropped.push(['UNTAGGED_RATE', f]); else keep.push(f); continue; }
    if (r.until && r.until < today) { dropped.push(['RATE_ENDED', f]); continue; }
    if (r.from && r.from > today) { keep.push(f); continue; }
    const since = r.from || f.checked || '';
    const stale = kindsOf(f).some((k) => (dated[k] && dated[k] > since) || (!r.from && read[k] && read[k] > since));
    if (stale) dropped.push(['RATE_SUPERSEDED', f]); else keep.push(f);
  }
  const coming = (f) => Boolean(f.rate.from && f.rate.from > today), since = (f) => f.rate.from || f.checked || '';
  const basic = (f) => (kindsOf(f)[0] === 'basic' ? 0 : 1);
  const rates = keep.filter((f) => f.rate).sort((a, b) => basic(a) - basic(b) || coming(a) - coming(b) || (coming(a) ? since(a).localeCompare(since(b)) : since(b).localeCompare(since(a))));
  return { facts: [...rates, ...keep.filter((f) => !f.rate)], dropped };
}


// A fact is state-specific when its CLAIM is about that state alone (coordinator's final rule, 2 Nov
// 2026): a rule, number, deadline, procedure, or the state's own named office, including a state's row
// on a federal all-states table. Judged by the claim, not the host: a claim that reads the same on
// another state's page in the same file is a generic national fact and never counts. Contact details
// (phone, address, hours) count as at most one state-specific fact per page.
export const MIN_STATE_SPECIFIC = 2;
const CONTACT = /\b(?:phone|telephone|fax|toll[- ]free|address|located at|suite|office hours|business hours|hours of operation|open (?:from|between|monday))\b|\b\d{3}[-.\s)]+\d{3}[-.\s]\d{4}\b|\b[A-Z]{2}\s+\d{5}\b/i;
// A state office's name and its contact details together count as ONE state-specific fact (coordinator,
// 2 Nov 2026): "the state's office is X" plus "its phone is Y" is still only one thing about the state.
const OFFICE_NAME = /\b(?:is|are)\s+(?:the\s+|called\s+|named\s+)?(?:[A-Z][\w.&'’-]*\s+){0,8}(?:Office|Department|Agency|Center|Centre|Division|Bureau|Commission|Board|Administration|Council|Services|Court|Clerk)\b|\blisted\b[^.]*\b(?:office|agency|center|department)\b|\b(?:office|agency|center|department)\b[^.]*\blisted\b/i;
export const isContact = (f) => CONTACT.test(f.claim_en) || OFFICE_NAME.test(f.claim_en);
const claimKey = (f) => norm(f.claim_en).replace(/[.\s]+$/, '');
/** How many states in one facts file carry each claim (the "reads the same on every page" test). */
export function claimCounts(data) {
  const m = new Map();
  for (const e of Object.values(data?.states || {})) for (const k of new Set((e.facts || []).map(claimKey))) m.set(k, (m.get(k) || 0) + 1);
  return m;
}
export const stateSpecificFact = (f, counts) => (counts.get(claimKey(f)) || 0) <= 1;

/**
 * The publish decision for one state of one facts file, from the verified manifest alone.
 * Returns { facts } (verified, gate-clean, at least MIN_FACTS) or { stop: [code, detail] }.
 */
/** Total and state-specific counts for a set of facts already marked stateSpecific (contact group counts once). */
export function enoughFacts(facts) {
  const own = facts.filter((f) => f.stateSpecific);
  const counted = own.filter((f) => !isContact(f)).length + (own.some(isContact) ? 1 : 0);
  if (facts.length < MIN_FACTS) return ['UNDER_3_VERIFIED', `${facts.length} verified fact(s)`];
  if (counted < MIN_STATE_SPECIFIC) return ['UNDER_2_STATE_SPECIFIC', `${counted} state-specific (office name and contact details count once) of ${facts.length} verified fact(s)`];
  return null;
}

export function gateState(entry, verified, counts, { today = null } = {}) {
  let facts = (entry?.facts || []).filter((f) => !factProblems(f).length && verified[factKey(f)])
    .map((f) => ({ ...f, verifiedOn: verified[factKey(f)], stateSpecific: stateSpecificFact(f, counts) }));
  // today is set for files with dated rates: amounts that are no longer (or not yet) the rate are dropped first.
  if (today) facts = datedRates(facts, today).facts;
  const stop = enoughFacts(facts);
  if (stop) return { stop };
  if (today) return { facts: [...facts.filter((f) => f.rate), ...rankFacts(facts.filter((f) => !f.rate))] };
  return { facts: rankFacts(facts) };
}
// State-specific facts first, office and contact details after them, national facts below.
const rankFacts = (facts) => { const rank = (f) => (f.stateSpecific ? (isContact(f) ? 1 : 0) : 2); return facts.map((f, i) => [f, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([f]) => f); };

/** A Chinese or Korean translation that left English words untranslated (lowercase words; names of
 * agencies, courts and forms are capitalised and allowed) is not natural writing and never publishes. */
export const untranslated = (t, lang) => /\b[a-z]{3,}\b/.test(String(t).replace(/https?:\S+/g, '').replace(/\{state(?:_es)?\}/g, '')) || wrongScript(t, lang);
/** Text in the other language's script: 25 Korean small-estate facts came back from a free model in
 * Chinese and published on Korean pages (found 21 Nov 2026). Korean is mostly Hangul; Chinese has none. */
const count = (t, re) => (String(t).match(re) || []).length;
export const wrongScript = (t, lang) => (lang === 'ko' ? count(t, /\p{Script=Hangul}/gu) <= count(t, /\p{Script=Han}/gu) : lang === 'zh' ? count(t, /\p{Script=Hangul}/gu) > 0 : false);
