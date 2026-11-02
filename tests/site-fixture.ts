// Invented facts (example.gov sources) shaped like site/data/facts, already "verified", for site tests.
import { factKey } from '../site/lib/gate.mjs';

const fact = (state: string, n: number, extra = {}) => ({
  claim_en: `${state} fixture rule number ${n} applies to filings in ${state}.`, claim_es: `La regla de prueba número ${n} se aplica en ${state}.`,
  source_url: `https://courts.example.gov/${state.toLowerCase()}/rule-${n}`, source_name: `${state} Fixture Court`, quote: `fixture rule number ${n} applies`, checked: '2026-11-02', ...extra,
});
export function fixture() {
  const data = {
    folder: 'executor', subtopic: 'fixture-topic', title_en: 'Fixture rules in {state}', title_es: 'Reglas de prueba en {state_es}', search_intent_en: [],
    states: Object.fromEntries(['CA', 'OR', 'NV'].map((st) => [st, { facts: [1, 2, 3].map((n) => fact(st, n)), official_links: [] }])),
  };
  const verified: Record<string, string> = {};
  for (const e of Object.values(data.states)) for (const f of e.facts) verified[factKey(f)] = '2026-11-02';
  return { facts: { divorce: [], workplace: [], va: [], executor: [data], iep: [] }, verified: { executor: verified }, translations: {}, toolFacts: [] };
}
