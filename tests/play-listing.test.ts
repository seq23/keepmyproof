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

// Google Play's photo and video permission policy: an app that only picks photos uses the system picker
// and must not declare photo-library access. Found in the first Android build's manifest (19 Nov 2026).
test('the Android build blocks photo-library, storage and draw-over-apps permissions', () => {
  const blocked = config.android?.blockedPermissions ?? [];
  for (const p of ['READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_MEDIA_VISUAL_USER_SELECTED', 'READ_MEDIA_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'SYSTEM_ALERT_WINDOW'])
    assert.ok(blocked.includes(`android.permission.${p}`), p);
});

// Chinese and Korean App Store fields (21 Nov 2026): written around what people search in those languages,
// ready to paste at the next submission. Apple refuses a field over its limit, and the name and subtitle
// are the strongest search fields, so each must be present, in limit, and in its own language.
test('the Chinese and Korean App Store fields are filled, in Apple limits, in the listing language', () => {
  const limits: Record<string, number> = { Name: 30, Subtitle: 30, Keywords: 100, 'Promotional text': 170 };
  const script: Record<string, RegExp> = { zh: /\p{Script=Han}/u, ko: /\p{Script=Hangul}/u };
  for (const lang of ['zh', 'ko']) {
    const md = readFileSync(new URL(`../store/${lang}.md`, import.meta.url), 'utf8');
    for (const [field, max] of Object.entries(limits)) {
      const m = new RegExp(`[(（]${field}[,，][^)）]*[)）][:：]\\s*(.+)`).exec(md);
      assert.ok(m, `${lang}: ${field} missing`);
      const v = m[1].trim();
      assert.ok([...v].length <= max, `${lang} ${field}: ${[...v].length} > ${max}`);
      assert.match(v, script[lang], `${lang} ${field} is not in the listing language`);
      if (field === 'Keywords') assert.ok(v.split(',').length >= 8 && !/[，、\s]/.test(v), `${lang}: keywords are comma-separated with no spaces`);
    }
    // Apple already indexes the name and subtitle: a keyword repeating them wastes the 100 characters.
    const field = (f: string) => new RegExp(`[(（]${f}[,，][^)）]*[)）][:：]\\s*(.+)`).exec(md)![1];
    const indexed = field('Name') + field('Subtitle');
    for (const k of field('Keywords').split(',')) assert.ok(!indexed.includes(k), `${lang}: keyword ${k} repeats the name or subtitle`);
  }
});
