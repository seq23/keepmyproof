import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';
import { launchFolders, LANGS } from '../src/core/model';
import { NO_STATE_PAGE, stateRulesPath } from '../src/core/stateRules';

// The app's "Your state's rules ›" row must open a state-by-state page the site really publishes,
// for every launch folder in every app language (a missing page would be a dead link in the app).
test("every launch folder's state rules link opens a published state-by-state page", () => {
  const { files } = renderAll();
  const served = (p: string) => (p.endsWith('/') ? `${p}index.html` : `${p}.html`).slice(1) in files;
  let n = 0;
  for (const f of launchFolders) for (const lang of LANGS) {
    // A folder named as having no state page shows no link at all, never a dead one.
    if (NO_STATE_PAGE.has(f.id)) { assert.equal(stateRulesPath(f.id, lang), null, `${f.id}/${lang}`); continue; }
    const path = stateRulesPath(f.id, lang);
    assert.ok(path, `${f.id}/${lang}: no state rules page`);
    assert.ok(served(path!), `${f.id}/${lang}: ${path} is not published`);
    assert.match(files[(path! + 'index.html').slice(1)], /class="box"/, `${f.id}/${lang}: ${path} lists no subtopics`);
    n++;
  }
  assert.ok(n >= 20);
  for (const id of NO_STATE_PAGE) assert.equal(launchFolders.find(f => f.id === id)?.priority, 'support', `${id}: only support folders may go without a state page`);
  assert.ok(launchFolders.length - NO_STATE_PAGE.size >= 5, 'the five lead folders keep their state pages');
  assert.equal(stateRulesPath('own-folder-123', 'en'), null);
});
