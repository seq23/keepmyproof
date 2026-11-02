// Builds keepmyproof.com as static files (Cloudflare Pages project "keepmyproof", root dir `site`,
// build command `node build.mjs`, output `dist`). Plain Node, no dependencies.
// Folder names and checklists come from ../topics.json; Terms and Privacy from ../store/<lang>.md.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PAGES } from './config.mjs';
import { COPY } from './copy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['en', 'es'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (path) => SITE.origin + path;
const pathOf = (id, lang) => PAGES.find((p) => p.id === id)[lang];

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

function page({ lang, id, title, desc, body, schema = [] }) {
  const c = COPY[lang], self = pathOf(id, lang), index = PAGES.find((p) => p.id === id).index;
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${url(pathOf(id, l))}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${url(pathOf(id, 'en'))}">`;
  const graph = [
    { '@type': 'Organization', '@id': `${SITE.origin}/#organization`, name: SITE.name, url: `${SITE.origin}/`, logo: `${SITE.origin}/icon-512.png`, email: SITE.supportEmail,
      parentOrganization: { '@type': 'Organization', '@id': SITE.parentOrg.id, name: SITE.parentOrg.name, url: SITE.parentOrg.url } },
    { '@type': 'WebPage', '@id': `${url(self)}#webpage`, url: url(self), name: title, description: desc, inLanguage: lang, dateModified: SITE.updated,
      isPartOf: { '@id': `${SITE.origin}/#website` }, publisher: { '@id': `${SITE.origin}/#organization` },
      ...(id === 'home' ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.definition', '.faq'] } } : {}) },
    ...schema,
  ];
  if (id !== 'home') graph.push({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: SITE.name, item: url(pathOf('home', lang)) },
    { '@type': 'ListItem', position: 2, name: c.nav[id], item: url(self) }] });
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url(self)}">${alt}
${index ? '' : '<meta name="robots" content="noindex,follow">'}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${url(self)}"><meta property="og:site_name" content="${SITE.name}"><meta property="og:locale" content="${c.locale}">
<meta property="og:image" content="${SITE.origin}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="KeepMyProof">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE.origin}/og.png">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#f7f3ec" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#16130f" media="(prefers-color-scheme: dark)">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script></head>
<body><header><a class="mark" href="${pathOf('home', lang)}"><img src="/icon-192.png" alt="" width="28" height="28">KeepMyProof</a>
<a class="lang" href="${pathOf(id, c.other)}" hreflang="${c.other}" lang="${c.other}">${c.otherName}</a></header>
<main>${body}</main>
<footer><nav aria-label="${esc(c.nav.home)}">${['home', 'terms', 'privacy', 'support'].map((p) => `<a href="${pathOf(p, lang)}">${c.nav[p]}</a>`).join('')}<a href="${pathOf(id, c.other)}" hreflang="${c.other}" lang="${c.other}">${c.otherName}</a></nav>
<p>${esc(c.disclaimer)}</p><p>${esc(c.madeBy)} <a href="${SITE.parentOrg.url}">${SITE.parentOrg.name}</a>. ${esc(c.updated)} <time datetime="${SITE.updated}">${fmtDate(lang)}</time>.</p></footer>
</body></html>
`;
}

function fmtDate(lang) {
  return new Date(`${SITE.updated}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function storeBlock(lang) {
  const c = COPY[lang], s = SITE.stores;
  const links = [s.appStore && `<a class="btn" href="${esc(s.appStore)}">${c.appStore}</a>`, s.googlePlay && `<a class="btn" href="${esc(s.googlePlay)}">${c.googlePlay}</a>`].filter(Boolean);
  // Until a store URL is set the site says "coming soon" and links nowhere (no badge, no fake link).
  return links.length ? `<p class="lbl">${c.getIt}</p><p>${links.join('')}</p>` : `<p class="soon">${esc(c.comingSoon)}</p>`;
}

