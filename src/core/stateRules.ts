// "Your state's rules ›" in a folder opens that folder's state-by-state facts on keepmyproof.com, in the
// app's language when the site has that language for the folder (else English). The sourced, checked facts
// live only on the site; the app carries no state facts (owner decision 13 Nov 2026).
import type { Lang } from './model';
const SITE = 'https://keepmyproof.com';
const PATHS: Record<string, Partial<Record<Lang, string>>> = {
  'divorce-prep': { en: '/divorce/', es: '/es/divorcio/', zh: '/zh/divorce/' },
  'workplace-evidence': { en: '/workplace/', es: '/es/trabajo/' },
  'va-disability-papers': { en: '/va/', es: '/es/va/' },
  'executor-papers': { en: '/executor/', es: '/es/albacea/', ko: '/ko/executor/' },
  'iep-binder': { en: '/iep/', es: '/es/iep/' },
};
/** The site page for a launch folder, or null for a person's own folder (no state facts). */
export function stateRulesPath(folder: string, lang: Lang): string | null {
  const p = PATHS[folder]; return p ? (p[lang] ?? p.en ?? null) : null;
}
export const stateRulesUrl = (folder: string, lang: Lang) => { const p = stateRulesPath(folder, lang); return p ? SITE + p : null; };
