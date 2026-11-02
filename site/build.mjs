// Builds keepmyproof.com as static files (Cloudflare Pages project "keepmyproof", root dir `site`,
// build command `node build.mjs`, output `dist`). Plain Node, no dependencies, no network.
// Folder names and checklists come from ../topics.json; Terms and Privacy from ../store/<lang>.md;
// folder hubs from data/hubs.json; state pages from data/facts/<folder>/*.json, publishing only facts
// whose key is in data/verified/<folder>.json (scripts/verify-facts.mjs) and only states with at
// least 3 of them; "alternative to" pages from data/alternatives.json (scripts/measure-complaints.mjs);
// search-loop question pages from questions/ after the legal and VA gate below.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PAGES } from './config.mjs';
import { COPY } from './copy.mjs';
import { CC, FOLDERS, FACTS_PAGE, ALT } from './cluster-copy.mjs';
import { COPY_CJK, CC_CJK, TOPICS_CJK, STATES_CJK, HUBS_CJK, LANG_NAME, HREFLANG } from './copy-cjk.mjs';
import { STATES, STATE_CODES, slugify } from './lib/states.mjs';
import { gateState, bannedWord, htmlText, officialSource, claimCounts, factKey, enoughFacts } from './lib/gate.mjs';
import { checklistPdf } from './pdf.mjs';
import { TOOLS, calcData } from './tools.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const LANGS = ['en', 'es'];
const ALL_LANGS = ['en', 'es', 'zh', 'ko'];
for (const l of ['zh', 'ko']) { COPY[l] = COPY_CJK[l]; CC[l] = CC_CJK[l]; }
// Chinese state pages for divorce, Korean for executor (owner's yes, 2 Nov 2026); hubs and PDFs in both.
export const STATE_LANGS = { divorce: ['zh'], executor: ['ko'] };
for (const F of Object.values(FOLDERS)) for (const l of ['zh', 'ko']) { F.pdf[l] = `/checklists/${l}-${F.pdf.en.split('/').pop()}`; F.path[l] = `/${l}${F.path.en}`; }
const stateName = (code, l) => STATES[code][l] ?? STATES_CJK[l][code];
const stateSlug = (code, l) => STATES[code].slug[l] ?? STATES[code].slug.en;
/** Answer length: 40–60 words in English and Spanish; the same reading length in Chinese characters and Korean words. */
const RANGE = { en: [40, 60], es: [40, 60], zh: [60, 170], ko: [22, 55] };
const measure = (l, s) => (l === 'zh' ? String(s).replace(/[\s\p{P}]/gu, '').length : words(s));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (path) => SITE.origin + path;
const pathOf = (id, lang) => { const p = PAGES.find((x) => x.id === id); return p[lang] ?? (id === 'home' ? PAGES.find((x) => x.id === 'checklists')[lang] : null) ?? p.en; };
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const live = () => Boolean(SITE.stores.googlePlay || SITE.stores.appStore);
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

export function launchFolders(topics) {
  const folders = topics.topics.filter((t) => t.release === 'launch').sort((a, b) => a.folder_order - b.folder_order);
  if (folders.length !== topics.launch_folder_count) throw Error(`NAMED STOP [TOPICS_MISMATCH] ${folders.length} launch folders, topics.json says ${topics.launch_folder_count}`);
  return folders;
}

/** Terms and Privacy paragraphs from the store drafts (the one source the app store listing shares). */
export function legalSections(markdown) {
  const sections = markdown.split(/^## /m).slice(1).map((s) => {
    const [head, ...rest] = s.split('\n');
    return { head, paras: rest.join('\n').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean) };
  });
  const find = (re) => sections.find((s) => re.test(s.head))?.paras;
  const privacy = find(/privacy|privacidad/i), terms = find(/terms|términos/i);
  if (!privacy?.length || !terms?.length) throw Error('NAMED STOP [LEGAL_TEXT_MISSING] store/*.md has no Terms or Privacy section');
  return { privacy, terms };
}

const CSS = `:root{--bg:#f7f3ec;--fg:#1f1b16;--mut:#6d6458;--card:#fffdf9;--line:#e6ddcf;--gold:#b8923f;--golddeep:#7d611f;--goldbg:#f6eedb;--ok:#2e6b3f;--okbg:#e7f2ea;
--serif:"Iowan Old Style","Palatino Linotype",Georgia,serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#16130f;--fg:#f2ece2;--mut:#b3a897;--card:#201c17;--line:#3a332a;--gold:#d8b46a;--golddeep:#e2c27f;--goldbg:#33290f;--ok:#8fd19e;--okbg:#1d2e22;color-scheme:dark}}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg);font:400 16px/1.55 var(--sans);overflow-x:hidden}
a{color:var(--golddeep)}main,header,footer{max-width:720px;margin:0 auto;padding:0 18px}
header{display:flex;justify-content:space-between;align-items:center;min-height:64px;gap:12px}
.mark{font:600 21px/1 var(--serif);color:var(--fg);text-decoration:none;display:inline-flex;align-items:center;min-height:44px;gap:8px}
.mark img{width:28px;height:28px;border-radius:7px}
.nav a,.lang{display:inline-flex;align-items:center;min-height:44px;padding:0 4px}
h1{font:600 32px/1.15 var(--serif);margin:18px 0 12px}h2{font:600 21px/1.3 var(--serif);margin:36px 0 10px}h3{font:600 18px/1.3 var(--serif);margin:0 0 6px}
p{margin:0 0 12px}ul{margin:6px 0 12px;padding-left:22px}li{margin:0 0 6px}
.definition{font-size:18px}.lbl{font:500 12px/1.4 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mut);margin:0}
.sub{font-size:14px;color:var(--mut)}
.soon{background:var(--goldbg);border:1px solid var(--gold);border-radius:10px;padding:12px 14px;min-height:44px;margin:16px 0}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;border-radius:10px;border:1.5px solid var(--ok);color:var(--ok);background:var(--card);font:600 16px/1.2 var(--sans);text-decoration:none;padding:0 16px;margin:4px 8px 4px 0}
.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 12px;overflow-wrap:anywhere}
.box ul{margin-bottom:0}.grid{display:grid;gap:12px}@media (min-width:640px){.grid.two{grid-template-columns:1fr 1fr}}
.price{font:600 18px/1.4 var(--serif)}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:0 0 10px}
summary{cursor:pointer;min-height:48px;display:flex;align-items:center;padding:8px 16px;font-weight:600}
details p{padding:0 16px 14px;margin:0}
footer{border-top:1px solid var(--line);margin-top:40px;padding-top:16px;padding-bottom:40px;font-size:14px;color:var(--mut)}
footer nav{display:flex;flex-wrap:wrap;gap:4px 16px}footer nav a{display:inline-flex;align-items:center;min-height:44px}`;
const CSS_EXTRA = `.crumbs{font-size:14px;color:var(--mut);margin:8px 0 0}.crumbs a{color:var(--mut)}
.answer{background:var(--card);border-left:4px solid var(--gold);border-radius:8px;padding:12px 14px}
.facts li{margin:0 0 10px}.links{columns:2;column-gap:24px}@media (max-width:560px){.links{columns:1}}
.fact{font-size:14px;color:var(--mut)}`;
const STYLE = CSS + CSS_EXTRA;

