// Take a photo straight into the vault (camera capture, 21 Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { b64, utf8 } from '../src/core/crypto';
import { fromAsset, takePhoto, type CameraApi, type PickerAsset, type ReadFile } from '../src/core/camera';
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
  assert.deepEqual({ ...got[0], assetId: 'library-id' }, imported);
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

test('the camera permission is asked only from the tap, with a plain reason; no microphone, no Photos write', () => {
  const files = readFileSync(new URL('../src/native/files.ts', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
  const config = readFileSync(new URL('../app.config.ts', import.meta.url), 'utf8');
  // One request, inside takePhoto; the app calls takePhoto only from the "Take a photo" button's handler.
  assert.equal(files.match(/requestCameraPermissionsAsync/g)?.length, 1);
  assert.equal(app.match(/files\.takePhoto\(/g)?.length, 1);
  assert.match(app, /btn\('takePhoto', doRun\(snap/);
  assert.doesNotMatch(app, /requestCameraPermissions|launchCameraAsync/);
  // A denial or a missing camera opens the photo library instead (the add carries on).
  assert.match(app, /got === 'denied' \|\| got === 'unavailable'\)[^\n]*return pick\(false\)/);
  assert.match(config, /cameraPermission: '[^']{20,}'/);
  assert.match(config, /microphonePermission: false/);
  assert.doesNotMatch(files, /saveToLibraryAsync|createAssetAsync/);
  // The web preview has the same call, so the preview never shows a broken button.
  assert.match(readFileSync(new URL('../src/native/files.web.ts', import.meta.url), 'utf8'), /export async function takePhoto\(/);
});
