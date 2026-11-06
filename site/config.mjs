// The website's settings: the one place that changes at launch.
// Folder names and checklists come from ../topics.json; Terms and Privacy from ../store/*.md.
export const SITE = {
  origin: 'https://keepmyproof.com',
  name: 'KeepMyProof',
  updated: '2026-11-02',
  // US list prices (spec, her ruling 1 Nov 2026). The launch-week offer is never written here:
  // the store shows it at checkout when it is live.
  prices: { yearlyUSD: '19.99', lifetimeUSD: '39.99' },
  freeItems: 25,
  // Public support address: Cloudflare Email Routing on keepmyproof.com (free, set up 2 Nov 2026)
  // forwards it to a Spry Labs business mailbox (the destination lives only in Cloudflare, never here).
  // scripts/release-gate.mjs checks it is @keepmyproof.com and the domain has live MX records.
  supportEmail: 'support@keepmyproof.com',
  // Store listing URLs. null = not in that store yet: the site says "coming soon", shows no store
  // badge or link, and publishes no app/offer schema (search-readiness c5). Fill both at launch.
  stores: { appStore: null, googlePlay: null },
  vaHelp: 'https://www.va.gov/get-help-from-accredited-representative/',
  parentOrg: { name: 'Spry Labs', id: 'https://billionairehighperformancecoach.com/spry-labs#organization', url: 'https://billionairehighperformancecoach.com/spry-labs' },
  indexNowKey: '4f1c9a7e2b6d4e8f9a3c5b7d1e2f4a6c',
  // Google Search Console ownership file for the Boss OS search service account (Site Verification API,
  // FILE method, 2 Nov 2026). scripts/ping-search.mjs verifies it and submits the sitemaps.
  googleVerificationFile: 'google706548b58060eed8.html',
};

// Page paths per language; `pair` links each page to its translation (hreflang).
export const PAGES = [
  { id: 'home', en: '/', es: '/es/', index: true },
  { id: 'terms', en: '/terms', es: '/es/terminos', index: false },
  { id: 'privacy', en: '/privacy', es: '/es/privacidad', index: false },
  { id: 'support', en: '/support', es: '/es/ayuda', index: false },
  { id: 'about', en: '/about', es: '/es/acerca', index: true },
  { id: 'checklists', en: '/checklists', es: '/es/listas', zh: '/zh/', ko: '/ko/', index: true },
  { id: 'tools', en: '/tools', es: '/es/herramientas', index: true },
  { id: 'guides', en: '/guides', es: '/es/guias', index: true },
  { id: 'facts', en: '/facts', es: '/es/datos', index: true },
  { id: 'alternatives', en: '/alternatives', es: '/es/alternativas', index: true },
];
