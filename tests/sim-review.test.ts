// The first-time-user test on the iOS simulator, 14 Nov 2026: each fix as behaviour.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { b64 } from '../src/core/crypto';
import { parseUserDate, resolveHappened, typingDate } from '../src/core/dates';
import { appFolders, type Item } from '../src/core/model';
import { Vault, newestFirst, startInstall, type InstallStore } from '../src/core/vault';
import { copy } from '../src/strings';
import { LANGS } from '../src/core/model';
import { MemoryStore, draft, fixture, random } from './helpers';

test('2: a reinstall (no vault file yet) forgets the passcode an earlier install left in the Keychain and starts setup', async () => {
  const keychain = new Map([['kmp-lock-v1', '{"old":"lock"}'], ['kmp-key-v1', 'old key'], ['kmp-lang-v1', 'es']]);
  const store = Object.assign(new MemoryStore(), { archive: async () => { throw Error('nothing to set aside'); } }) as InstallStore;
  const o = { store, hasLock: async () => keychain.has('kmp-lock-v1'), forget: async () => keychain.clear() };
  assert.equal(await startInstall({ ...o, installed: false }), false, 'setup, not "Your papers are locked"');
  assert.equal(keychain.size, 0, 'the old passcode, key and settings are gone');
  // The same phone on its next launch, and an install updated from an older version: kept as they are.
  keychain.set('kmp-lock-v1', '{"new":"lock"}');
  assert.equal(await startInstall({ ...o, installed: true }), true);
  assert.equal(keychain.get('kmp-lock-v1'), '{"new":"lock"}');
  assert.equal(await startInstall({ ...o, installed: true, hasLock: async () => false }), false, 'no passcode: setup');
});

test('3: the date takes digits only, puts the slashes in, and reads 03152026 as 15 March 2026', () => {
  const typed: string[] = []; let box = '';
  for (const ch of '03152026') { box = typingDate(box + ch); typed.push(box); }
  assert.deepEqual(typed, ['0', '03', '03/1', '03/15', '03/15/2', '03/15/20', '03/15/202', '03/15/2026']);
  assert.equal(typingDate('03/1'), '03/1', 'backspace over a digit');
  assert.equal(typingDate('03/'), '03', 'backspace leaves no dangling slash');
  assert.equal(typingDate('031520261'), '03/15/2026', 'no ninth digit');
  assert.equal(typingDate('3/5/2026'), '3/5/2026', 'a pasted date is left as typed');
  assert.equal(parseUserDate('03152026'), '2026-03-15');
  assert.equal(parseUserDate('03/15/2026'), '2026-03-15');
  assert.equal(resolveHappened({ date: '03152026', time: '', unknown: false }), '2026-03-15');
  assert.throws(() => parseUserDate('13152026'), /invalidDate/);
});

test('6: the folders line counts the real folder list, in every language', () => {
  for (const l of LANGS) {
    const line = copy(l)('five', { n: appFolders.length });
    assert.ok(line.includes(String(appFolders.length)) && !line.includes('{n}'), `${l}: ${line}`);
  }
  assert.ok(appFolders.some(f => f.id === 'private'), 'Private is counted');
});

test('9: a render or a save does not copy or re-hash every saved photo', async () => {
  const { vault, store, key } = await fixture();
  const bytes = b64(random(300_000));
  await vault.addMany(Array.from({ length: 5 }, (_, n) => draft({ kind: 'photo', title: `p${n}`, filename: 'p.jpg', mime: 'image/jpeg', bytes })), true);
  const a = vault.snapshot(), b = vault.snapshot();
  assert.notEqual(a.items[0], b.items[0], 'each snapshot is its own copy to change');
  a.items[0].title = 'changed'; assert.notEqual(vault.snapshot().items[0].title, 'changed');
  // Reopening authenticates the whole vault, then trusts each file's saved hash.
  const again = new Vault(store, key.slice(), random); await again.load();
  assert.equal(again.snapshot().items.length, 5);
  // A changed file is still caught on save.
  await assert.rejects(vault.edit(a.items[1].id, { title: 'x', note: '', happenedOn: null, checklist: null, tags: [],
    file: { filename: 'p.jpg', mime: 'image/jpeg', bytes: '%%%' } }, true, true));
});

test('11: newest first uses the happened date, then the photo\'s own date, then the day it was saved', async () => {
  let t = 0; const saved = ['2026-11-14T10:00:00.000Z', '2026-11-14T10:00:01.000Z', '2026-11-14T10:00:02.000Z', '2026-11-14T10:00:03.000Z'];
  const vault = new Vault(new MemoryStore(), random(32), random, () => saved[t++]); await vault.load();
  const photo = (title: string, takenOn: string | null, happenedOn: string | null = null) =>
    draft({ folder: 'private', kind: 'photo', title, filename: 'p.jpg', mime: 'image/jpeg', bytes: b64(random(8)), takenOn, happenedOn });
  // Picked together: 2018 first, then two 2012 photos; one with a typed date of 2015.
  await vault.addMany([photo('2018', '2018-07-04T09:00'), photo('2012', '2012-05-01T08:00'), photo('typed 2015', '2012-01-01T08:00', '2015-03-01'), photo('no date', null)], true);
  const order = vault.items('private').map((i: Item) => i.title);
  assert.deepEqual(order, ['no date', '2018', 'typed 2015', '2012']);
  assert.equal(vault.snapshot().items.find(i => i.title === '2018')!.takenOn, '2018-07-04T09:00');
  assert.ok([...vault.snapshot().items].sort(newestFirst).every((i, n, all) => n === 0 || newestFirst(all[n - 1], i) <= 0));
});

test('12: tags save, filter and search on Plus, and a free plan cannot add them', async () => {
  const { vault } = await fixture();
  const { searchItems, parseTags, allTags } = await import('../src/core/model');
  const id = await vault.add(draft({ tags: parseTags(' school, , School ,school') }), true);
  assert.deepEqual(vault.snapshot().items[0].tags, ['school', 'School']);
  await vault.add(draft({ title: 'other' }), true);
  const items = vault.snapshot().items;
  assert.deepEqual(allTags(items), ['school', 'School']);
  assert.deepEqual(searchItems(items, '', 'school').map(i => i.id), [id]);
  assert.deepEqual(searchItems(items, 'SCHOOL').map(i => i.id), [id]);
  await assert.rejects(vault.add(draft({ tags: ['x'] }), false), /PLUS_REQUIRED/);
  await vault.edit(id, { title: 'kept', note: '', happenedOn: null, checklist: null, tags: ['school', 'School'] }, true, false);
  await assert.rejects(vault.edit(id, { title: 'kept', note: '', happenedOn: null, checklist: null, tags: ['new'] }, true, false), /PLUS_REQUIRED/);
});