function fmtDate(lang, iso = SITE.updated) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString({ es: 'es-US', zh: 'zh-CN', ko: 'ko-KR' }[lang] || 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** The one store switch: SITE.stores. Until a URL is set, "coming soon" and no link, badge or offer. */
function storeBlock(lang) {
  const c = COPY[lang], s = SITE.stores;
  const links = [s.googlePlay && `<a class="btn" href="${esc(s.googlePlay)}">${c.googlePlay}</a>`, s.appStore && `<a class="btn" href="${esc(s.appStore)}">${c.appStore}</a>`].filter(Boolean);
  return links.length ? `<p class="lbl">${c.getIt}</p><p>${links.join('')}</p>` : `<p class="soon">${esc(c.comingSoon)}</p>`;
}

/** SoftwareApplication with no rating ever; offers and install links only once it is in a store. */
function appSchema(lang) {
  const c = COPY[lang], s = SITE.stores;
  const os = [s.googlePlay && 'Android', s.appStore && 'iOS'].filter(Boolean);
  const node = { '@type': 'SoftwareApplication', '@id': `${SITE.origin}/#app`, name: SITE.name, applicationCategory: 'UtilitiesApplication', operatingSystem: os.length ? os.join(', ') : 'Android',
    description: c.factSentence(SITE.freeItems), inLanguage: LANGS, publisher: { '@id': `${SITE.origin}/#organization` }, url: `${SITE.origin}/` };
  if (os.length) Object.assign(node, { installUrl: [s.googlePlay, s.appStore].filter(Boolean), offers: [{ '@type': 'Offer', name: c.free, price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: `${c.plus} (yearly)`, price: SITE.prices.yearlyUSD, priceCurrency: 'USD' }, { '@type': 'Offer', name: `${c.plus} (lifetime)`, price: SITE.prices.lifetimeUSD, priceCurrency: 'USD' }] });
  return node;
}
const faqSchema = (lang, faq) => ({ '@type': 'FAQPage', inLanguage: lang, mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = (lang, faq) => `<h2>${esc(CC[lang].faqH)}</h2><div class="faq">${faq.map(([q, a, link]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}${link ? ` <a href="${esc(link.url)}" rel="noopener">${esc(link.label)}</a>` : ''}</p></details>`).join('')}</div>`;
const article = (lang, path, headline, desc, published, modified, citations = []) => ({ '@type': 'Article', headline: headline.slice(0, 110), description: desc, inLanguage: lang, url: url(path),
  mainEntityOfPage: { '@id': `${url(path)}#webpage` }, datePublished: published, dateModified: modified, author: { '@id': `${SITE.origin}/#organization` }, publisher: { '@id': `${SITE.origin}/#organization` },
  ...(citations.length ? { citation: citations.map((x) => ({ '@type': 'CreativeWork', name: x.name, url: x.url })) } : {}) });

/**
 * One HTML page. alt = { en, es } paths of the page and its translation (null when it has none);
 * crumbs = [{ name, path }] after Home. Every page carries the disclaimer and the one fact sentence.
 */
function shell({ lang, path, alt, title, desc, body, schema = [], crumbs = [], index = true, speakable = false }) {
  const c = COPY[lang];
  const altLinks = alt ? ALL_LANGS.filter((l) => alt[l]).map((l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${url(alt[l])}">`).join('') + (alt.en ? `<link rel="alternate" hreflang="x-default" href="${url(alt.en)}">` : '') : '';
  // Language links: the page's own translations; English and Spanish always reachable (their home).
  const langLinks = ALL_LANGS.filter((l) => l !== lang && (alt?.[l] || l === 'en' || l === 'es')).map((l) => `<a class="lang" href="${alt?.[l] || pathOf('home', l)}" hreflang="${HREFLANG[l]}" lang="${HREFLANG[l]}">${LANG_NAME[l]}</a>`).join('');
  const graph = [
    { '@type': 'Organization', '@id': `${SITE.origin}/#organization`, name: SITE.name, url: `${SITE.origin}/`, logo: `${SITE.origin}/icon-512.png`, email: SITE.supportEmail,
      parentOrganization: { '@type': 'Organization', '@id': SITE.parentOrg.id, name: SITE.parentOrg.name, url: SITE.parentOrg.url } },
    { '@type': 'WebPage', '@id': `${url(path)}#webpage`, url: url(path), name: title, description: desc, inLanguage: lang, dateModified: SITE.updated,
      isPartOf: { '@id': `${SITE.origin}/#website` }, publisher: { '@id': `${SITE.origin}/#organization` },
      ...(speakable ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.definition', '.answer', '.faq'] } } : {}) },
    ...schema,
  ];
  if (crumbs.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ name: c.nav.home, path: pathOf('home', lang) }, ...crumbs].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: url(x.path) })) });
  const crumbHtml = crumbs.length > 1 ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="${pathOf('home', lang)}">${esc(c.nav.home)}</a>${crumbs.slice(0, -1).map((x) => ` › <a href="${x.path}">${esc(x.name)}</a>`).join('')}</nav>` : '';
  const foot = ['home', 'checklists', 'tools', 'facts', 'alternatives', 'terms', 'privacy', 'support'].map((p) => `<a href="${pathOf(p, lang)}">${c.nav[p]}</a>`).join('');
  return `<!doctype html><html lang="${HREFLANG[lang]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url(path)}">${altLinks}
${index ? '' : '<meta name="robots" content="noindex,follow">'}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${url(path)}"><meta property="og:site_name" content="${SITE.name}"><meta property="og:locale" content="${c.locale}">
<meta property="og:image" content="${SITE.origin}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="KeepMyProof">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE.origin}/og.png">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#f7f3ec" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#16130f" media="(prefers-color-scheme: dark)">
<style>${STYLE}</style>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script></head>
<body><header><a class="mark" href="${pathOf('home', lang)}"><img src="/icon-192.png" alt="" width="28" height="28">KeepMyProof</a>
<nav aria-label="Language">${langLinks}</nav></header>
<main>${crumbHtml}${body}</main>
<footer><nav aria-label="${esc(c.nav.home)}">${foot}${langLinks}</nav>
<p>${esc(c.disclaimer)}</p><p class="fact">${esc(c.factSentence(SITE.freeItems))}</p><p>${esc(c.madeBy)} <a href="${SITE.parentOrg.url}">${SITE.parentOrg.name}</a>. ${esc(c.updated)} <time datetime="${SITE.updated}">${fmtDate(lang)}</time>.</p></footer>
</body></html>
`;
}

// The fixed pages (PAGES in config.mjs) go through shell() too.
function page({ lang, id, title, desc, body, schema = [] }) {
  const p = PAGES.find((x) => x.id === id);
  return shell({ lang, path: p[lang], alt: Object.fromEntries(ALL_LANGS.filter((l) => p[l]).map((l) => [l, p[l]])), title, desc, body, schema, index: p.index, speakable: id === 'home' || id === 'facts',
    crumbs: id === 'home' ? [] : [{ name: COPY[lang].nav[id], path: p[lang] }] });
}

const list = (xs) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

function home(lang, folders, hubs) {
  const c = COPY[lang], n = SITE.freeItems, faq = c.faq(n);
  const folderHtml = folders.map((f) => `<div class="box"><h3><a href="${hubPath(hubs, f.id, lang)}">${esc(f.display_name[lang])}</a></h3><ul>${f.checklist_items.map((i) => `<li>${esc(i.name[lang])}</li>`).join('')}</ul>${
    f.id === 'va-disability-papers' ? `<p class="sub">${esc(c.vaNote)} <a href="${SITE.vaHelp}" rel="noopener">${esc(c.vaLink)}</a></p>` : ''}</div>`).join('');
  const body = `<h1>${esc(c.h1)}</h1><p class="definition">${esc(c.definition)}</p>${storeBlock(lang)}
<h2>${esc(c.foldersH)}</h2><p class="sub">${esc(c.foldersSub)} <a href="${pathOf('checklists', lang)}">${esc(c.nav.checklists)}</a></p><div class="grid">${folderHtml}</div>
<h2>${esc(c.privateH)}</h2>${list(c.privateList)}
<h2>${esc(c.datesH)}</h2>${list(c.datesList)}
<h2>${esc(c.backupH)}</h2>${list(c.backupList)}
<h2>${esc(c.priceH)}</h2><div class="grid two"><div class="box"><h3>${esc(c.free)}</h3>${list(c.freeList(n))}</div>
<div class="box"><h3>${esc(c.plus)}</h3>${list(c.plusList)}<p class="price">${esc(c.plusPrice(SITE.prices))}</p></div></div>${c.priceNotes(n).map((p) => `<p class="sub">${esc(p)}</p>`).join('')}
<h2>${esc(c.faqH)}</h2><div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  const schema = [
    { '@type': 'WebSite', '@id': `${SITE.origin}/#website`, url: `${SITE.origin}/`, name: SITE.name, inLanguage: LANGS, publisher: { '@id': `${SITE.origin}/#organization` } },
    faqSchema(lang, faq), appSchema(lang),
  ];
  return page({ lang, id: 'home', title: c.homeTitle, desc: c.homeDesc(n), body, schema });
}

