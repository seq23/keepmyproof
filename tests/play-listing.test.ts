import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import config from '../app.config';
import play from '../store/google-play.json';

// Google Play readiness (19 Nov 2026): Android crops a plain square icon badly, so the app ships an
// adaptive icon; the Play listing repeats the approved App Store listing and adds no new claim.
const png = (p: string) => { const b = readFileSync(new URL(`../${p}`, import.meta.url)); assert.equal(b.toString('latin1', 1, 4), 'PNG', p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), alpha: b[25] === 6 || b[25] === 4 }; };

test('Android has an adaptive icon: a transparent 1024px foreground on the brand green', () => {
  const icon = config.android?.adaptiveIcon;
  assert.ok(icon?.foregroundImage, 'app.config.ts android.adaptiveIcon.foregroundImage');
  assert.equal(icon.backgroundColor, '#0B6E4F');
  assert.deepEqual(png(icon.foregroundImage.replace('./', '')), { w: 1024, h: 1024, alpha: true });
});

test('Play store art has the sizes Play requires and no transparency', () => {
  const want: [string, number, number][] = [['store/play/icon-512.png', 512, 512], ['store/play/feature-graphic.png', 1024, 500],
    ['store/play/phone-01.png', 1080, 1920], ['store/play/phone-02.png', 1080, 1920], ['store/play/phone-03.png', 1080, 1920]];
  for (const [p, w, h] of want) assert.deepEqual(png(p), { w, h, alpha: false }, p);
});

test('the Play listing fits Play limits and its description is the approved store listing, word for word', () => {
  const langs = Object.keys(play.listings);
  assert.deepEqual(langs.sort(), ['en', 'es', 'ko', 'zh']);
  for (const [lang, l] of Object.entries(play.listings)) {
    assert.ok([...l.title].length <= 30, `${lang} title`); assert.ok([...l.short].length <= 80, `${lang} short`); assert.ok([...l.full].length <= 4000, `${lang} full`);
    const md = readFileSync(new URL(`../store/${lang}.md`, import.meta.url), 'utf8').split(/^## /m)[0].replace(/^# .*\n/, '');
    const flat = (s: string) => s.replace(/\s+/g, '');
    assert.ok(flat(l.full).startsWith(flat(md)), `${lang}: the full description must start with the store/${lang}.md listing`);
    assert.doesNotMatch(l.full, /Apple|iPhone|App Store|Face ID/, `${lang}: no iPhone wording in the Play listing`);
  }
});
