// The 20 first-time-user findings of 14 Nov 2026 (findings-keepmyproof.md), as behaviour.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { b64, phrase, recoveryKey, utf8 } from '../src/core/crypto';
import { backupName, exifTime, inputDate, inputTime, parseTime, parseUserDate, resolveHappened, showHappened } from '../src/core/dates';
import { DEFAULT_ADD_FOLDER, PRIVATE_FOLDER, allTags, backupNudge, empty, folderLines, homeButtons, parseTags, searchItems, validate, type Item } from '../src/core/model';
import { FREE_LIMIT } from '../src/core/vault';
import { AppLock, createLock, type LockRecord } from '../src/core/lock';
import { bioKind, BIO_NAME } from '../src/core/bio';
import { exportHtml } from '../src/core/export';
import { copy, strings } from '../src/strings';
import { LANGS } from '../src/core/model';
import topics from '../topics.json';
import { draft, fileDraft, fixture, random } from './helpers';

test('1-2: adds that start outside a folder go to the neutral Private folder, which free plans have and Home shows', async () => {
  assert.equal(DEFAULT_ADD_FOLDER, PRIVATE_FOLDER.id);
  assert.ok(!/\b(divorce|custody|va|iep|work)/i.test(PRIVATE_FOLDER.display_name.en));
  const { vault } = await fixture();
  await vault.add(draft({ folder: DEFAULT_ADD_FOLDER, kind: 'photo', filename: 'a.jpg', mime: 'image/jpeg', bytes: b64(utf8('invented')) }), false);
  const s = vault.snapshot();
  assert.equal(s.items[0].folder, 'private');
  assert.ok(homeButtons(s).some(b => b.kind === 'folder' && b.id === 'private' && b.items === 1));
  assert.deepEqual(folderLines(s, 'private', 'en'), []);
  for (const l of LANGS) assert.ok(PRIVATE_FOLDER.display_name[l].trim(), l);
  assert.doesNotThrow(() => validate(s));
});

test('3: a typed date is never dropped; typing with "not sure" ticked is refused, and an empty date asks', () => {
  assert.throws(() => resolveHappened({ date: '11/03/2026', time: '', unknown: true }), /dateConflict/);
  assert.throws(() => resolveHappened({ date: '', time: '6pm', unknown: true }), /dateConflict/);
  assert.throws(() => resolveHappened({ date: '', time: '', unknown: false }), /dateMissing/);
  assert.throws(() => resolveHappened({ date: '', time: '6pm', unknown: false }), /timeNoDate/);
  assert.equal(resolveHappened({ date: '', time: '', unknown: true }), null);
  assert.equal(resolveHappened({ date: '11/03/2026', time: '', unknown: false }), '2026-11-03');
});

test('4: US dates are accepted, a typed time is kept, and no time is shown that nobody entered', () => {
  assert.equal(parseUserDate('11/03/2026'), '2026-11-03');
  assert.equal(parseUserDate('1/5/2026'), '2026-01-05');
  assert.equal(parseUserDate('2026-11-03'), '2026-11-03');
  for (const bad of ['13/01/2026', '02/30/2026', 'tomorrow', '11/03/26']) assert.throws(() => parseUserDate(bad), /invalidDate/, bad);
  assert.equal(parseTime('6pm'), '18:00'); assert.equal(parseTime('6:30 PM'), '18:30'); assert.equal(parseTime('12am'), '00:00');
  assert.equal(parseTime('18:05'), '18:05'); assert.equal(parseTime(''), null);
  for (const bad of ['6', '25:00', '13pm', '6:75', 'noon']) assert.throws(() => parseTime(bad), /invalidTime/, bad);
  const withTime = resolveHappened({ date: '11/03/2026', time: '6pm', unknown: false })!;
  assert.equal(withTime, '2026-11-03T18:00');
  assert.equal(showHappened('2026-11-03', 'en-US'), '11/3/2026', 'a date alone shows no time');
  assert.equal(showHappened(withTime, 'en-US'), '11/3/2026 6:00 PM');
  assert.equal(inputDate(withTime), '11/03/2026'); assert.equal(inputTime(withTime), '6:00 PM'); assert.equal(inputTime('2026-11-03'), '');
  const html = exportHtml([{ ...draft(), id: 'x', happenedOn: '2026-11-03', savedOn: '2026-11-14T15:00:00Z', changedOn: null, sha256: null, history: [] }], { title: 't', madeOn: '2026-11-14T00:00:00Z', lang: 'en' });
  assert.ok(html.includes('11/3/2026<br>'), 'the PDF shows the day with no invented time');
});