function legal(lang, id, paras) {
  const c = COPY[lang], key = id === 'terms' ? 'terms' : 'privacy';
  const body = `<p><a href="${pathOf('home', lang)}">${esc(c.back)}</a></p><h1>${esc(c[`${key}H1`])}</h1><p class="sub">${esc(c.updated)} <time datetime="${SITE.updated}">${fmtDate(lang)}</time></p>
${paras.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<p>${esc(c.contactLine)} <a href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a>.</p>`;
  return page({ lang, id, title: c[`${key}Title`], desc: c[`${key}Desc`], body });
}

function support(lang) {
  const c = COPY[lang];
  const body = `<p><a href="${pathOf('home', lang)}">${esc(c.back)}</a></p><h1>${esc(c.supportH1)}</h1><p>${esc(c.supportIntro)}</p>
<p class="lbl">${esc(c.supportEmailLabel)}</p><p><a class="btn" href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a></p>
${c.supportTopics.map(([h, t]) => `<div class="box"><h3>${esc(h)}</h3><p>${esc(t)}</p></div>`).join('')}`;
  return page({ lang, id: 'support', title: c.supportTitle, desc: c.supportDesc, body });
}

function notFound() {
  const e = COPY.en, s = COPY.es;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(e.notFoundTitle)}</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.ico"><style>${STYLE}</style></head>
<body><main><h1>${esc(e.notFoundH1)}</h1><p>${esc(e.notFoundBody)}</p><p><a class="btn" href="/">${esc(e.back)}</a></p>
<h2 lang="es">${esc(s.notFoundH1)}</h2><p lang="es">${esc(s.notFoundBody)}</p><p><a class="btn" href="/es/" lang="es">${esc(s.back)}</a></p></main></body></html>
`;
}

// ---------- folder clusters: hub ↔ subtopic ↔ state ↔ neighbouring states ----------

const hubPath = (hubs, topicId, lang) => (lang === 'en' ? '/' : `/${lang}/`) + hubFor(hubs, topicId, lang).slug;
const hubFor = (hubs, topicId, lang) => hubs[topicId][lang] ?? HUBS_CJK[topicId][lang];
const fill = (s, code, l = 'en') => String(s).replace(/\{state_es\}/g, stateName(code, l === 'en' ? 'es' : l)).replace(/\{state\}/g, stateName(code, l === 'es' ? 'es' : l));
function subtopicLabel(t, lang) {
  const s = String(t).replace(/^\{state(?:_es)?\}(?:'s)?\s*/, '').replace(/\s+(?:in|en|de|for|para|del)\s+\{state(?:_es)?\}/g, '')
    .replace(/\{state(?:_es)?\}\s*(?:的|의)?/g, lang === 'es' ? 'cada estado' : lang === 'en' ? 'each state' : '').replace(/\s*[:,：]\s*$/, '').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const folderName = (topic, l) => topic.display_name[l] ?? TOPICS_CJK[topic.id][l][0];
const checklistItems = (topic, l) => (topic.checklist_items[0].name[l] ? topic.checklist_items.map((i) => i.name[l]) : TOPICS_CJK[topic.id][l][1]);

/** A 40–60 word answer: the page's own facts first, then fixed true sentences to reach 40. */
export function quotableAnswer(claims, tails, lang = 'en') {
  const [lo, hi] = RANGE[lang], sep = lang === 'zh' ? '' : ' ', m = (xs) => measure(lang, xs.join(sep));
  const out = [];
  for (const cl of claims) if (m([...out, cl]) <= hi) out.push(cl);
  for (const t of [...tails].sort((a, b) => measure(lang, b) - measure(lang, a))) {
    if (m(out) >= lo) break;
    if (m([...out, t]) <= hi) out.push(t);
  }
  const s = out.join(sep);
  return m(out) >= lo && m(out) <= hi ? s : null;
}

/** Read facts files, verified manifests and the Chinese/Korean translations from disk. */
export function loadFacts() {
  const facts = {}, verified = {}, translations = {};
  for (const k of Object.keys(FOLDERS)) {
    const dir = join(process.env.KMP_FACTS_DIR || join(HERE, 'data', 'facts'), k);
    facts[k] = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(join(dir, f))) : [];
    const v = join(process.env.KMP_VERIFIED_DIR || join(HERE, 'data', 'verified'), `${k}.json`);
    verified[k] = existsSync(v) ? readJson(v).facts || {} : {};
    const t = join(HERE, 'data', 'translations', k);
    translations[k] = existsSync(t) ? Object.fromEntries(readdirSync(t).filter((f) => f.endsWith('.json')).map((f) => { const d = readJson(join(t, f)); return [`${d.subtopic}.${d.lang}`, d]; })) : {};
  }
  const tf = join(HERE, 'data', 'tool-facts.json'), tv = join(process.env.KMP_VERIFIED_DIR || join(HERE, 'data', 'verified'), 'tools.json');
  const toolVerified = existsSync(tv) ? readJson(tv).facts || {} : {};
  const toolFacts = existsSync(tf) ? readJson(tf).facts.filter((f) => toolVerified[factKey(f)]).map((f) => ({ ...f, verifiedOn: toolVerified[factKey(f)] })) : [];
  return { facts, verified, translations, toolFacts };
}

/** Which state pages publish, per language: verified facts only, ≥3 with ≥2 state-specific, no banned word. */
export function clusterModel({ facts, verified, translations = {} }) {
  const model = {}, stops = [];
  for (const [k, files] of Object.entries(facts)) {
    const subs = [], usedEs = new Set();
    for (const data of files) {
      if (!data?.subtopic || !data.title_en || !data.title_es) { stops.push(`NAMED STOP [FILE_SHAPE] ${k}/${data?.subtopic}: needs subtopic, title_en and title_es`); continue; }
      const STOP = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'en', 'su', 'sus', 'para', 'con', 'a', 'por', 'un', 'una']);
      const w = slugify(subtopicLabel(data.title_es, 'es').replace(/\bcada estado\b/g, '')).split('-').slice(0, 7);
      while (w.length > 1 && STOP.has(w[w.length - 1])) w.pop();
      let es = w.join('-') || data.subtopic;
      if (usedEs.has(es)) es = `${es}-${data.subtopic}`;
      usedEs.add(es);
      const titles = { en: data.title_en, es: data.title_es }, langs = ['en', 'es'];
      for (const l of STATE_LANGS[k] || []) {
        const tr = translations[k]?.[`${data.subtopic}.${l}`];
        if (tr?.title && /\{state\}/.test(tr.title)) { titles[l] = tr.title; langs.push(l); }
        else stops.push(`NAMED STOP [NOT_TRANSLATED] ${k}/${data.subtopic} ${l}: no translation file (scripts/translate-facts.mjs); ${l} pages not published`);
      }
      const states = [], counts = claimCounts(data);
      for (const code of STATE_CODES) {
        const entry = data.states?.[code];
        if (!entry) continue;
        const g = gateState(entry, verified[k] || {}, counts);
        if (g.stop) { stops.push(`NAMED STOP [${g.stop[0]}] ${k}/${data.subtopic}/${code}: ${g.stop[1]}; not published`); continue; }
        const b = bannedWord([fill(data.title_en, code), fill(data.title_es, code, 'es'), ...g.facts.flatMap((f) => [f.claim_en, f.claim_es])].join(' '));
        if (b) { stops.push(`NAMED STOP [BANNED_WORD] ${k}/${data.subtopic}/${code}: "${b}"; not published`); continue; }
        const byLang = { en: g.facts.map((f) => ({ ...f, claim: f.claim_en })), es: g.facts.map((f) => ({ ...f, claim: f.claim_es })) };
        for (const l of langs.slice(2)) {
          const tr = translations[k][`${data.subtopic}.${l}`].facts || {};
          const fl = g.facts.filter((f) => tr[factKey(f)]).map((f) => ({ ...f, claim: tr[factKey(f)] }));
          const stop = enoughFacts(fl) || (bannedWord(fl.map((f) => f.claim).join(' ') + fill(titles[l], code, l)) ? ['BANNED_WORD', l] : null);
          if (stop) stops.push(`NAMED SKIP [${l.toUpperCase()}_${stop[0]}] ${k}/${data.subtopic}/${code}: ${stop[1]}`);
          else byLang[l] = fl;
        }
        states.push({ code, byLang, facts: g.facts, links: (entry.official_links || []).filter((x) => officialSource(x.url)) });
      }
      if (states.length) subs.push({ data, titles, slug: { en: data.subtopic, es, zh: data.subtopic, ko: data.subtopic }, label: Object.fromEntries(Object.entries(titles).map(([l, t]) => [l, subtopicLabel(t, l)])), states });
    }
    if (!subs.length) stops.push(`NAMED STOP [FOLDER_NO_STATE_PAGES] ${k}: no state page passes the gate yet`);
    model[k] = subs;
  }
  return { model, stops };
}

function neighbours(code, published) {
  const set = new Set(published), out = STATES[code].neighbours.filter((n) => set.has(n));
  const order = published.filter((c) => c !== code), i = STATE_CODES.indexOf(code);
  const near = order.sort((a, b) => Math.abs(STATE_CODES.indexOf(a) - i) - Math.abs(STATE_CODES.indexOf(b) - i));
  for (const n of near) { if (out.length >= 4) break; if (!out.includes(n)) out.push(n); }
  return out.slice(0, 6);
}

function clusterPages(topics, hubs, cm, add, stops) {
  const folders = launchFolders(topics);
  for (const [k, F] of Object.entries(FOLDERS)) {
    const topic = folders.find((t) => t.id === F.topic), subs = cm[k] || [];
    if (!topic || !hubs[F.topic]) throw Error(`NAMED STOP [FOLDER_UNMAPPED] ${k}: topics.json or hubs.json has no ${F.topic}`);
    const va = k === 'va', hub = (l) => hubFor(hubs, F.topic, l);
    const P = {
      hub: (l) => hubPath(hubs, F.topic, l), index: (l) => F.path[l], sub: (s, l) => `${F.path[l]}${s.slug[l]}/`,
      state: (s, code, l) => `${F.path[l]}${s.slug[l]}/${stateSlug(code, l)}`,
    };
    // Which languages each page exists in (so every hreflang points at a page that exists, both ways).
    const subLangs = (s) => ALL_LANGS.filter((l) => s.states.some((x) => x.byLang[l]));
    const stLangs = (st) => ALL_LANGS.filter((l) => st.byLang[l]);
    const altOf = (langs, fn) => Object.fromEntries(langs.map((l) => [l, fn(l)]));
    const folderLangs = ALL_LANGS.filter((l) => subs.some((s) => subLangs(s).includes(l)));
    const vaBlock = (l) => (va ? `<p class="sub">${esc(COPY[l].vaNote)} <a href="${SITE.vaHelp}" rel="noopener">${esc(COPY[l].vaLink)}</a></p>` : '');
    const usTag = (l) => CC[l].usTag ?? (l === 'es' ? ' · Estados Unidos' : '');
    // Drop a language from a state page when its facts cannot make a quotable answer (before any link is drawn).
    for (const s of subs) for (const st of s.states) for (const l of Object.keys(st.byLang)) {
      if (!quotableAnswer(st.byLang[l].map((f) => f.claim), [...CC[l].tails(stateName(st.code, l)), ...(va ? [CC[l].vaTail] : [])], l)) {
        delete st.byLang[l]; stops.push(`NAMED STOP [ANSWER_LENGTH] ${k}/${s.data.subtopic}/${st.code} ${l}: facts cannot make a quotable answer; not published`);
      }
    }
    const keep = (l) => { const c = CC[l]; return `<h2>${esc(c.keepH)}</h2><p>${esc(c.keepBody)}</p>${list(checklistItems(topic, l))}
