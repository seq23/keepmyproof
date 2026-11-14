import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';
import { STATES } from '../site/lib/states.mjs';

// "Neighbouring states" on a state page lists only states that really share a border (never the
// alphabetically next ones), and the border table agrees with itself both ways.
test('neighbouring-state links on every English state page are real bordering states', () => {
  for (const [code, s] of Object.entries(STATES)) for (const n of s.neighbours) assert.ok(STATES[n]?.neighbours.includes(code), `${code}-${n} is not mutual`);
  const bySlug = Object.fromEntries(Object.values(STATES).map((s: any) => [s.slug.en, s.code]));
  const { files } = renderAll();
  let pages = 0, links = 0;
  for (const [file, html] of Object.entries(files)) {
    if (typeof html !== 'string' || file.startsWith('es/') || file.startsWith('zh/') || file.startsWith('ko/') || !html.includes('class="facts"')) continue;
    const code = bySlug[file.split('/').pop()!.replace(/\.html$/, '')]; if (!code) continue;
    pages++;
    const list = /<h2>Neighbouring states<\/h2><ul class="links">([\s\S]*?)<\/ul>/.exec(html)?.[1] ?? '';
    for (const m of list.matchAll(/href="[^"]*\/([a-z-]+)"/g)) { links++; assert.ok(STATES[code].neighbours.includes(bySlug[m[1]]), `${file}: ${m[1]} does not border ${code}`); }
  }
  assert.ok(pages > 500 && links > 500, `only ${pages} pages, ${links} links checked`);
});
