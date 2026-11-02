import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyFacts } from '../scripts/verify-facts.mjs';
import { renderAll } from '../site/build.mjs';
import { bannedWord } from '../site/lib/gate.mjs';

// Invented sources on example.gov. The fake fetcher returns each page's text; one page is down.
const PAGE: Record<string, string> = {
  'https://ca.example.gov/a': '<p>California rule alpha says residents wait</p><td>forty</td><td>days before filing</td>',
  'https://or.example.gov/a': '<p>Oregon rule alpha says residents wait</p>',
  'https://nv.example.gov/a': '<p>Nevada rule alpha says residents wait</p>',
  'https://us.example.gov/a': '<p>The federal rule says every filing needs a cover sheet.</p><p>Federal forms are free to download.</p>',
  'https://wa.example.gov/a': '<p>Washington Office of Fixtures</p><p>Phone 360-555-0100</p>',
  'https://az.example.gov/a': '<p>Arizona rule alpha says residents wait</p><p>Arizona rule beta applies to every county</p><p>Arizona papers are court-ready when stamped</p>',
};
const f = (url: string, quote: string, claim: string) => ({ claim_en: claim, claim_es: `ES ${claim}`, source_url: url, source_name: 'Fixture source', quote, checked: '2026-11-02' });
const national = [f('https://us.example.gov/a', 'every filing needs a cover sheet', 'Every filing needs a cover sheet.'), f('https://us.example.gov/a', 'Federal forms are free to download', 'Federal forms are free to download.')];
const DATA = {
  folder: 'iep', subtopic: 'gate-fixture', title_en: 'Gate fixture rules in {state}', title_es: 'Reglas de prueba en {state_es}',
  states: {
    // 3 verified, 2 state-specific (one quote spans table cells): publishes.
    CA: { facts: [f('https://ca.example.gov/a', 'California rule alpha says residents wait', 'California residents wait under rule alpha.'), f('https://ca.example.gov/a', 'forty days before filing', 'California residents wait forty days before filing.'), national[0]] },
    // One quote is not on the page: 2 verified, refused.
    OR: { facts: [f('https://or.example.gov/a', 'Oregon rule alpha says residents wait', 'Oregon residents wait under rule alpha.'), f('https://or.example.gov/a', 'Oregon rule gamma is not on this page', 'Oregon has rule gamma.'), national[0]] },
    // 3 verified but only 1 state-specific (the other two read the same on another state's page): refused.
    NV: { facts: [f('https://nv.example.gov/a', 'Nevada rule alpha says residents wait', 'Nevada residents wait under rule alpha.'), ...national] },
    // Office name + phone count as one state-specific fact: refused.
    WA: { facts: [f('https://wa.example.gov/a', 'Washington Office of Fixtures', 'The state office is the Washington Office of Fixtures.'), f('https://wa.example.gov/a', 'Phone 360-555-0100', 'Its phone number is 360-555-0100.'), national[1]] },
    // A banned claim word drops the fact: 2 left, refused, and the word never reaches a page.
    AZ: { facts: [f('https://az.example.gov/a', 'Arizona rule alpha says residents wait', 'Arizona residents wait under rule alpha.'), f('https://az.example.gov/a', 'Arizona rule beta applies to every county', 'Arizona rule beta applies in every county.'), f('https://az.example.gov/a', 'Arizona papers are court-ready when stamped', 'Arizona papers are court-ready when stamped.')] },
    // Its source is down: nothing verified, refused.
    TX: { facts: [f('https://tx.example.gov/down', 'Texas rule alpha says residents wait', 'Texas residents wait.'), f('https://tx.example.gov/down', 'Texas rule beta', 'Texas rule beta.'), f('https://tx.example.gov/down', 'Texas rule gamma', 'Texas rule gamma.')] },
  },
};

test('verify-facts keeps a fact only if its quote is on the fetched page, and a state page publishes only with 3+ verified facts, 2+ state-specific (office and contact count once) and no banned word', async () => {
  const fetchText = async (url: string) => { if (!(url in PAGE)) throw Error('HTTP 503'); const { sourceText } = await import('../site/lib/gate.mjs'); return sourceText(PAGE[url]); };
  const res = await verifyFacts([{ folder: 'iep', file: 'iep/gate-fixture.json', data: DATA }], { fetchText, today: '2026-11-02' });
  const r = res.iep;
  assert.ok(r.stops.some((s: string) => s.includes('[QUOTE_NOT_ON_PAGE] iep/gate-fixture/OR#2')), 'missing quote dropped');
  assert.ok(r.stops.some((s: string) => s.includes('[FETCH_FAILED] iep/gate-fixture/TX#1')), 'unreachable source dropped');
  assert.ok(r.stops.some((s: string) => s.includes('[BANNED_WORD] iep/gate-fixture/AZ#3')), 'banned word dropped');
  assert.equal(r.pages, 1, 'only CA is publishable');

  const { pages, files, stops } = renderAll({ facts: { divorce: [], workplace: [], va: [], executor: [], iep: [DATA] }, verified: { iep: r.facts }, translations: {}, toolFacts: [] });
  const published = pages.filter((p: any) => p.state).map((p: any) => `${p.state.code}-${p.state.lang}`).sort();
  assert.deepEqual(published, ['CA-en', 'CA-es']);
  for (const [code, why] of [['OR', 'UNDER_3_VERIFIED'], ['NV', 'UNDER_2_STATE_SPECIFIC'], ['WA', 'UNDER_2_STATE_SPECIFIC'], ['AZ', 'UNDER_3_VERIFIED'], ['TX', 'UNDER_3_VERIFIED']])
    assert.ok(stops.some((s: string) => s.includes(`[${why}] iep/gate-fixture/${code}`)), `${code} refused as ${why}`);
  for (const p of pages.filter((x: any) => !x.external)) assert.equal(bannedWord(files[p.file].replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ')), null, p.path);
});

test('quote matching decodes double-encoded entities, so a dollar amount written as &amp;dollar; still matches its quote', async () => {
  const { quoteOnPage, sourceText } = await import('../site/lib/gate.mjs');
  assert.ok(quoteOnPage('a filing fee of $250', sourceText('<p>a filing fee of &amp;dollar;250</p>')));
  assert.ok(quoteOnPage('fee & costs: $10', sourceText('<td>fee &amp;amp; costs: &#36;10</td>')));
  assert.ok(!quoteOnPage('a filing fee of $300', sourceText('<p>a filing fee of &amp;dollar;250</p>')));
});

test('a Chinese or Korean fact that left ordinary English words untranslated never publishes; official names may stay in English', async () => {
  const { untranslated } = await import('../site/lib/gate.mjs');
  assert.equal(untranslated('Arizona에서 surviving spouse는 owing up to $5,000의 wages를 수집'), true);
  assert.equal(untranslated('根据 Connecticut General Statutes，{state}的居住要求为十二个月。'), false);
  assert.equal(untranslated('Superior Court of Arizona 법원 양식 DD-214'), false);
});