<p><a class="btn" href="${F.pdf[l]}">${esc(c.checklistCta)}</a></p><p class="sub">${esc(c.checklistNote)}</p>${storeBlock(l)}${vaBlock(l)}`; };

    // Hub in all four languages.
    const hubAlt = altOf(ALL_LANGS, P.hub);
    for (const l of ALL_LANGS) {
      const h = hub(l), c = CC[l], path = P.hub(l), n = measure(l, h.answer), [lo, hi] = RANGE[l];
      if (n < lo || n > hi) throw Error(`NAMED STOP [ANSWER_LENGTH] hub ${k} ${l}: ${n} (allowed ${lo}-${hi})`);
      const own = subs.filter((s) => subLangs(s).includes(l));
      const body = `<p class="lbl">${esc(folderName(topic, l))}${esc(usTag(l))}</p><h1>${esc(h.h1)}</h1><p class="definition answer">${esc(h.answer)}</p><p class="sub">${esc(c.notAdvice)}</p>
<p><a class="btn" href="${F.pdf[l]}">${esc(c.checklistCta)}</a></p><p class="sub">${esc(c.checklistNote)}</p>
${list(checklistItems(topic, l))}
${own.length ? `<h2>${esc(h.statesH)}</h2><ul>${own.map((s) => `<li><a href="${P.sub(s, l)}">${esc(s.label[l])}</a></li>`).join('')}</ul><p><a href="${P.index(l)}">${esc(c.byState(folderName(topic, l)))}</a></p>` : ''}
<h2>${esc(c.keepH)}</h2><p>${esc(c.keepBody)}</p>${storeBlock(l)}${vaBlock(l)}
${faqHtml(l, h.faq)}<p class="sub">${esc(c.notAdvice)}</p>`;
      add({ path, alt: hubAlt, group: k, html: shell({ lang: l, path, alt: hubAlt, title: h.title, desc: h.desc, body, speakable: true,
        crumbs: [{ name: h.h1, path }], schema: [article(l, path, h.title, h.desc, SITE.updated, SITE.updated, h.faq.filter((f) => f[2]).map((f) => ({ name: f[2].label, url: f[2].url }))), faqSchema(l, h.faq), appSchema(l)] }) });
    }
    if (!subs.length) continue;

    // State index (the folder path itself), in every language that has state pages.
    const idxAlt = altOf(folderLangs, P.index);
    for (const l of folderLangs) {
      const c = CC[l], path = P.index(l), codes = [...new Set(subs.flatMap((s) => s.states.filter((x) => x.byLang[l]).map((x) => x.code)))];
      const rows = codes.map((code) => `<div class="box"><h3>${esc(stateName(code, l))}</h3><ul>${subs.filter((s) => s.states.some((x) => x.code === code && x.byLang[l])).map((s) => `<li><a href="${P.state(s, code, l)}">${esc(fill(s.titles[l], code, l))}</a></li>`).join('')}</ul></div>`).join('');
      const desc = c.byStateDesc(folderName(topic, l), codes.length - (codes.includes('DC') ? 1 : 0));
      const body = `<p class="lbl">${esc(folderName(topic, l))}</p><h1>${esc(c.byState(folderName(topic, l)))}</h1><p class="definition answer">${esc(desc)}</p><p>${esc(c.statesIntro)}</p>
<p><a href="${P.hub(l)}">${esc(c.hubLink(hub(l).h1))}</a> · <a href="${F.pdf[l]}">${esc(c.checklistCta)}</a></p><div class="grid two">${rows}</div>`;
      add({ path, alt: idxAlt, group: k, html: shell({ lang: l, path, alt: idxAlt, title: `${c.byState(folderName(topic, l))} | KeepMyProof`, desc: desc.slice(0, 160), body,
        crumbs: [{ name: hub(l).h1, path: P.hub(l) }, { name: c.allStates, path }] }) });
    }

    for (const s of subs) {
      // Subtopic page: every state for this subtopic.
      const sl = subLangs(s), subAlt = altOf(sl, (l) => P.sub(s, l));
      for (const l of sl) {
        const c = CC[l], path = P.sub(s, l), pub = s.states.filter((x) => x.byLang[l]).map((x) => x.code), n = pub.length - (pub.includes('DC') ? 1 : 0);
        const intro = c.subtopicIntro(s.label[l], n);
        const answer = quotableAnswer([intro], c.tails({ en: 'your state', es: 'su estado', zh: '您所在的州', ko: '거주하는 주' }[l]), l) || intro;
        const h1 = c.subH1 ? c.subH1(s.label[l]) : `${s.label[l]}${l === 'es' ? ' en Estados Unidos' : ''}`;
        const title = `${l === 'en' ? `${s.label[l]}, state by state` : h1} | KeepMyProof`;
        const body = `<p class="lbl">${esc(folderName(topic, l))}${esc(usTag(l))}</p><h1>${esc(h1)}</h1><p class="definition answer">${esc(answer)}</p><p class="sub">${esc(c.notAdvice)}</p>
