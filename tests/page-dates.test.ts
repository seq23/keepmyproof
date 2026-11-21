// Page dates come from each page's own data, never a site-wide constant (review of #66, 21 Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carryFirstMeasured } from '../scripts/measure-complaints.mjs';
import { renderAll } from '../site/build.mjs';

test('a newly measured app is published today, once; an app measured before keeps its first date on every later run', () => {
  const run1 = carryFirstMeasured([{ slug: 'old' }, { slug: 'new' }], [{ slug: 'old', measured: '2026-11-02' }], '2026-11-21');
  assert.deepEqual(run1.map((r: { first_measured: string }) => r.first_measured), ['2026-11-02', '2026-11-21']);
  const run2 = carryFirstMeasured([{ slug: 'old' }, { slug: 'new' }], run1.map((r: object) => ({ ...r, measured: '2026-12-01' })), '2026-12-01');
  assert.deepEqual(run2.map((r: { first_measured: string }) => r.first_measured), ['2026-11-02', '2026-11-21']);
});

test('pages keep their own dates across builds, and new pages show their own publish day', () => {
  const a = renderAll().files, b = renderAll().files;
  const dates = (h: string) => [...h.matchAll(/"date(?:Published|Modified)":"([\d-]+)"/g)].map((m) => m[1]).join();
  for (const f of ['tenant/move-out-checklist.html', 'custody-log.html', 'alternatives/talkingparents.html', 'alternatives/keepsafe.html', 'tenant/index.html']) assert.equal(dates(a[f]), dates(b[f]), f);
  const text = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(text(a['tenant/move-out-checklist.html']), /Published November 21, 2026/);
  assert.match(text(a['custody-log.html']), /Published November 6, 2026/);
  assert.match(a['alternatives/keepsafe.html'], /"datePublished":"2026-11-02"/);
  assert.match(a['alternatives/talkingparents.html'], /"datePublished":"2026-11-21"/);
});
