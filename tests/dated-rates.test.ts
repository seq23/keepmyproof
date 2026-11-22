// Minimum-wage pages: every amount is a dated, sourced rate, and a page never shows a rate that is no
// longer (or not yet) the rate as if it were (the 2027 Spanish wage refresh, 21 Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll, loadFacts } from '../site/build.mjs';
import { factKey, factProblems } from '../site/lib/gate.mjs';
import { SITE } from '../site/config.mjs';

const visible = (s: string) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<head>[\s\S]*?<\/head>/g, '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const graph = (s: string) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(s)![1])['@graph'] as any[];

// Invented sources on example.gov: a national table read on 2 Nov 2026, and the state's own notice of a 2027 rate.
const base = (o: Record<string, any>): Record<string, any> => ({ source_name: 'Fixture Labor Office', checked: '2026-11-02', ...o });
const table = base({ claim_en: 'The federal table lists a basic state minimum wage of $16.90 per hour for Oregon.', claim_es: 'La tabla federal indica un salario mínimo estatal básico de $16.90 por hora en Oregón.', source_url: 'https://us.example.gov/table', quote: 'Oregon Basic Minimum Rate (per hour): $16.90', rate: { kind: 'basic', usd: '16.90' } });
const notice = base({ claim_en: "From January 1, 2027, Oregon's minimum wage is $17.40 per hour, its labor office says.", claim_es: 'A partir del 1 de enero de 2027, el salario mínimo de Oregón es de $17.40 por hora, según su oficina de trabajo.', source_url: 'https://or.example.gov/notice', quote: 'Beginning January 1, 2027, the minimum wage will increase to $17.40 per hour', checked: '2026-11-21', rate: { kind: 'basic', usd: '17.40', from: '2027-01-01' } });
const office = base({ claim_en: 'The Oregon Bureau of Labor and Industries enforces wage rules in the state.', claim_es: 'La Oficina de Trabajo e Industrias de Oregón hace cumplir las reglas de salario en el estado.', source_url: 'https://or.example.gov/office', quote: 'The Bureau enforces wage rules' });
const overtime = base({ claim_en: 'Oregon requires overtime pay after 40 hours in a week.', claim_es: 'Oregón exige pago de horas extra después de 40 horas en una semana.', source_url: 'https://or.example.gov/ot', quote: 'overtime pay after 40 hours in a week' });
function input(facts: any[], today: string) {
  const data = { folder: 'workplace', subtopic: 'minimum-wage', dated_rates: true, title_en: 'Minimum wage in {state}', title_es: 'Salario mínimo en {state_es}',
    title_rate_en: '{state} minimum wage {year}: ${usd} an hour', title_rate_es: 'Salario mínimo en {state_es} {year}: ${usd} la hora', states: { OR: { facts, official_links: [] } } };
  const verified = Object.fromEntries(facts.map((f) => [factKey(f), '2026-11-21']));
  return { facts: { divorce: [], workplace: [data], va: [], executor: [], iep: [] }, verified: { workplace: verified }, translations: {}, toolFacts: [], today };
}
const page = (r: { files: Record<string, string>; pages: any[] }, l: 'en' | 'es') => r.files[r.pages.find((p) => p.state?.code === 'OR' && p.state.lang === l)?.file];

test('a rate read before a newer dated rate takes effect never shows after that day; before it, the coming rate is in the answer and the title', () => {
  const before = renderAll(input([table, notice, office, overtime], '2026-12-01'));
  for (const l of ['en', 'es'] as const) {
    const s = page(before, l), answer = /<p class="definition answer">(.*?)<\/p>/.exec(s)![1];
    assert.ok(answer.includes('$16.90') && answer.includes('$17.40'), `${l}: the answer gives the rate in force and the coming one`);
    assert.match(/<title>(.*?)<\/title>/.exec(s)![1], /2027: \$17\.40/, `${l}: the title names the coming rate`);
  }
  const after = renderAll(input([table, notice, office, overtime], '2027-01-04'));
  for (const l of ['en', 'es'] as const) {
    const s = page(after, l);
    assert.ok(s, `${l} page still publishes`);
    assert.ok(!s.includes('16.90'), `${l}: the stale $16.90 is gone from the page, the schema and the description`);
    assert.ok(visible(s).includes('$17.40'), `${l}: the rate in force is shown`);
  }
});

