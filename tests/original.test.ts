import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_REMOVE_PREF, readRemovePref, removeOriginal, shouldOffer, vaultLines, type RemovePref } from '../src/core/original';
import { copy, strings } from '../src/strings';
import { LANGS } from '../src/core/model';
import { utf8, b64 } from '../src/core/crypto';
import { draft, fixture } from './helpers';

const base = { pref: 'ask' as RemovePref, kind: 'photo', assetId: 'ABC-123/L0/001', editing: false, systemConfirm: true };

test('the offer appears only for a new photo with a library id, when the setting asks and the phone confirms itself', () => {
  assert.equal(DEFAULT_REMOVE_PREF, 'ask');
  assert.equal(shouldOffer(base), true);
  assert.equal(shouldOffer({ ...base, pref: 'never' }), false, 'setting off: never asked');
  assert.equal(shouldOffer({ ...base, kind: 'file' }), false);
  assert.equal(shouldOffer({ ...base, kind: 'note' }), false);
  assert.equal(shouldOffer({ ...base, assetId: null }), false, 'no library id: nothing to remove');
  assert.equal(shouldOffer({ ...base, assetId: '' }), false);
  assert.equal(shouldOffer({ ...base, editing: true }), false, 'editing an item never offers');
  assert.equal(shouldOffer({ ...base, systemConfirm: false }), false, 'no system confirmation dialog: never offered');
});

test('the setting reads back what was saved; anything unreadable falls back to asking (which removes nothing)', async () => {
  let stored: string | null = null;
  const store = { read: async () => stored, write: async (v: RemovePref) => { stored = v; } };
  assert.equal(await readRemovePref(store), 'ask');
  await store.write('never'); assert.equal(await readRemovePref(store), 'never');
  stored = 'garbage'; assert.equal(await readRemovePref(store), 'ask');
  assert.equal(await readRemovePref({ read: async () => { throw Error('keychain'); }, write: async () => {} }), 'ask');
});

test('removal runs the system delete once, only after the vault holds the copy; any refusal keeps the original', async () => {
  const { vault } = await fixture();
  const id = await vault.add(draft({ kind: 'photo', filename: 'fictional.jpg', mime: 'image/jpeg', bytes: b64(utf8('invented photo bytes')) }), false);
  const before = JSON.stringify(vault.snapshot());
  const saved = () => vault.snapshot().items.find(i => i.id === id);
  const calls: string[] = [];
  const accept = async (a: string) => { calls.push(a); };
  const decline = async (a: string) => { calls.push(a); throw Error('user declined the system dialog'); };

  assert.equal(await removeOriginal('ABC-123', saved(), accept), 'removed');
  assert.deepEqual(calls, ['ABC-123']);
  calls.length = 0;
  assert.equal(await removeOriginal('ABC-123', saved(), decline), 'kept', 'declined system dialog keeps it');
  assert.deepEqual(calls, ['ABC-123']);
  calls.length = 0;
  // Not saved in the vault (missing, or a note without bytes): the photo is never touched.
  assert.equal(await removeOriginal('ABC-123', undefined, accept), 'kept');
  assert.equal(await removeOriginal('ABC-123', { bytes: null }, accept), 'kept');
  assert.deepEqual(calls, []);
  // Neither outcome changes anything in the vault.
  assert.equal(JSON.stringify(vault.snapshot()), before);
});

test('the app offers only after the save, keeps the library id out of the vault, and Keep is the default button', () => {
  const app = readFileSync('app/index.tsx', 'utf8');
  const save = app.slice(app.indexOf('async function saveDraft'), app.indexOf('async function share'));
  assert.ok(save.indexOf('await vault.add') > -1 && save.indexOf('await vault.add') < save.indexOf('setOffer('), 'offer is set after the vault save');
  assert.match(app, /const \{ assetId, \.\.\.file \} = picked/, 'assetId is split off before the draft');
  const card = app.slice(app.indexOf("t('removeAsk')"), app.indexOf("t('removeAsk')") + 700);
  assert.ok(card.indexOf("'keepInPhotos'") < card.indexOf("'removeFromPhotos'"), 'Keep comes first');
  assert.match(card, /btn\('keepInPhotos', \(\) => \{ setOffer\(null\);[^}]*\}\)\}/, 'Keep only closes the offer');
  assert.match(card, /'removeFromPhotos'[\s\S]*?, true\)/, 'Remove is the quiet button');
});

test('only a phone that can remove the original is told it can; Android is told to delete it in Google Photos', () => {
  const ios = vaultLines(true), android = vaultLines(false);
  for (const l of LANGS) {
    const t = copy(l);
    assert.notEqual(t(ios.photo), t(android.photo), l);
    assert.notEqual(t(ios.lock), t(android.lock), l);
  }
  const en = copy('en');
  assert.match(en(ios.photo), /remove the original from Photos/);
  assert.match(en(ios.lock), /Face ID/);
  assert.doesNotMatch(en(android.photo), /remove the original/i);
  assert.match(en(android.photo), /stays in your Photos or Gallery app/);
  assert.doesNotMatch(en(android.lock), /Face ID/);
  // Android never gets the offer itself, whatever the setting.
  assert.equal(shouldOffer({ ...base, systemConfirm: false }), false);
});

test('no app text, in any language, promises a hidden app, unrecoverable deletion or a court result', () => {
  const claims = [/hid(e|es|den) (the|this) app/i, /invisible|undetectable|untraceable|forensic/i, /court[- ]ready|admissible|guarantee/i,
    /oculta la app|indetectable|forense|garantiza|admisible/i, /隐藏应用|无法恢复|法庭认可|保证/, /앱(을|이) 숨|복구할 수 없|법원에서 인정|보장/];
  const bad: string[] = [];
  for (const [k, row] of Object.entries(strings)) for (const s of row as readonly string[]) for (const c of claims) if (c.test(s)) bad.push(`${k}: ${s}`);
  assert.ok(Object.keys(strings).length > 100);
  assert.deepEqual(bad, []);
});