test('4: a typed time is stored as it was typed, sorts within its day, and survives the vault in any time zone', async () => {
  const before = process.env.TZ; process.env.TZ = 'America/Chicago';
  try {
    const { vault } = await fixture();
    await vault.add(draft({ title: 'morning', happenedOn: '2026-11-03T08:00' }), false);
    await vault.add(draft({ title: 'evening', happenedOn: '2026-11-03T18:00' }), false);
    await vault.add(draft({ title: 'next day', happenedOn: '2026-11-04' }), false);
    assert.deepEqual(vault.items('divorce-prep').map(i => i.title), ['next day', 'evening', 'morning']);
    assert.equal(vault.snapshot().items[1].happenedOn, '2026-11-03T18:00');
    process.env.TZ = 'Asia/Tokyo';
    assert.equal(showHappened('2026-11-03T18:00', 'en-US'), '11/3/2026 6:00 PM');
  } finally { process.env.TZ = before; }
});

test('5: several photos are added in one save, all or nothing at the free limit; each can be named by its EXIF day', async () => {
  const { vault } = await fixture();
  const photo = (n: number) => draft({ folder: 'private', kind: 'photo', title: `p${n}`, filename: `${n}.jpg`, mime: 'image/jpeg', bytes: b64(utf8(`invented ${n}`)) });
  const ids = await vault.addMany([photo(1), photo(2), photo(3)], false);
  assert.equal(ids.length, 3); assert.equal(new Set(ids).size, 3);
  assert.equal(vault.snapshot().items.length, 3);
  for (let i = 3; i < FREE_LIMIT - 1; i++) await vault.add(draft(), false);
  await assert.rejects(vault.addMany([photo(4), photo(5)], false), /ITEM_LIMIT/);
  assert.equal(vault.snapshot().items.length, FREE_LIMIT - 1, 'none of the two was added');
  assert.equal(exifTime('2026:11:03 18:05:09'), '2026-11-03T18:05');
  assert.equal(exifTime(undefined), null); assert.equal(exifTime('2026:02:30 10:00:00'), null);
});

test('6: free PDFs leave unticked items out, and earlier versions stay out unless switched on', async () => {
  const { vault } = await fixture();
  const a = await vault.add(draft({ title: 'Keep me' }), false), b = await vault.add(draft({ title: 'Lawyer call notes' }), false);
  await vault.edit(a, { title: 'Keep me', note: 'second version', happenedOn: null, checklist: null, tags: [] }, true, false);
  const items = vault.items('divorce-prep', { ids: [a] }, false);
  assert.deepEqual(items.map(i => i.id), [a]); assert.ok(!items.some(i => i.id === b));
  const plain = exportHtml(items, { title: 't', madeOn: '2026-11-14T00:00:00Z', lang: 'en' });
  assert.ok(!plain.includes('A fictional note'), 'earlier version left out by default');
  assert.ok(exportHtml(items, { title: 't', madeOn: '2026-11-14T00:00:00Z', lang: 'en', history: true }).includes('A fictional note'));
});

test('7: an item can be moved and its file replaced; the earlier folder and file stay in its history and "saved on" never changes', async () => {
  const { vault } = await fixture();
  const id = await vault.add(fileDraft(utf8('wrong file'), 'wrong.pdf'), false);
  const saved = vault.snapshot().items[0].savedOn, oldSha = vault.snapshot().items[0].sha256;
  await vault.edit(id, { title: 'Right one', note: '', happenedOn: null, checklist: null, tags: [], folder: 'private',
    file: { filename: 'right.pdf', mime: 'application/pdf', bytes: b64(utf8('right file')) } }, true, false);
  const item = vault.snapshot().items[0];
  assert.equal(item.folder, 'private'); assert.equal(item.filename, 'right.pdf'); assert.equal(item.savedOn, saved);
  assert.notEqual(item.sha256, oldSha); assert.deepEqual(vault.original(id), utf8('right file'));
  assert.equal(item.history[0].folder, 'divorce-prep'); assert.equal(item.history[0].filename, 'wrong.pdf'); assert.equal(item.history[0].sha256, oldSha);
  assert.doesNotThrow(() => validate(vault.snapshot()));
  // A checklist line from the old folder cannot travel with it.
  const other = await vault.add(draft({ checklist: 'messages-received' }), false);
  await assert.rejects(vault.edit(other, { title: 'x', note: '', happenedOn: null, checklist: 'messages-received', tags: [], folder: 'private' }, true, false), /FORMAT_INVALID/);
  // A note has no file to replace.
  const note = await vault.add(draft(), false);
  await assert.rejects(vault.edit(note, { title: 'x', note: '', happenedOn: null, checklist: null, tags: [], file: { filename: 'a', mime: 'a', bytes: b64(utf8('a')) } }, true, false), /fileRequired/);
});

const lockStore = async () => {
  let r: LockRecord = await createLock('182736', phrase(random), false, random);
  const store = { read: async () => structuredClone(r), write: async (v: LockRecord) => { r = structuredClone(v); } };
  return { store, get: () => r };
};

