// Page dates come from the generator's ledger, never a constant (review of #66, 21 Nov 2026: new pages
// said "Published November 6, 2026").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stampDates, contentHash, PUB, MOD, pubOn, modOn } from '../site/lib/page-dates.mjs';
import { renderAll } from '../site/build.mjs';

const fmt = (l: string, iso: string) => `${l}:${iso}`;
const page = (main: string, foot = 'footer') => `<html><main>${main}<p>Published <time datetime="${PUB}">${pubOn('en')}</time> · Updated <time datetime="${MOD}">${modOn('en')}</time></p></main><footer>${foot}</footer></html>`;

test('a new page is published on the build day; an unchanged page keeps its dates; a changed page keeps its first date', () => {
  const files: Record<string, string> = { 'new.html': page('fresh'), 'same.html': page('old'), 'edited.html': page('new words') };
  const ledger: Record<string, { published: string; modified: string; hash: string }> = { 'same.html': { published: '2026-11-02', modified: '2026-11-05', hash: contentHash(page('old')) },
    'edited.html': { published: '2026-11-06', modified: '2026-11-06', hash: contentHash(page('old words')) }, 'gone.html': { published: '2026-11-01', modified: '2026-11-01', hash: 'x' } };
  const r = stampDates(files, { ledger, today: '2026-11-21', format: fmt });
  assert.deepEqual([r.ledger['new.html'].published, r.ledger['new.html'].modified], ['2026-11-21', '2026-11-21']);
  assert.deepEqual([r.ledger['same.html'].published, r.ledger['same.html'].modified], ['2026-11-02', '2026-11-05']);
  assert.deepEqual([r.ledger['edited.html'].published, r.ledger['edited.html'].modified], ['2026-11-06', '2026-11-21']);
  assert.equal(r.ledger['gone.html'], undefined); assert.equal(r.changed, true);
  assert.match(files['new.html'], /datetime="2026-11-21">en:2026-11-21/);
  assert.match(files['same.html'], /Published <time datetime="2026-11-02">en:2026-11-02<\/time> · Updated <time datetime="2026-11-05">/);
});

test('a change outside the page content (footer, header) does not move its updated date', () => {
  const files: Record<string, string> = { 'a.html': page('same', 'new footer') };
  const r = stampDates(files, { ledger: { 'a.html': { published: '2026-11-02', modified: '2026-11-02', hash: contentHash(page('same', 'old footer')) } }, today: '2026-11-21', format: fmt });
  assert.equal(r.ledger['a.html'].modified, '2026-11-02'); assert.equal(r.changed, false);
});

test('the committed ledger matches the site: no date token is left and a build changes no date', () => {
  const r = renderAll();
  for (const [f, h] of Object.entries(r.files)) if (typeof h === 'string') assert.ok(!h.includes('⟦'), f);
  assert.equal(r.dates.changed, false, 'run node site/build.mjs and commit site/data/page-dates.json');
});
