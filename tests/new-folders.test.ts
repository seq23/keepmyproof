// The tenant and home inventory folders (21 Nov 2026): launch folders on every plan, free rules unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appFolders, empty, folderLines, homeButtons, launchFolders } from '../src/core/model';
import { FREE_LIMIT } from '../src/core/vault';
import topics from '../topics.json';
import { draft, fixture } from './helpers';

test('tenant and home inventory are launch folders, on Home for a free plan, with their room checklists', async () => {
  assert.equal(launchFolders.length, topics.launch_folder_count);
  for (const id of ['tenant-repairs-deposit', 'home-inventory']) {
    assert.ok(appFolders.some(f => f.id === id), id);
    assert.ok(homeButtons(empty()).some(b => b.kind === 'folder' && b.id === id), id);
    assert.ok(folderLines(empty(), id, 'en').length >= 8, id);
  }
  // The lead folders keep their places at the top of Home.
  assert.deepEqual(launchFolders.slice(0, 5).map(f => f.priority), ['lead', 'lead', 'lead', 'lead', 'lead']);
  // Co-parenting is named where people look: the divorce folder's name on Home, in every language.
  const d = launchFolders.find(f => f.id === 'divorce-prep')!;
  assert.match(d.display_name!.en, /co-parenting log/i);
  assert.match(d.display_name!.es, /crianza/i);
});

test('the free tier is unchanged: adding to a new folder counts toward the same 25, and stops there', async () => {
  assert.equal(FREE_LIMIT, 25);
  const { vault } = await fixture();
  for (let n = 0; n < FREE_LIMIT; n++) await vault.add(draft({ folder: n % 2 ? 'tenant-repairs-deposit' : 'home-inventory', title: `Invented ${n}` }), false);
  await assert.rejects(vault.add(draft({ folder: 'home-inventory' }), false), /ITEM_LIMIT/);
  assert.equal((await vault.add(draft({ folder: 'tenant-repairs-deposit' }), true)).length > 0, true);
});