function home(lang, folders) {
  const c = COPY[lang], n = SITE.freeItems, faq = c.faq(n);
  const folderHtml = folders.map((f) => `<div class="box"><h3>${esc(f.display_name[lang])}</h3><ul>${f.checklist_items.map((i) => `<li>${esc(i.name[lang])}</li>`).join('')}</ul>${
    f.id === 'va-disability-papers' ? `<p class="sub">${esc(c.vaNote)} <a href="${SITE.vaHelp}" rel="noopener">${esc(c.vaLink)}</a></p>` : ''}</div>`).join('');
  const list = (xs) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const body = `<h1>${esc(c.h1)}</h1><p class="definition">${esc(c.definition)}</p>${storeBlock(lang)}
<h2>${esc(c.foldersH)}</h2><p class="sub">${esc(c.foldersSub)}</p><div class="grid">${folderHtml}</div>
<h2>${esc(c.privateH)}</h2>${list(c.privateList)}
<h2>${esc(c.datesH)}</h2>${list(c.datesList)}
<h2>${esc(c.backupH)}</h2>${list(c.backupList)}
<h2>${esc(c.priceH)}</h2><div class="grid two"><div class="box"><h3>${esc(c.free)}</h3>${list(c.freeList(n))}</div>
<div class="box"><h3>${esc(c.plus)}</h3>${list(c.plusList)}<p class="price">${esc(c.plusPrice(SITE.prices))}</p></div></div>${c.priceNotes(n).map((p) => `<p class="sub">${esc(p)}</p>`).join('')}
<h2>${esc(c.faqH)}</h2><div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  const schema = [
    { '@type': 'WebSite', '@id': `${SITE.origin}/#website`, url: `${SITE.origin}/`, name: SITE.name, inLanguage: LANGS, publisher: { '@id': `${SITE.origin}/#organization` } },
    { '@type': 'FAQPage', inLanguage: lang, mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  // App + offers schema only once the app is really in a store (search-readiness c5).
  const live = [SITE.stores.appStore && 'iOS', SITE.stores.googlePlay && 'Android'].filter(Boolean);
  if (live.length) schema.push({ '@type': 'MobileApplication', name: SITE.name, operatingSystem: live.join(', '), applicationCategory: 'UtilitiesApplication', inLanguage: LANGS,
    publisher: { '@id': `${SITE.origin}/#organization` }, url: url(pathOf('home', lang)), installUrl: [SITE.stores.appStore, SITE.stores.googlePlay].filter(Boolean),
    offers: [{ '@type': 'Offer', name: c.free, price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: `${c.plus} (yearly)`, price: SITE.prices.yearlyUSD, priceCurrency: 'USD' },
      { '@type': 'Offer', name: `${c.plus} (lifetime)`, price: SITE.prices.lifetimeUSD, priceCurrency: 'USD' }] });
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(e.notFoundTitle)}</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.ico"><style>${CSS}</style></head>
<body><main><h1>${esc(e.notFoundH1)}</h1><p>${esc(e.notFoundBody)}</p><p><a class="btn" href="/">${esc(e.back)}</a></p>
<h2 lang="es">${esc(s.notFoundH1)}</h2><p lang="es">${esc(s.notFoundBody)}</p><p><a class="btn" href="/es/" lang="es">${esc(s.back)}</a></p></main></body></html>
`;
}

/** Every file of the site, as { path: contents }. */
export function render() {
  const topics = JSON.parse(readFileSync(join(ROOT, 'topics.json'), 'utf8'));
  const folders = launchFolders(topics);
  const files = {};
  const out = (p) => (p.endsWith('/') ? `${p}index.html` : `${p}.html`).replace(/^\//, '');
  for (const lang of LANGS) {
    const { privacy, terms } = legalSections(readFileSync(join(ROOT, 'store', `${lang}.md`), 'utf8'));
    files[out(pathOf('home', lang))] = home(lang, folders);
    files[out(pathOf('terms', lang))] = legal(lang, 'terms', terms);
    files[out(pathOf('privacy', lang))] = legal(lang, 'privacy', privacy);
    files[out(pathOf('support', lang))] = support(lang);
  }
  files['404.html'] = notFound();
  const indexable = PAGES.filter((p) => p.index);
  files['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${indexable.flatMap((p) => LANGS.map((l) => `<url><loc>${url(p[l])}</loc><lastmod>${SITE.updated}</lastmod>${LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${url(p[a])}"/>`).join('')}</url>`)).join('\n')}
</urlset>
`;
  files['robots.txt'] = `User-agent: *\nAllow: /\n\n# AI answer engines are welcome to read and cite this site.\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`;
  const fl = folders.map((f) => `- ${f.display_name.en}: ${f.checklist_items.map((i) => i.name.en).join('; ')}`).join('\n');
  files['llms.txt'] = `# KeepMyProof\n\n> ${COPY.en.llms}\n\nStatus: ${COPY.en.comingSoon}\nPrice: free for the first ${SITE.freeItems} items (adding stops at the limit; viewing, PDFs, export, backup and restore never lock). KeepMyProof Plus: US $${SITE.prices.yearlyUSD} a year or $${SITE.prices.lifetimeUSD} once for life; unlimited items, own folders and tags, PDFs of chosen items or dates.\nNot legal advice. Not a law firm. Not affiliated with the VA.\nMade by ${SITE.parentOrg.name} (${SITE.parentOrg.url}).\n\n## Folders and suggested checklists\n\n${fl}\n\n## Pages\n\n- [Home](${url('/')}): what the app does, folders, privacy, price, questions\n- [Inicio en español](${url('/es/')})\n- [Terms](${url('/terms')})\n- [Privacy](${url('/privacy')})\n- [Support](${url('/support')}): ${SITE.supportEmail}\n`;
  files['site.webmanifest'] = JSON.stringify({ name: SITE.name, short_name: SITE.name, start_url: '/', display: 'browser', background_color: '#f7f3ec', theme_color: '#f7f3ec',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2);
  files[`${SITE.indexNowKey}.txt`] = SITE.indexNowKey;
  files['_headers'] = `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000\n`;
  return files;
}

export function build(dist) {
  rmSync(dist, { recursive: true, force: true });
  const files = render();
  for (const [p, s] of Object.entries(files)) { mkdirSync(dirname(join(dist, p)), { recursive: true }); writeFileSync(join(dist, p), s); }
  const assets = join(ROOT, 'assets', 'site');
  for (const f of readdirSync(assets)) copyFileSync(join(assets, f), join(dist, f));
  return Object.keys(files).length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const n = build(join(dirname(fileURLToPath(import.meta.url)), 'dist'));
  console.log(`site: ${n} files written to site/dist`);
}