<ul class="links">${pub.map((code) => `<li><a href="${P.state(s, code, l)}">${esc(stateName(code, l))}</a></li>`).join('')}</ul>
<p><a href="${P.hub(l)}">${esc(c.hubLink(hub(l).h1))}</a> · <a href="${P.index(l)}">${esc(c.byState(folderName(topic, l)))}</a></p>${keep(l)}`;
        const desc = answer.length > 160 ? answer.slice(0, 157).replace(/\s+\S*$/, '') + '…' : answer;
        add({ path, alt: subAlt, group: k, html: shell({ lang: l, path, alt: subAlt, title, desc, body,
          crumbs: [{ name: hub(l).h1, path: P.hub(l) }, { name: s.label[l], path }], schema: [article(l, path, title, desc, SITE.updated, SITE.updated)] }) });
      }
      // State pages.
      for (const st of s.states) {
        const code = st.code, langs = stLangs(st), alt = altOf(langs, (l) => P.state(s, code, l));
        for (const l of langs) {
          const facts = st.byLang[l], dates = facts.map((f) => f.verifiedOn).sort(), first = dates[0], last = dates[dates.length - 1];
          const c = CC[l], S = stateName(code, l), path = P.state(s, code, l), claims = facts.map((f) => f.claim);
          const answer = quotableAnswer(claims, [...c.tails(S), ...(va ? [c.vaTail] : [])], l);
          const h1 = fill(s.titles[l], code, l), title = `${h1} | KeepMyProof`.length <= 70 ? `${h1} | KeepMyProof` : h1;
          const tailDesc = { en: ` From official ${S} sources.`, es: ` Fuentes oficiales de ${S}, Estados Unidos.`, zh: `（美国${S}官方来源）`, ko: ` (미국 ${S} 공식 출처)` }[l];
          let desc = `${claims[0]}${tailDesc}`;
          if (desc.length > 160) desc = `${claims[0].slice(0, 155 - tailDesc.length).replace(l === 'zh' ? /$/ : /\s+\S*$/, '')}…${tailDesc}`;
          const names = [...new Set(facts.map((f) => f.source_name))];
          const faq = c.faq({ state: S, names: names.join('; '), date: fmtDate(l, last), folder: folderName(topic, l), items: checklistItems(topic, l), va, store: c.storeLine(live()) });
          const others = subs.filter((o) => o !== s && o.states.some((x) => x.code === code && x.byLang[l]));
          const near = neighbours(code, s.states.filter((x) => x.byLang[l]).map((x) => x.code));
          const body = `<p class="lbl">${esc(c.stateLabel(folderName(topic, l), S))}</p><h1>${esc(h1)}</h1>
<p class="definition answer">${esc(answer)}</p><p class="sub">${esc(c.notAdvice)} ${esc(c.sourcesChecked(fmtDate(l, last)))}</p>
<h2>${esc(c.sourcesH)}</h2><ul class="facts">${facts.map((f) => `<li>${esc(f.claim)} <a href="${esc(f.source_url)}" rel="noopener">${esc(f.source_name)}</a>. <span class="sub">${esc(c.checked(fmtDate(l, f.verifiedOn)))}</span></li>`).join('')}</ul>
${st.links.length ? `<h2>${esc(c.linksH)}</h2><ul>${st.links.map((x) => `<li><a href="${esc(x.url)}" rel="noopener">${esc(x[`label_${l}`] || x.label_en || x.url)}</a></li>`).join('')}</ul>` : ''}
${keep(l)}
<h2>${esc(c.moreHere(S))}</h2><ul>${others.map((o) => `<li><a href="${P.state(o, code, l)}">${esc(fill(o.titles[l], code, l))}</a></li>`).join('')}<li><a href="${P.hub(l)}">${esc(c.hubLink(hub(l).h1))}</a></li><li><a href="${P.sub(s, l)}">${esc(s.label[l])}: ${esc(c.allStates.toLowerCase())}</a></li></ul>
${near.length ? `<h2>${esc(c.nearby)}</h2><ul>${near.map((n) => `<li><a href="${P.state(s, n, l)}">${esc(fill(s.titles[l], n, l))}</a></li>`).join('')}</ul>` : ''}
${faqHtml(l, faq)}<p class="sub">${esc(c.notAdvice)}</p>`;
          add({ path, alt, group: k, state: { folder: k, subtopic: s.data.subtopic, code, lang: l, facts: facts.length }, html: shell({ lang: l, path, alt, title, desc, body, speakable: true,
            crumbs: [{ name: hub(l).h1, path: P.hub(l) }, { name: s.label[l], path: P.sub(s, l) }, { name: S, path }],
            schema: [article(l, path, h1, desc, first, last, facts.map((f) => ({ name: f.source_name, url: f.source_url }))), faqSchema(l, faq), appSchema(l)] }) });
        }
      }
    }
  }
}

// ---------- checklists, facts, alternatives ----------

function checklistFiles(topics, hubs, add, files) {
  const folders = launchFolders(topics), p = PAGES.find((x) => x.id === 'checklists');
  const alt = Object.fromEntries(ALL_LANGS.map((l) => [l, p[l]]));
  for (const l of ALL_LANGS) {
    const c = CC[l], cp = COPY[l];
    for (const F of Object.values(FOLDERS)) {
      const t = folders.find((x) => x.id === F.topic);
      files[F.pdf[l].slice(1)] = checklistPdf({ lang: l, title: hubFor(hubs, F.topic, l).h1, intro: c.pdfIntro, items: checklistItems(t, l), dateLabel: c.pdfDate,
        footer: [cp.disclaimer, cp.factSentence(SITE.freeItems), `${SITE.origin.replace('https://', '')}${hubPath(hubs, F.topic, l)}`] });
    }
    const path = p[l];
    const body = `<h1>${esc(c.checklistsH1)}</h1><p class="definition answer">${esc(c.checklistsAnswer)}</p><p class="sub">${esc(c.notAdvice)}</p>
<div class="grid two">${Object.values(FOLDERS).map((F) => { const t = folders.find((x) => x.id === F.topic); return `<div class="box"><h3>${esc(folderName(t, l))}</h3>${list(checklistItems(t, l))}<p><a class="btn" href="${F.pdf[l]}">${esc(c.pdfLink)}</a></p><p><a href="${hubPath(hubs, F.topic, l)}">${esc(c.hubLink(hubFor(hubs, F.topic, l).h1))}</a></p></div>`; }).join('')}</div>${storeBlock(l)}
${l === 'zh' || l === 'ko' ? `<p class="fact">${esc(cp.factSentence(SITE.freeItems))}</p>` : ''}`;
    add({ path, alt, group: 'core', html: shell({ lang: l, path, alt, title: c.checklistsTitle, desc: c.checklistsDesc, body, speakable: l === 'zh' || l === 'ko',
      crumbs: l === 'zh' || l === 'ko' ? [] : [{ name: cp.nav.checklists, path }],
      schema: Object.values(FOLDERS).map((F) => ({ '@type': 'DigitalDocument', name: hubFor(hubs, F.topic, l).h1, url: url(F.pdf[l]), encodingFormat: 'application/pdf', inLanguage: HREFLANG[l], isAccessibleForFree: true })) }) });
  }
}

function factsPage(add) {
  for (const l of LANGS) {
    const c = CC[l], cp = COPY[l], path = pathOf('facts', l), rows = FACTS_PAGE[l](SITE.freeItems, SITE.prices, live());
    const faq = rows.map(([h, xs]) => [l === 'en' ? `${h}?`.replace(/^What it is\?$/, 'What is KeepMyProof?') : `${h}`, xs.join(' ')]);
    const body = `<h1>${esc(c.factsH1)}</h1><p class="definition answer">${esc(cp.factSentence(SITE.freeItems))}</p><p class="sub">${esc(c.notAdvice)}</p>
