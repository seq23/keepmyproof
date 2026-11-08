// Name an organisation in full once per block, then a short form (page-shape: no template filler).
//
// WHY (7 Nov 2026, owner: "do them all now"): the Monday page-quality sample fails a page when one
// 8-word phrase appears more than three times in its body. On the state pages that phrase is almost
// always an organisation's long name restated in every fact ("El Departamento de Trabajo de EE. UU.
// indica que" five times; "the Anchorage VA Regional Benefit Office at Colonel Mary Louise Rasmuson
// Campus of the Alaska VA Healthcare System" in nine facts). Good writing names it once, then uses an
// acronym or "the office". Only the generator's wording changes: every fact keeps its numbers, its
// meaning and its source link, and the first mention in each block keeps the full name.

/** Words the way the Monday sample reads them (boss-os page-quality-sample.mjs wordsOf, Unicode). */
export const wordsOf = (t) => String(t).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}_'’-]*/gu) ?? [];

/** True when some n-word phrase appears more than `max` times (the sample's template-filler test). */
export function repeatsPhrase(text, n = 8, max = 3) {
  const w = wordsOf(text), seen = new Map();
  for (let i = 0; i + n <= w.length; i++) { const k = w.slice(i, i + n).join(' '); const c = (seen.get(k) || 0) + 1; if (c > max) return true; seen.set(k, c); }
  return false;
}

