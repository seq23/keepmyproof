// The website's settings: the one place that changes at launch.
// Folder names and checklists come from ../topics.json; Terms and Privacy from ../store/*.md.
export const SITE = {
  origin: 'https://keepmyproof.com',
  name: 'KeepMyProof',
  updated: '2026-11-01',
  // US list prices (spec, her ruling 1 Nov 2026). The launch-week offer is never written here:
  // the store shows it at checkout when it is live.
  prices: { yearlyUSD: '19.99', lifetimeUSD: '39.99' },
  freeItems: 25,
  // Public support address. No mailbox exists on keepmyproof.com yet (Cloudflare Email Routing
  // unconfigured, checked 1 Nov 2026), so this is the Spry Labs contact already used across her
  // public sites. scripts/release-gate.mjs keeps SUPPORT_ADDRESS_NOT_ON_DOMAIN open until it is
  // an @keepmyproof.com address that receives mail.
  supportEmail: 'hello@theindustryguides.com',
  // Store listing URLs. null = not in that store yet: the site says "coming soon", shows no store
  // badge or link, and publishes no app/offer schema (search-readiness c5). Fill both at launch.
  stores: { appStore: null, googlePlay: null },
  vaHelp: 'https://www.va.gov/get-help-from-accredited-representative/',
  parentOrg: { name: 'Spry Labs', id: 'https://billionairehighperformancecoach.com/spry-labs#organization', url: 'https://billionairehighperformancecoach.com/spry-labs' },
  indexNowKey: '4f1c9a7e2b6d4e8f9a3c5b7d1e2f4a6c',
};

// Page paths per language; `pair` links each page to its translation (hreflang).
export const PAGES = [
  { id: 'home', en: '/', es: '/es/', index: true },
  { id: 'terms', en: '/terms', es: '/es/terminos', index: false },
  { id: 'privacy', en: '/privacy', es: '/es/privacidad', index: false },
  { id: 'support', en: '/support', es: '/es/ayuda', index: false },
];
