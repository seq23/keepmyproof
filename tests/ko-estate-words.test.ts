// Korean estate pages: published in Korean only (25 small-estate facts had come back from a free model in
// Chinese and were live), and in the words people type (프로베이트, 사망증명서), with 유언검인 kept once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';
import { factKey } from '../site/lib/gate.mjs';

const answer = (s: string) => /<p class="definition answer">(.*?)<\/p>/.exec(s)![1];
// The facts and the answer built from them (the folder checklist is the app's own approved copy).
const main = (s: string) => (answer(s) + /<ul class="facts">([\s\S]*?)<\/ul>/.exec(s)![1]).replace(/<[^>]+>/g, ' ');

const fact = (n: number, claim_en: string, extra = {}) => ({ claim_en, claim_es: `ES ${n}`, source_url: `https://courts.example.gov/ca/${n}`, source_name: 'California Fixture Court', quote: `fixture quote number ${n}`, checked: '2026-11-02', ...extra });
function input(ko: Record<number, string>, title: string) {
  const facts = [fact(1, 'California probate starts with a petition.'), fact(2, 'California requires the original will to be filed.'), fact(3, 'California small estates use an affidavit.')];
  const data = { folder: 'executor', subtopic: 'fixture-probate', title_en: 'Probate in {state}', title_es: 'Sucesión en {state_es}', states: { CA: { facts, official_links: [] } } };
  const tr = { schema: 'kmp-translation-v1', folder: 'executor', subtopic: 'fixture-probate', lang: 'ko', title, facts: Object.fromEntries(facts.map((f, i) => [factKey(f), ko[i + 1]])) };
  return { facts: { divorce: [], workplace: [], va: [], executor: [data], iep: [] }, verified: { executor: Object.fromEntries(facts.map((f) => [factKey(f), '2026-11-02'])) }, translations: { executor: { 'fixture-probate.ko': tr } }, toolFacts: [] };
}
const koPage = (r: any) => r.files[r.pages.find((p: any) => p.state?.lang === 'ko')?.file];

test('a Korean page is built only from facts written in Korean: a fact in Chinese is left out', () => {
  const r = renderAll(input({ 1: '캘리포니아에서는 청원서로 유언검인을 시작합니다.', 2: '캘리포니아에서는 원본 유언장을 법원에 제출해야 합니다.', 3: '在加利福尼亚州，小额遗产使用宣誓书。' }, '{state} 상속 절차'));
  assert.equal(koPage(r), undefined, 'with only 2 Korean facts the page does not publish');
  assert.ok(r.stops.some((s: string) => /KO_UNDER_3_VERIFIED/.test(s)), 'and the build says why');
});

test('Korean facts use 프로베이트 and 사망증명서 with the right particle, and the formal 유언검인 appears once', () => {
  const ko = { 1: '캘리포니아에서는 청원서로 유언검인을 시작합니다.', 2: '캘리포니아에서는 원본 유언장과 사망 증명서를 법원에 제출해야 합니다.', 3: '캘리포니아의 소액 유산은 유언 검인 없이 진술서로 정리합니다.' };
  const plain = koPage(renderAll(input(ko, '{state} 상속 절차')));
  assert.ok(plain, 'the page publishes');
  const text = main(plain);
  assert.match(text, /프로베이트\(유언검인\)를 시작/, 'first mention keeps the formal term, with 를 after the vowel');
  assert.match(text, /사망증명서/);
  assert.equal((answer(plain).match(/유언검인/g) || []).length, 1, 'the formal term once in the answer');
  assert.ok(!/사망 증명서|유언 검인|프로베이트을/.test(text), 'no model wording or wrong particle left');
  const titled = koPage(renderAll(input(ko, '{state} 프로베이트(유언검인) 절차')));
  assert.equal((answer(titled).match(/유언검인/g) || []).length, 0, 'when the title carries the formal term the facts do not repeat it');
});

test('no live Korean state page carries a sentence written in Chinese', () => {
  const { files, pages } = renderAll();
  const ko = pages.filter((p: any) => p.state?.lang === 'ko');
  assert.ok(ko.length > 100, `only ${ko.length} Korean state pages`);
  for (const p of ko) for (const li of /<ul class="facts">([\s\S]*?)<\/ul>/.exec(files[p.file])![1].split('</li>')) {
    const t = li.replace(/<[^>]+>/g, ''), hangul = (t.match(/\p{Script=Hangul}/gu) || []).length, han = (t.match(/\p{Script=Han}/gu) || []).length;
    if (t.trim()) assert.ok(hangul > han, `${p.path}: "${t.trim().slice(0, 40)}"`);
  }
});
