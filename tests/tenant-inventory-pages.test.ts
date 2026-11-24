// Tenant, home inventory and co-parenting pages (PR 2, 21 Nov 2026): every page links its app folder, every
// state deadline has a dated official source, and every fact about another app carries the day it was read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderAll } from '../site/build.mjs';
import { htmlText } from '../site/lib/gate.mjs';
import { TENANT_LANDINGS, CHECKED } from '../site/landings-tenant.mjs';

const { files } = renderAll();
const page = (p: string) => files[p.replace(/^\//, '') + '.html'] as string;

test('each new page renders in all four languages and links its folder checklist and PDF', () => {
  for (const x of TENANT_LANDINGS) {
    for (const [lang, path] of [['en', x.path.en], ['es', x.path.es], ['zh', `/zh${x.path.en}`], ['ko', `/ko${x.path.en}`]]) {
      const html = page(path);
      assert.ok(html, `${x.id} ${lang} missing`);
      assert.match(html, /href="\/checklists\/[^"]+\.pdf"/, `${x.id} ${lang}: no folder PDF`);
      assert.match(htmlText(html), /not legal advice|no es asesoría|不构成|자문이 아닙니다/i, `${x.id} ${lang}: no disclaimer`);
    }
  }
});

test('every state deposit deadline page quotes an official source with the date it was checked', () => {
  const states = Object.keys(files).filter(f => /^tenant\/security-deposit-return-deadline\/[a-z-]+\.html$/.test(f) && !f.endsWith("/index.html"));
  assert.ok(states.length >= 25, `only ${states.length} state pages`);
  const verified = JSON.parse(readFileSync('site/data/verified/tenant.json', 'utf8'));
  // A source the weekly re-check could not reach keeps its last verified read as a NAMED NOTE
  // (FETCH_FAILED_KEPT, "kept from <day>"). That stays fine for 14 days; an older kept read, or any
  // other stop, still goes red here.
  const now = Date.now();
  const bad = (verified.stops as string[]).filter((s) => {
    const m = s.match(/^NAMED NOTE \[FETCH_FAILED_KEPT\] .*\(kept from (\d{4}-\d{2}-\d{2})\)$/);
    return !m || now - Date.parse(m[1] + 'T00:00:00Z') > 14 * 86_400_000;
  });
  assert.deepEqual(bad, []);
  for (const f of states) {
    const t = htmlText(files[f] as string);
    assert.match(t, /Sources checked [A-Z][a-z]+ \d{1,2}, 2026/, f);
    assert.match(t, /Not legal advice/, f);
    assert.match(files[f] as string, /href="https?:\/\/[^"]+\.(gov|us)\//, `${f}: no official source link`);
  }
});

test('facts about other apps say when they were read, and the app is never claimed as already in the store', () => {
  const app = htmlText(page('/home-inventory/app'));
  assert.equal(CHECKED, '2026-11-21');
  assert.match(app, /21 November 2026/);
  assert.match(app, /coming soon/i);
  assert.doesNotMatch(app, /download (it )?now|available now on the app store/i);
  for (const slug of ['talkingparents', 'ourfamilywizard']) {
    const alt = htmlText(files[`alternatives/${slug}.html`] as string);
    assert.match(alt, /own pricing page, read on November 21, 2026/, slug);
  }
});