test('8: erase runs only after the right passcode, and a wrong one counts as a wrong guess', async () => {
  const { store, get } = await lockStore(); let now = 0, wiped = 0;
  const lock = new AppLock(store, () => now);
  await assert.rejects(lock.erase('000000', async () => { wiped++; }), /PASSCODE_WRONG/);
  assert.equal(wiped, 0); assert.equal(get().attempts, 1);
  now = 10_000; await lock.erase('182736', async () => { wiped++; });
  assert.equal(wiped, 1);
});

test('9: the passcode can be changed behind the current one, and new recovery words replace the backup key', async () => {
  const { store, get } = await lockStore(); let now = 0;
  const lock = new AppLock(store, () => now);
  await assert.rejects(lock.change('000000', '111111', random), /PASSCODE_WRONG/);
  now = 10_000;
  await assert.rejects(lock.change('182736', '12', random), /PASSCODE_INVALID/);
  await lock.change('182736', '111111', random);
  await lock.unlock('111111'); await assert.rejects(lock.unlock('182736'), /PASSCODE_WRONG/);
  now = 100_000;
  const words = phrase(random);
  await assert.rejects(lock.renewRecovery('000000', words), /PASSCODE_WRONG/);
  now = 200_000;
  await lock.renewRecovery('111111', words);
  assert.equal(get().recovery, b64(recoveryKey(words)));
  const { vault } = await fixture(); await vault.add(draft(), false);
  const key = recoveryKey(words); await vault.checkBackup(vault.backup(key), key);
  assert.equal(backupNudge(vault.snapshot(), false), 'none');
  await vault.forgetBackup();
  assert.equal(backupNudge(vault.snapshot(), false), 'backup', 'after new words the app asks for a new backup');
});

test('10: tags keep their spaces, show up in search and the filter, and reach the PDF', async () => {
  assert.deepEqual(parseTags(' school pickup, late ,, school pickup '), ['school pickup', 'late']);
  const { vault } = await fixture();
  await vault.add(draft({ title: 'Handoff Friday', tags: ['school pickup'] }), true);
  await vault.add(draft({ title: 'Bank statement', note: 'March transfer', tags: [] }), true);
  const items = vault.snapshot().items as Item[];
  assert.deepEqual(searchItems(items, 'SCHOOL').map(i => i.title), ['Handoff Friday']);
  assert.deepEqual(searchItems(items, 'march transfer').map(i => i.title), ['Bank statement']);
  assert.deepEqual(searchItems(items, '', 'school pickup').map(i => i.title), ['Handoff Friday']);
  assert.deepEqual(searchItems(items, 'nothing like this'), []);
  assert.deepEqual(allTags(items), ['school pickup']);
  assert.ok(exportHtml(items, { title: 't', madeOn: '2026-11-14T00:00:00Z', lang: 'en' }).includes('school pickup'));
});

test('11: the custody parent has a folder name that fits and a line for her own messages', () => {
  const d = topics.topics.find(t => t.id === 'divorce-prep')!;
  assert.match(d.display_name!.en, /custody/i);
  assert.ok(d.checklist_items!.some(c => c.id === 'messages-sent'));
  for (const l of LANGS) assert.ok((d.checklist_items!.find(c => c.id === 'messages-sent')!.name as Record<string, string>)[l]?.trim(), l);
});

test('13: no backup warning before anything is saved; after sharing, the same spot asks to check it', async () => {
  assert.equal(backupNudge(empty(), false), 'none');
  const { vault } = await fixture(); await vault.add(draft(), false);
  assert.equal(backupNudge(vault.snapshot(), false), 'backup');
  assert.equal(backupNudge(vault.snapshot(), true), 'check');
  const key = random(32); await vault.checkBackup(vault.backup(key), key);
  assert.equal(backupNudge(vault.snapshot(), true), 'none');
});

test('15: each phone is told its own biometric word, and no line says Face ID on its own', () => {
  assert.equal(bioKind('ios', [2]), 'faceId'); assert.equal(bioKind('ios', [1]), 'touchId'); assert.equal(bioKind('ios', []), 'faceId');
  assert.equal(bioKind('android', [1]), 'fingerprint'); assert.equal(bioKind('android', [1, 2]), 'fingerprint'); assert.equal(bioKind('android', [2]), 'face');
  const bad: string[] = [];
  for (const [k, row] of Object.entries(strings)) if (k !== BIO_NAME.faceId) (row as readonly string[]).forEach((s, i) => { if (/Face ID/.test(s)) bad.push(`${k}.${LANGS[i]}`); });
  assert.deepEqual(bad, []);
  for (const l of LANGS) for (const k of ['biometrics', 'useBio', 'wrongGuesses', 'BIOMETRIC_FAILED'] as const) {
    const t = copy(l); assert.ok(t(k, { bio: t('bioFingerprint') }).includes(t('bioFingerprint')), `${l} ${k}`);
  }
});

test('17-19: setup counts all four steps, and backups are named by their day', () => {
  for (const l of LANGS) assert.match(copy(l)('step4'), /4/);
  assert.equal(backupName(new Date(2026, 10, 14, 23, 50)), 'KeepMyProof-backup-2026-11-14.kmp');
});
