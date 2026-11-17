import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import config from '../app.config';

// Build 4 went to App Review with no `icon` in app.config.ts, so it shipped Expo's blank white
// default (found 17 Nov 2026 in App Store Connect). Apple rejects placeholder icons, and the store
// needs 1024 x 1024 with no transparency.
test('the app has its own 1024px opaque icon', () => {
  assert.ok(config.icon, 'app.config.ts sets no icon');
  const png = readFileSync(new URL(`../${config.icon}`, import.meta.url));
  assert.equal(png.toString('latin1', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 1024); assert.equal(png.readUInt32BE(20), 1024);
  const colorType = png[25]; // 2 = RGB, 6 = RGBA
  assert.notEqual(colorType, 6, 'the icon has an alpha channel; App Store icons must be opaque');
  assert.notEqual(colorType, 4);
});