test('a dollar amount with no rate tag, or a rate whose amount is not in its claims and quote, never publishes', () => {
  const { stop, ...untagged } = { ...overtime, claim_en: 'Oregon pays a $5.00 meal allowance.', claim_es: 'Oregón paga $5.00 por comida.', quote: 'a $5.00 meal allowance', stop: 0 };
  const r = renderAll(input([notice, office, overtime, untagged], '2026-12-01'));
  assert.ok(page(r, 'en'), 'the page publishes without the untagged fact');
  assert.ok(!visible(page(r, 'en')).includes('$5.00'), 'the untagged amount is not shown');
  const wrong = { ...notice, rate: { ...notice.rate, usd: '17.45' } };
  assert.deepEqual(factProblems(wrong).map((p) => p[0]), ['RATE_NOT_STATED', 'RATE_NOT_STATED', 'RATE_NOT_STATED']);
  const undated = { ...notice, claim_en: "Oregon's minimum wage is $17.40 per hour.", claim_es: 'El salario mínimo de Oregón es de $17.40 por hora.' };
  assert.ok(factProblems(undated).some((p) => p[0] === 'RATE_UNDATED_CLAIM'), 'a dated rate whose claim does not name its year is refused');
});

// The real data, on a November build and on the first Monday refresh of 2027.
for (const today of ['2026-11-23', '2027-01-04']) {
  test(`minimum-wage pages (${today}): every amount traces to its cited quote, each page has its English/Spanish twin, and the twins carry the same dates`, () => {
    const real = loadFacts(), { files, pages } = renderAll({ ...real, today });
    const data = real.facts.workplace.find((d: any) => d.subtopic === 'minimum-wage');
    const states = pages.filter((p: any) => p.state?.subtopic === 'minimum-wage');
    assert.ok(states.filter((p: any) => p.state.lang === 'es').length >= 48, 'the Spanish wage pages publish');
    for (const p of states as any[]) {
      const s = files[p.file], st = data.states[p.state.code];
      const quotes = st.facts.map((f: any) => f.quote).join(' ');
      const shown = /<ul class="facts">([\s\S]*?)<\/ul>/.exec(s)![1] + /<p class="definition answer">(.*?)<\/p>/.exec(s)![1] + /<title>(.*?)<\/title>/.exec(s)![1];
      for (const [amount] of shown.matchAll(/\$\d[\d,]*(?:\.\d+)?/g)) assert.ok(quotes.includes(amount.replace(/\.$/, '')) || quotes.includes(amount.replace(/\.00$/, '')), `${p.path}: ${amount} is in no quote`);
      // Twins: the other language exists, links back, and shows the same checked date as its schema.
      const twinLang = p.state.lang === 'en' ? 'es' : 'en', twinPath = p.alt[twinLang];
      assert.ok(twinPath, `${p.path}: no ${twinLang} twin`);
      const twin = pages.find((x: any) => x.path === twinPath)!;
      assert.ok(twin, `${p.path}: ${twinPath} is not built`);
      assert.ok(files[twin.file].includes(`hreflang="${p.state.lang}" href="${SITE.origin}${p.path}"`), `${twinPath} links back to ${p.path}`);
      const modified = graph(s).find((n: any) => n['@type'] === 'Article').dateModified;
      assert.equal(p.updated, modified, `${p.path}: the sitemap date is the schema date`);
      assert.equal(twin.updated, p.updated, `${p.path} and ${twinPath}: same checked date`);
    }
  });
}
