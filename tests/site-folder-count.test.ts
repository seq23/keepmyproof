// Site copy counts the app's folders from code, never by hand (review of #65, 21 Nov 2026: the site
// still said "All five folders" above seven folder boxes). Two true counts: the folders with a suggested
// checklist (topics.json) and every folder on Home, which adds Private (review of #76, 24 Nov 2026: the
// site said "All seven folders" free while the app's Home shows eight).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';
import { APP_FOLDER_COUNT, appFolderCount, folderCount, folderNames, privateName } from '../site/lib/folders.mjs';
import { LANGS, PRIVATE_FOLDER, appFolders } from '../src/core/model';
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
      counted++;
      const ok = [folderCount(lang), appFolderCount(lang), String(N), String(APP_FOLDER_COUNT)];
      if (!ok.includes(w)) wrong.push(`${file}: "${m[0]}"`);
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

test('lines about every folder on Home say the app\'s own count (checklist folders + Private), and lists name Private', () => {
  // The site's two counts are the app's: the checklist folders, and every folder Home shows.
  assert.equal(N, appFolders.length - 1);
  assert.equal(APP_FOLDER_COUNT, appFolders.length);
  for (const l of LANGS) assert.equal(privateName(l), PRIVATE_FOLDER.display_name[l], l);
  const { files } = renderAll();
  const text = (f: string) => { const b = files[f]; assert.equal(typeof b, 'string', `${f} not rendered`); return htmlText(b as string); };
  // Free covers every folder on Home, Private included.
  assert.match(text('index.html'), new RegExp(`All ${appFolderCount('en')} folders, up to \\d+ items`));
  assert.match(text('es/index.html'), new RegExp(`Las ${appFolderCount('es')} carpetas, hasta \\d+ documentos`));
  // Adding an item: any folder on Home.
  assert.match(text('vault.html'), new RegExp(`to one of the ${appFolderCount('en')} folders, or to your own`));
  assert.match(text('es/boveda.html'), new RegExp(`a una de las ${appFolderCount('es')} carpetas, o a una suya`));
  assert.match(text('zh/vault.html'), new RegExp(`加入${appFolderCount('zh')}个文件夹之一`));
  assert.match(text('ko/vault.html'), new RegExp(`${appFolderCount('ko')} 개 폴더 중 하나나`));
  // The facts page's folder list is the app's Home list.
  for (const [f, l] of [['facts.html', 'en'], ['es/datos.html', 'es']] as const) {
    const html = files[f] as string;
    for (const t of topics.topics.filter(t => t.release === 'launch')) assert.ok(html.includes(`<li>${t.name[l as 'en' | 'es']!.replace(/&/g, '&amp;')}</li>`), `${f}: ${t.id}`);
    assert.ok(html.includes(`<li>${privateName(l)}</li>`), `${f} lists no ${privateName(l)} folder`);
  }
});
