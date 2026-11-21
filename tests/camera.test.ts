// Take a photo straight into the vault (camera capture, 21 Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { b64, utf8 } from '../src/core/crypto';
import { cameraStep, fromAsset, photoTitle, takePhoto, type CameraApi, type Picked, type PickerAsset, type ReadFile } from '../src/core/camera';
import { copy } from '../src/strings';
import { LANGS } from '../src/core/model';
import { appFolders } from '../src/core/model';
import { fixture } from './helpers';

const asset: PickerAsset = { uri: 'file:///cache/ImagePicker/fictional.jpg', fileName: 'fictional.jpg', mimeType: 'image/jpeg', fileSize: 1200,
  assetId: 'library-id', exif: { DateTimeOriginal: '2026:11:21 09:41:07' } };
function fakes(opts: { granted?: boolean; requestThrows?: boolean; launchThrows?: boolean; canceled?: boolean } = {}) {
  const calls = { request: 0, launch: 0, read: [] as string[] };
  const api: CameraApi = {
    request: async () => { calls.request++; if (opts.requestThrows) throw Error('NO_CAMERA_MODULE'); return { granted: opts.granted ?? true }; },
    launch: async () => { calls.launch++; if (opts.launchThrows) throw Error('CAMERA_UNAVAILABLE'); return opts.canceled ? { canceled: true, assets: null } : { canceled: false, assets: [asset] }; },
  };
  const read: ReadFile = async (uri, filename, mime) => { calls.read.push(uri); return { filename, mime, bytes: b64(utf8('invented photo')) }; };
  return { api, read, calls };
}

test('a camera denial or a missing camera returns a plain answer, never throws, and never opens the camera', async () => {
  const denied = fakes({ granted: false });
  assert.equal(await takePhoto(denied.api, denied.read), 'denied');
  assert.equal(denied.calls.launch, 0); assert.deepEqual(denied.calls.read, []);
  const noModule = fakes({ requestThrows: true });
  assert.equal(await takePhoto(noModule.api, noModule.read), 'unavailable');
  const broken = fakes({ launchThrows: true });
  assert.equal(await takePhoto(broken.api, broken.read), 'unavailable');
  const cancelled = fakes({ canceled: true });
  assert.equal(await takePhoto(cancelled.api, cancelled.read), null);
  assert.deepEqual(cancelled.calls.read, []);
});

test('a camera photo records its dates exactly as an imported photo does, and is saved like one', async () => {
  const cam = fakes(), got = await takePhoto(cam.api, cam.read);
  assert.ok(Array.isArray(got) && got.length === 1);
  const imported = await fromAsset(asset, cam.read);
  // Same file, same "taken" time from the photo's own EXIF; only the library id differs (it was never in Photos).
  assert.deepEqual({ ...got[0], assetId: 'library-id', camera: undefined }, { ...imported, camera: undefined });
  assert.equal(got[0].takenOn, '2026-11-21T09:41'); assert.equal(got[0].assetId, null);
  assert.equal(cam.calls.request, 1);
  // Saved through the same vault path in any folder: "saved" is stamped by the vault, takenOn is kept.
  const { vault } = await fixture();
  for (const folder of appFolders.map(f => f.id)) {
    const [id] = await vault.addMany([{ folder, checklist: null, kind: 'photo', title: 'Kitchen', note: '', happenedOn: null, tags: [],
      filename: got[0].filename, mime: got[0].mime, bytes: got[0].bytes, takenOn: got[0].takenOn }], true);
    const item = vault.snapshot().items.find(i => i.id === id)!;
    assert.equal(item.folder, folder); assert.equal(item.takenOn, '2026-11-21T09:41');
    assert.ok(Number.isFinite(Date.parse(item.savedOn)), folder); assert.ok(item.sha256);
  }
});

test('the Add screen: a denial or no camera says why and opens the library; a cancel does nothing; a photo is kept', async () => {
  assert.deepEqual(cameraStep(await takePhoto(fakes({ granted: false }).api, fakes().read)), { fallback: 'cameraOff' });
  assert.deepEqual(cameraStep(await takePhoto(fakes({ launchThrows: true }).api, fakes().read)), { fallback: 'cameraNone' });
  assert.equal(cameraStep(await takePhoto(fakes({ canceled: true }).api, fakes().read)), null);
  const kept = cameraStep(await takePhoto(fakes().api, fakes().read));
  assert.ok(kept && 'picked' in kept && kept.picked[0].camera === true);
  // Both fallback lines exist in every language, so the notice is never blank.
  for (const l of LANGS) for (const k of ['cameraOff', 'cameraNone', 'photoCamera'] as const) assert.ok(copy(l)(k).trim(), `${k} ${l}`);
});

test('a camera photo is titled from its taken time with the same helper as a multi-photo import, never its file name', async () => {
  const cam = await takePhoto(fakes().api, fakes().read) as Picked[];
  const label = (date: string) => copy('en')('photoTaken', { date });
  assert.equal(photoTitle(cam[0], label, 'en-US'), photoTitle({ filename: 'x.jpg', takenOn: '2026-11-21T09:41' }, label, 'en-US'));
  assert.match(photoTitle(cam[0], label, 'en-US'), /^Photo 11\/21\/2026 9:41\s?AM$/);
  assert.notEqual(photoTitle(cam[0], label, 'en-US'), cam[0].filename);
  // A camera that writes no EXIF time: the moment of the shot is the taken time.
  const noExif: CameraApi = { request: async () => ({ granted: true }), launch: async () => ({ canceled: false, assets: [{ ...asset, exif: null }] }) };
  const [p] = await takePhoto(noExif, fakes().read, () => new Date(2026, 10, 21, 18, 1)) as Picked[];
  assert.equal(p.takenOn, '2026-11-21T18:01');
  assert.match(photoTitle(p, label, 'en-US'), /^Photo 11\/21\/2026 6:01\s?PM$/);
  // An imported photo with no EXIF keeps its file name, as before.
  assert.equal(photoTitle({ filename: 'scan.jpg', takenOn: null }, label, 'en-US'), 'scan.jpg');
});

test('the camera permission has a plain reason, and no microphone is asked for', async () => {
  const plugins = (await import('../app.config')).default.plugins as unknown[];
  const picker = plugins.find(p => Array.isArray(p) && p[0] === 'expo-image-picker') as [string, Record<string, unknown>];
  assert.ok(typeof picker[1].cameraPermission === 'string' && (picker[1].cameraPermission as string).length > 20);
  assert.match(picker[1].cameraPermission as string, /not saved to Photos/);
  assert.equal(picker[1].microphonePermission, false);
});