${rows.map(([h, xs]) => `<h2>${esc(h)}</h2>${list(xs)}`).join('')}${storeBlock(l)}
<p>${esc(cp.contactLine)} <a href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a>.</p>`;
    add({ path, alt: { en: pathOf('facts', 'en'), es: pathOf('facts', 'es') }, group: 'core', html: page({ lang: l, id: 'facts', title: c.factsTitle, desc: c.factsDesc, body, schema: [appSchema(l), faqSchema(l, faq).mainEntity && { '@type': 'AboutPage', name: c.factsH1, about: { '@id': `${SITE.origin}/#app` } }] }) });
  }
}

function alternativePages(add) {
  const file = join(HERE, 'data', 'alternatives.json');
  if (!existsSync(file)) return ['NAMED STOP [ALTERNATIVES_UNMEASURED] run scripts/measure-complaints.mjs'];
  const data = readJson(file), apps = data.apps || [];
  for (const l of LANGS) {
    const a = ALT[l], c = CC[l], idx = pathOf('alternatives', l), pre = l === 'en' ? '/alternatives/' : '/es/alternativas/';
    for (const app of apps) {
      const path = `${pre}${app.slug}`, alt = { en: `/alternatives/${app.slug}`, es: `/es/alternativas/${app.slug}` }, d = fmtDate(l, app.measured);
      const answer = a.answer(app, a.kind[app.kind], SITE.freeItems);
      const body = `<p class="lbl">${esc(c.altIndexH1)}</p><h1>${esc(a.h1(app))}</h1><p class="definition answer">${esc(answer)}</p>
<h2>${esc(a.reviewsH)}</h2><p>${esc(a.reviews(app, d))} <a href="${esc(app.store_url)}" rel="noopener nofollow">${esc(a.source)}</a></p>
<details><summary>${esc(a.method)}</summary><p>${esc(data.method)}</p></details>
<h2>${esc(a.handlesH)}</h2>${list(a.handles(SITE.freeItems, SITE.prices))}
<h2>${esc(a.suitsH(app))}</h2><p>${esc(a.suits[app.kind])}</p>${storeBlock(l)}
<p><a href="${pathOf('checklists', l)}">${esc(COPY[l].nav.checklists)}</a> · <a href="${pathOf('facts', l)}">${esc(COPY[l].nav.facts)}</a></p>
<p class="sub">${esc(a.tm(app))}</p>`;
      add({ path, alt, group: 'core', html: shell({ lang: l, path, alt, title: a.title(app), desc: a.desc(app), body, crumbs: [{ name: COPY[l].nav.alternatives, path: idx }, { name: app.name, path }],
        schema: [article(l, path, a.h1(app), a.desc(app), app.measured, app.measured, [{ name: `${app.app} (App Store)`, url: app.store_url }]), appSchema(l)] }) });
    }
    const body = `<h1>${esc(c.altIndexH1)}</h1><p>${esc(c.altIndexDesc)}</p><ul>${apps.map((app) => `<li><a href="${pre}${app.slug}">${esc(a.h1(app))}</a></li>`).join('')}</ul>`;
    add({ path: idx, alt: { en: pathOf('alternatives', 'en'), es: pathOf('alternatives', 'es') }, group: 'core', html: page({ lang: l, id: 'alternatives', title: c.altIndexTitle, desc: c.altIndexDesc, body }) });
  }
  return [];
}

// ---------- free tools (browser-only) ----------

const TOOL_STR = {
  en: { gpsFound: 'location data found and removed in the copy.', gpsNone: 'no location data found; the copy is clean too.', download: 'Download clean copy', working: 'Making your PDF…', fromPhoto: 'photo date', fromFile: 'file date',
    done: 'PDF ready: {n} pages. Check your downloads.', result: '{n} {unit} after the date you entered: {date}', notCalendar: '{n} {kind}: this counts {kind}, so ask for the calendar to find the date.', units: { day: 'days', month: 'months', year: 'years' }, kinds: { school: 'school days', business: 'business days' },
    source: 'Source:', checked: 'Checked', notAdvice: 'Educational only. Not legal advice. Confirm your date with the agency, court, school or a lawyer.',
    ui: { s1: '1. Remove location from photos', s1b: 'Choose one or more photos. Each one gets a clean copy to download.', choose: 'Choose photos', s2: '2. Black out or blur a name or address', s2b: 'Choose a picture, then drag a box over what to hide.', mode: 'How to hide', box: 'Black box', blur: 'Blur', undo: 'Undo last box', save: 'Download picture', pdfChoose: 'Choose photos and screenshots', state: 'State', date: 'Date', national: 'United States (federal rule)', add: 'Add a row', print: 'Print or save as PDF', unsaved: 'Nothing you type is saved. Print or save as PDF before you close this page.', name: 'Name', from: 'From', to: 'To', toolsH: 'Free tools' } },
  es: { gpsFound: 'se encontraron datos de ubicación y se quitaron de la copia.', gpsNone: 'no tenía datos de ubicación; la copia también está limpia.', download: 'Descargar copia limpia', working: 'Armando su PDF…', fromPhoto: 'fecha de la foto', fromFile: 'fecha del archivo',
    done: 'PDF listo: {n} páginas. Revise sus descargas.', result: '{n} {unit} después de la fecha que puso: {date}', notCalendar: '{n} {kind}: cuenta {kind}, así que pida el calendario para saber la fecha.', units: { day: 'días', month: 'meses', year: 'años' }, kinds: { school: 'días escolares', business: 'días hábiles' },
    source: 'Fuente:', checked: 'Revisado el', notAdvice: 'Solo informativo. No es asesoría legal. Confirme su fecha con la agencia, la corte, la escuela o un abogado.',
    ui: { s1: '1. Quitar la ubicación de las fotos', s1b: 'Elija una o más fotos. Cada una tendrá una copia limpia para descargar.', choose: 'Elegir fotos', s2: '2. Tapar o difuminar un nombre o una dirección', s2b: 'Elija una imagen y arrastre un recuadro sobre lo que quiere tapar.', mode: 'Cómo tapar', box: 'Recuadro negro', blur: 'Difuminar', undo: 'Deshacer el último', save: 'Descargar imagen', pdfChoose: 'Elegir fotos y capturas', state: 'Estado', date: 'Fecha', national: 'Estados Unidos (regla federal)', add: 'Agregar fila', print: 'Imprimir o guardar como PDF', unsaved: 'No se guarda nada de lo que escribe. Imprima o guarde como PDF antes de cerrar la página.', name: 'Nombre', from: 'Desde', to: 'Hasta', toolsH: 'Herramientas gratis' } },
};
const PRINT_CSS = '<style>@media print{header,footer,.crumbs,.no-print,.faq,h2,.answer,.soon,.lbl{display:none!important}main{max-width:none}textarea,input{border:0!important;resize:none}table{width:100%}}.pr{width:100%;border-collapse:collapse}.pr th,.pr td{border:1px solid var(--line);padding:4px;vertical-align:top;text-align:left}.pr textarea{width:100%;min-height:48px;font:inherit;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg)}</style>';