// Agencies the translated facts name in words (not as a quoted proper name), with the acronym the
// agency itself uses. The first mention gains "(ACR)" unless it already has it.
const AGENCIES = {
  en: [
    { full: 'U.S. Department of Labor', acr: 'DOL' },
    { full: 'Parent Training and Information Center', acr: 'PTI' },
    { full: 'Center for Parent Information and Resources', acr: 'CPIR' },
  ],
  es: [
    { full: 'Departamento de Trabajo de EE. UU.', acr: 'DOL' },
    { full: 'Centro de Capacitación e Información para Padres', acr: 'PTI' },
    { full: 'Centro de Información y Recursos para Padres', acr: 'CPIR' },
  ],
};

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Long proper names the block repeats: fact quotes that are a Title Case name of 5+ words, found in 2+ texts. */
export function repeatedNames(texts, quotes) {
  const out = new Set();
  for (const q of quotes) {
    const s = String(q || '').trim();
    if (s.split(/\s+/).length < 5 || !/^\p{Lu}/u.test(s) || /\d|[.;:!?]$|https?:/.test(s)) continue;
    if (texts.filter((t) => t.includes(s)).length >= 2) out.add(s);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

/** The short form of a long proper name, as [pattern, replacement] pairs for one language. */
function nameRules(name, lang) {
  const n = reEsc(name), acr = name.match(/\(([A-Z][A-Za-z]{1,9})\)/);
  if (acr) {
    // "Family Network on Disabilities-Parent Support Network (PSN) Project" → "PSN Project".
    const short = `${acr[1]}${name.slice(acr.index + acr[0].length)}`.trim();
    return [[new RegExp(n, 'g'), () => short]];
  }
  const kind = /\bOffice\b/.test(name) ? 'office' : /\bDepartment\b/.test(name) ? 'department' : /\bCommission\b/.test(name) ? 'commission' : /\bCent(?:er|re)\b/.test(name) ? 'center' : 'agency';
  if (lang === 'es') {
    const es = { office: 'esta oficina', department: 'esta agencia', commission: 'esta comisión', center: 'este centro', agency: 'esta organización' }[kind];
    return [
      [new RegExp(`, ${n},`, 'g'), () => ''], // the appositive repeats a name the block already gave
      [new RegExp(`\\b([Ll])a oficina ${n}`, 'g'), (_, l) => (l === 'L' ? 'Esta oficina' : 'esta oficina')],
      [new RegExp(n, 'g'), () => es],
    ];
  }
  const en = `the ${kind}`;
  return [
    [new RegExp(`\\b([Tt])he ${n} page\\b`, 'g'), (_, t) => `${t}he ${kind}'s page`],
    [new RegExp(`\\b([Tt])he ${n}`, 'g'), (_, t) => `${t}he ${kind}`],
    [new RegExp(n, 'g'), () => en],
  ];
}

/**
 * One block of texts (an answer's facts, or the sourced list), in reading order. The first mention of
 * each long name stays in full; later mentions take the short form. Spanish attributions that would
 * start several facts the same way ("El DOL indica que …") are varied. With `state`, a closing
 * "in <state>." after the first says "in the state.". `above` (the H1) counts as a first mention.
 */
export function shortenNames(texts, lang, quotes = [], state = '', above = '') {
  let out = texts.map(String);
  for (const { full, acr } of AGENCIES[lang] || []) {
    const re = new RegExp(`${reEsc(full)}(?: \\(${acr}\\))?`, 'g');
    let seen = String(above).includes(full); // already named in full by the heading above the block
    out = out.map((t) => t.replace(re, (m, off, str) => {
      if (!seen) { seen = true; return /^(?:'s|’s)/.test(str.slice(off + m.length)) || m.endsWith(')') ? m : `${full} (${acr})`; }
      return acr;
    }));
  }
  // A short form only where it cannot point at a different organisation: the last long name the
  // block mentioned must be this one ("this office" after a second office was named is ambiguous).
  const names = repeatedNames(out, quotes);
  if (names.length) {
    const rules = new Map(names.map((nm) => [nm, nameRules(nm, lang)]));
    const find = new RegExp(names.map(reEsc).join('|'), 'g');
    let last = null;
    out = out.map((t) => {
      let res = '', at = 0;
      for (const m of t.matchAll(find)) {
        const nm = m[0];
        if (m.index < at) continue;
        const seg = t.slice(at, m.index);
        if (last === nm) {
          // The rules read the words around the name ("the …", "la oficina …", ", … ,", "… page").
          const ctx = seg.match(/(?:\b(?:[Tt]he|[Ll]a oficina) |, )$/)?.[0] ?? '';
          const after = t.slice(m.index + nm.length).match(ctx === ', ' ? /^,/ : /^ page\b/)?.[0] ?? '';
          const short = rules.get(nm).reduce((x, [re, f]) => x.replace(re, f), ctx + nm + after);
          const before = seg.slice(0, seg.length - ctx.length);
          res += before + (/(^|[.!?]\s+)$/.test(res + before) ? cap(short) : short);
          at = m.index + nm.length + after.length;
        } else { res += seg + nm; at = m.index + nm.length; }
        last = nm;
      }
      return res + t.slice(at);
    });
  }
  if (state) {
    const end = new RegExp(` ${lang === 'es' ? 'en' : 'in'} ${reEsc(state)}([.])$`);
    let seen = 0;
    out = out.map((t) => (end.test(t) && seen++ ? t.replace(end, lang === 'es' ? ' en el estado$1' : ' in the state$1') : t));
  }
  if (lang === 'es') {
    const said = new Map(), VARY = [(a) => `Según ${a}, `, (a) => `${cap(a)} también indica que `, (a) => `Además, según ${a}, `];
    out = out.map((t) => t.replace(/^(El|La) ([A-Z]{2,6}) indica que /, (m, art, acr) => {
      const k = `${art} ${acr}`, c = said.get(k) || 0; said.set(k, c + 1);
      return c === 0 ? m : VARY[(c - 1) % VARY.length](`${art.toLowerCase()} ${acr}`);
    }));
  }
  return out;
}

/** Facts that lean on the fact before them ("The same table…", "Its listed…") and cannot open an answer alone. */
export const leansBack = (claim) => /^(?:The same|The office|Its|It|This|These|La misma|El mismo|La oficina aparece|Su|Sus|Esta|Este|Estos|同|该|此|같은|이 )/u.test(String(claim).trim());
