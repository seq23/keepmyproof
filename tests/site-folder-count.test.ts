// Site copy counts the app's folders from topics.json, never by hand (review of #65, 21 Nov 2026: the site
// still said "All five folders" above seven folder boxes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';
import { folderCount, folderNames } from '../site/lib/folders.mjs';
import { htmlText } from '../site/lib/gate.mjs';
import topics from '../topics.json';

const N = topics.launch_folder_count;
const EN = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const ES = ['dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
const ZH = ['两', '三', '四', '五', '六', '七', '八', '九', '十'];
const KO = ['두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

test('every page that counts the app folders says the topics.json count, and the home page shows that many', () => {
  const { files } = renderAll();
  const wrong: string[] = [];
  let counted = 0;
  const check = (file: string, text: string, re: RegExp, words: string[], lang: 'en' | 'es' | 'zh' | 'ko') => {
    for (const m of text.matchAll(re)) {
      const w = m[1].toLowerCase(); if (!words.includes(w) && !/^\d+$/.test(w)) continue;
      counted++; if (w !== folderCount(lang) && w !== String(N)) wrong.push(`${file}: "${m[0]}"`);
    }
  };
  for (const [file, body] of Object.entries(files)) {
    if (!/\.(html|txt)$/.test(file) || typeof body !== 'string') continue;
    const text = file.endsWith('.html') ? htmlText(body) : body;
    check(file, text, /\b(\w+) (?:app )?folders\b/gi, EN, 'en');
    check(file, text, /\b(\w+) carpetas\b/gi, ES, 'es');
    check(file, text, /([两三四五六七八九十]|\d+)\s*个(?:带建议清单的)?文件夹/g, ZH, 'zh');
    check(file, text, /(\S+) 개 폴더/g, KO, 'ko');
  }
  assert.deepEqual(wrong, []);
  assert.ok(counted >= 8, `only ${counted} folder counts found: the check is reading nothing`);
  // The home page has one box per launch folder, under the derived heading.
  const home = files['index.html'] as string;
  assert.match(htmlText(home), new RegExp(`${folderCount('en', true)} folders, each with a suggested checklist`));
  for (const t of topics.topics.filter(t => t.release === 'launch')) assert.ok(home.includes(t.display_name!.en.replace(/&/g, '&amp;')), t.id);
  // Lists of folders name every launch folder.
  for (const t of topics.topics.filter(t => t.release === 'launch')) assert.ok(folderNames('en').includes(t.name.en), t.id);
  assert.match(files['llms.txt'] as string, new RegExp(`in ${folderCount('en')} folders`));
});