function toolPages(add, model, stops, toolFacts = []) {
  const built = [];
  for (const tool of TOOLS) {
    let data = null;
    if (tool.kind === 'calc') {
      data = calcData(tool, model, toolFacts);
      if (!Object.keys(data).length) { stops.push(`NAMED STOP [CALC_NO_FACTS] ${tool.id}: no verified, published fact states a period for it; tool not built`); continue; }
    }
    built.push(tool);
    const alt = { en: `/tools/${tool.slug.en}`, es: `/es/herramientas/${tool.slug.es}` };
    for (const l of LANGS) {
      const S = TOOL_STR[l], u = S.ui, path = alt[l], [lo, hi] = RANGE[l];
      if (words(tool.answer[l]) < lo || words(tool.answer[l]) > hi) throw Error(`NAMED STOP [ANSWER_LENGTH] tool ${tool.id} ${l}: ${words(tool.answer[l])} words`);
      let ui = '';
      if (tool.kind === 'photo-privacy') ui = `<h2>${esc(u.s1)}</h2><p>${esc(u.s1b)}</p><p><label class="btn">${esc(u.choose)} <input id="pp-files" type="file" accept="image/*" multiple hidden></label></p><ul id="pp-out"></ul>
<h2>${esc(u.s2)}</h2><p>${esc(u.s2b)}</p><p><label class="btn">${esc(u.choose)} <input id="rd-file" type="file" accept="image/*" hidden></label></p>
<p id="rd-actions" hidden><label>${esc(u.mode)} <select id="rd-mode"><option value="box">${esc(u.box)}</option><option value="blur">${esc(u.blur)}</option></select></label> <button class="btn" type="button" id="rd-undo">${esc(u.undo)}</button><button class="btn" type="button" id="rd-save">${esc(u.save)}</button></p>
<canvas id="rd-canvas" hidden style="max-width:100%;touch-action:none;border:1px solid var(--line)"></canvas>`;
      if (tool.kind === 'dated-pdf') ui = `<p><label class="btn">${esc(u.pdfChoose)} <input id="dp-files" type="file" accept="image/*" multiple hidden></label></p><p id="dp-status" class="sub" aria-live="polite"></p>`;
      if (tool.kind === 'calc') {
        const keys = Object.keys(data).sort((a, b) => (a === 'US' ? -1 : STATE_CODES.indexOf(a) - STATE_CODES.indexOf(b)));
        ui = `<p><label>${esc(u.state)} <select id="calc-state"><option value="">—</option>${keys.map((k) => `<option value="${k}">${esc(k === 'US' ? u.national : stateName(k, l))}</option>`).join('')}</select></label> <label>${esc(u.date)} <input id="calc-date" type="date"></label></p><div id="calc-out" aria-live="polite"></div>
<script type="application/json" id="calc-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
      }
      if (tool.kind === 'printable') ui = `${PRINT_CSS}<p class="sub no-print">${esc(u.unsaved)}</p><p><label>${esc(u.name)} <input type="text"></label> <label>${esc(u.from)} <input type="date"></label> <label>${esc(u.to)} <input type="date"></label></p>
<table class="pr"><thead><tr>${tool.cols[l].map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody id="pr-rows"></tbody></table><template id="pr-row"><tr>${tool.cols[l].map((c) => `<td><textarea aria-label="${esc(c)}"></textarea></td>`).join('')}</tr></template>
<p class="no-print"><button class="btn" type="button" id="pr-add">${esc(u.add)}</button><button class="btn" type="button" id="pr-print">${esc(u.print)}</button></p>`;
      const body = `<p class="lbl">${esc(u.toolsH)}${l === 'es' ? ' · Estados Unidos' : ''}</p><h1>${esc(tool.h1[l])}</h1><p class="definition answer">${esc(tool.answer[l])}</p><p class="sub">${esc(CC[l].notAdvice)}</p>
<div data-tool="${tool.kind}">${ui}</div><script type="application/json" id="tool-strings">${JSON.stringify(S).replace(/</g, '\\u003c')}</script>
<div class="no-print"><h2>${esc(CC[l].keepH)}</h2><p>${esc(CC[l].keepBody)}</p>${storeBlock(l)}<p><a href="${pathOf('checklists', l)}">${esc(COPY[l].nav.checklists)}</a> · <a href="${pathOf('tools', l)}">${esc(COPY[l].nav.tools)}</a></p></div>
<div class="no-print">${faqHtml(l, tool.faq[l])}</div><script src="/tools.js" defer></script>`;
      add({ path, alt, group: 'core', html: shell({ lang: l, path, alt, title: tool.title[l], desc: tool.desc[l], body, speakable: true,
        crumbs: [{ name: COPY[l].nav.tools, path: pathOf('tools', l) }, { name: tool.h1[l], path }],
        schema: [{ '@type': 'WebApplication', name: tool.h1[l], url: url(path), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (runs in the browser)', isAccessibleForFree: true, inLanguage: l, publisher: { '@id': `${SITE.origin}/#organization` } }, faqSchema(l, tool.faq[l]), appSchema(l)] }) });
    }
  }
  for (const l of LANGS) {
    const path = pathOf('tools', l), u = TOOL_STR[l].ui;
    const answer = l === 'en' ? 'These free tools run entirely in your browser, with no upload and no account: remove location data from photos, black out names on screenshots, put photos into one dated PDF, look up time limits stated by official sources, and fill in printable logs. Nothing you add is sent anywhere or saved after you close the page.'
      : 'Estas herramientas gratis funcionan por completo en su navegador, sin subir nada y sin cuenta: quitar la ubicación de fotos, tapar nombres en capturas, juntar fotos en un PDF con fecha, ver plazos que dan fuentes oficiales y llenar registros para imprimir. Nada de lo que agrega se envía ni se guarda al cerrar la página.';
    const body = `<h1>${esc(u.toolsH)}</h1><p class="definition answer">${esc(answer)}</p><p class="sub">${esc(CC[l].notAdvice)}</p><ul>${built.map((t) => `<li><a href="${l === 'en' ? '/tools/' : '/es/herramientas/'}${t.slug[l]}">${esc(t.h1[l])}</a></li>`).join('')}</ul>${storeBlock(l)}`;
    add({ path, alt: { en: pathOf('tools', 'en'), es: pathOf('tools', 'es') }, group: 'core', html: page({ lang: l, id: 'tools', title: `${u.toolsH}: ${l === 'en' ? 'photo privacy, dated PDFs, deadlines, printable logs' : 'privacidad de fotos, PDF con fecha, plazos, registros'} | KeepMyProof`, desc: answer.slice(0, 157).replace(/\s+\S*$/, '') + '…', body }) });
  }
}

// ---------- search-loop question pages: the legal and VA gate ----------

// Pages the engine writes under questions/ are published only if they pass this gate; a failing page
// stays out of dist and the sitemap and is a NAMED STOP in the build log (validate.mjs fails main on it).
const LEGAL_ADVICE = /\byou should (?:sue|file (?:a )?(?:lawsuit|motion|appeal|claim))\b|\bour (?:lawyers|attorneys)\b|\bwe (?:represent|will file|can file|file claims)\b|\b(?:top|expert|specialist|recommended|rated) (?:lawyers?|attorneys?)\b|\bguarantee(?:d|s)?\b/i;
const VA_HELP = /\b(?:we|keepmyproof)\b[^.]{0,40}\b(?:prepare|file|submit|rate|judge|win|increase)\b[^.]{0,30}\bclaims?\b|\bincrease your (?:va )?rating\b|\bget (?:a )?higher (?:va )?rating\b/i;
export function questionGate(html) {
  const text = htmlText(html), p = [];
  const b = bannedWord(text); if (b) p.push(`banned word "${b}"`);
  const la = LEGAL_ADVICE.exec(text); if (la) p.push(`legal advice or outcome "${la[0]}"`);
  if (!/not legal advice/i.test(text)) p.push('no "Not legal advice" line');
  if (/\b(?:VA|veterans?)\b/.test(text)) {
    const v = VA_HELP.exec(text); if (v) p.push(`VA claim help "${v[0]}"`);
    if (!/not affiliated with the VA/i.test(text)) p.push('VA page without "not affiliated with the VA"');
  }
  return p;
}
function walk(dir) { return existsSync(dir) ? readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []; }
function questionPages(add, files, stops) {
  const dir = join(HERE, 'questions');
  for (const f of walk(dir).filter((x) => x.endsWith('.html'))) {
    const rel = relative(HERE, f).split('\\').join('/'), html = readFileSync(f, 'utf8'), problems = questionGate(html);
    if (problems.length) { stops.push(`NAMED STOP [QUESTION_GATE] ${rel}: ${problems.join('; ')}; not published`); continue; }
    const path = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
    add({ path, alt: null, group: 'questions', html, external: true });
  }
}

// ---------- the whole site ----------

/** Every file of the site plus the page list: { files, pages, stops }. */
export function renderAll(input = loadFacts()) {
  const topics = readJson(join(ROOT, 'topics.json')), hubs = readJson(join(HERE, 'data', 'hubs.json')).hubs;
  const folders = launchFolders(topics);
  const files = {}, pages = [];
  const out = (p) => (p.endsWith('/') ? `${p}index.html` : `${p}.html`).replace(/^\//, '');
  const add = (pg) => { const f = out(pg.path); if (files[f]) throw Error(`NAMED STOP [PATH_COLLISION] ${pg.path}`); files[f] = pg.html; pages.push({ ...pg, file: f, html: undefined, index: pg.index ?? !/noindex/.test(pg.html.slice(0, 2000)) }); };
  for (const lang of LANGS) {
    const { privacy, terms } = legalSections(readFileSync(join(ROOT, 'store', `${lang}.md`), 'utf8'));
    add({ path: pathOf('home', lang), alt: { en: '/', es: '/es/' }, group: 'core', html: home(lang, folders, hubs) });
    add({ path: pathOf('terms', lang), alt: { en: pathOf('terms', 'en'), es: pathOf('terms', 'es') }, group: 'core', html: legal(lang, 'terms', terms) });
    add({ path: pathOf('privacy', lang), alt: { en: pathOf('privacy', 'en'), es: pathOf('privacy', 'es') }, group: 'core', html: legal(lang, 'privacy', privacy) });
    add({ path: pathOf('support', lang), alt: { en: pathOf('support', 'en'), es: pathOf('support', 'es') }, group: 'core', html: support(lang) });
  }
  const { model, stops } = clusterModel(input);
  clusterPages(topics, hubs, model, add, stops);
  checklistFiles(topics, hubs, add, files);
  toolPages(add, model, stops, input.toolFacts);
  factsPage(add);
  stops.push(...alternativePages(add));
  questionPages(add, files, stops);

  // Our own copy may never carry a banned claim word (state and question pages were gated above).
  for (const pg of pages.filter((x) => !x.external)) {
    const b = bannedWord(htmlText(files[pg.file].replace(/<head>[\s\S]*?<\/head>/, '')));
    if (b) throw Error(`NAMED STOP [BANNED_WORD_IN_COPY] ${pg.path}: "${b}"`);
  }
  files['404.html'] = notFound();
  files['site.css'] = STYLE;
  files['tools.js'] = readFileSync(join(HERE, 'tools-client.js'), 'utf8');

  // Sitemaps split by folder; sitemap.xml is the index.
  const groups = [...new Set(pages.filter((p) => p.index).map((p) => p.group))];
  const loc = (p) => `<url><loc>${url(p.path)}</loc><lastmod>${SITE.updated}</lastmod>${p.alt ? ALL_LANGS.filter((l) => p.alt[l]).map((l) => `<xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${url(p.alt[l])}"/>`).join('') : ''}</url>`;
  for (const g of groups) files[`sitemap-${g}.xml`] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.filter((p) => p.index && p.group === g).map(loc).join('\n')}\n</urlset>\n`;
  files['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${groups.map((g) => `<sitemap><loc>${SITE.origin}/sitemap-${g}.xml</loc><lastmod>${SITE.updated}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
  files['robots.txt'] = `User-agent: *\nAllow: /\n\n# AI answer engines are welcome to read and cite this site.\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`;

  const fl = folders.map((f) => `- [${f.display_name.en}](${url(hubPath(hubs, f.id, 'en'))}): ${f.checklist_items.map((i) => i.name.en).join('; ')}`).join('\n');
  const census = Object.keys(FOLDERS).map((k) => `- ${hubs[FOLDERS[k].topic].en.h1}: ${pages.filter((p) => p.state?.folder === k && p.state.lang === 'en').length} state pages in English, ${pages.filter((p) => p.state?.folder === k && p.state.lang === 'es').length} in Spanish${STATE_LANGS[k] ? `, ${pages.filter((p) => p.state?.folder === k && p.state.lang === STATE_LANGS[k][0]).length} in ${LANG_NAME[STATE_LANGS[k][0]]}` : ''}${(model[k] || []).length ? ` ([by state](${url(FOLDERS[k].path.en)}))` : ''}`).join('\n');
  files['llms.txt'] = `# KeepMyProof\n\n> ${COPY.en.factSentence(SITE.freeItems)}\n\n${COPY.en.llms}\n\nStatus: ${COPY.en.comingSoon}\nPrice: free for the first ${SITE.freeItems} items (adding stops at the limit; viewing, PDFs, export, backup and restore never lock). KeepMyProof Plus: US $${SITE.prices.yearlyUSD} a year or $${SITE.prices.lifetimeUSD} once for life; unlimited items, own folders and tags, PDFs of chosen items or dates.\nEducational only. Not legal advice. Not a law firm. Not affiliated with the VA.\nMade by ${SITE.parentOrg.name} (${SITE.parentOrg.url}).\n\n## Folders and suggested checklists\n\n${fl}\n\n## State-by-state pages (facts copied from official sources, each linked and dated)\n\n${census}\n\n## Pages\n\n- [Home](${url('/')}): what the app does, folders, privacy, price, questions\n- [KeepMyProof facts](${url(pathOf('facts', 'en'))}): one page of plain facts about the app\n- [Free printable checklists](${url(pathOf('checklists', 'en'))}): five one-page PDFs, English and Spanish, no email\n- [Alternatives](${url(pathOf('alternatives', 'en'))}): compared on counted, dated review complaints\n- [Inicio en español](${url('/es/')})\n- [Terms](${url('/terms')})\n- [Privacy](${url('/privacy')})\n- [Support](${url('/support')}): ${SITE.supportEmail}\n- [Sitemap](${url('/sitemap.xml')})\n`;
  files['site.webmanifest'] = JSON.stringify({ name: SITE.name, short_name: SITE.name, start_url: '/', display: 'browser', background_color: '#f7f3ec', theme_color: '#f7f3ec',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2);
  files[`${SITE.indexNowKey}.txt`] = SITE.indexNowKey;
  files['build.txt'] = process.env.CF_PAGES_COMMIT_SHA || 'local';
  files['_headers'] = `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000\n`;
  if (existsSync(join(HERE, '_redirects'))) files['_redirects'] = readFileSync(join(HERE, '_redirects'), 'utf8');
  return { files, pages, stops, model };
}

/** Every file of the site, as { path: contents }. */
export const render = (input) => renderAll(input).files;

export function build(dist) {
  rmSync(dist, { recursive: true, force: true });
  const { files, pages, stops } = renderAll();
  for (const [p, s] of Object.entries(files)) { mkdirSync(dirname(join(dist, p)), { recursive: true }); writeFileSync(join(dist, p), s); }
  const assets = join(ROOT, 'assets', 'site');
  for (const f of readdirSync(assets)) copyFileSync(join(assets, f), join(dist, f));
  return { files: Object.keys(files).length, pages, stops };
}

/** Pages per folder and language, for the build log and the launch report. */
export function census(pages) {
  const rows = {};
  for (const p of pages) { const lang = (/^\/(es|zh|ko)\//.exec(p.path) || [, 'en'])[1], key = p.state ? p.state.folder : p.group; (rows[key] ||= {})[lang] = (rows[key][lang] || 0) + 1; if (p.state) rows[key][`states_${lang}`] = (rows[key][`states_${lang}`] || 0) + 1; }
  return rows;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = build(join(HERE, 'dist'));
  for (const s of r.stops.filter((x) => !/RESEARCH_SKIP|UNDER_3/.test(x))) console.log(s);
  for (const code of ['UNDER_3_VERIFIED', 'UNDER_2_STATE_SPECIFIC']) {
    const n = r.stops.filter((x) => x.includes(`[${code}]`)).length;
    if (n) console.log(`NAMED SKIP [${code}] ${n} state × subtopic pages held back (each is listed in site/data/verified/<folder>.json)`);
  }
  console.log(`site: ${r.files} files written to site/dist; pages by folder ${JSON.stringify(census(r.pages))}`);
}
