import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleVault } from '../src/preview';
import { launchFolders } from '../src/core/model';

// The preview build's "skip to a sample vault" must load papers the real vault accepts: a wrong folder or
// checklist id would make the 3-minute Appetize demo open on an error instead of the folders.
test('preview sample papers use real folders and checklist lines, and never exceed the free limit', () => {
  const drafts = sampleVault();
  assert.ok(drafts.length > 0 && drafts.length < 25);
  for (const d of drafts) {
    const topic = launchFolders.find(f => f.id === d.folder);
    assert.ok(topic, `unknown folder ${d.folder}`);
    if (d.checklist !== null) assert.ok(topic!.checklist_items?.some(c => c.id === d.checklist), `unknown checklist ${d.checklist}`);
    assert.equal(d.kind, 'note');
  }
});
