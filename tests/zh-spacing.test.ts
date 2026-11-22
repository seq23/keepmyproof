// Chinese pages never carry a space between two Chinese characters: the seam the model translations
// left in every state title ("弗吉尼亚州 的子女抚养费如何运作"), fixed where translations are read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAll } from '../site/build.mjs';

const SEAM = /[\p{Script=Han}，。：；、）]\s+[\p{Script=Han}（]/u;
// Inline tags join the text around them (a space before a link is still a seam); block tags split it.
const text = (s: string) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<\/?(?:a|span|strong|em|b|i|abbr|time)\b[^>]*>/g, '').replace(/<[^>]+>/g, '\n');

test('no Chinese page title, heading, answer or fact has a space between two Chinese characters', () => {
  const { files, pages } = renderAll();
  const zh = pages.filter((p: any) => /^\/zh\//.test(p.path));
  const states = zh.filter((p: any) => p.state);
  assert.ok(states.length > 100, `only ${states.length} Chinese state pages read`);
  for (const p of zh) {
    const s = files[p.file];
    const parts = [/<title>(.*?)<\/title>/.exec(s)?.[1], /<h1>(.*?)<\/h1>/.exec(s)?.[1], /<meta name="description" content="([^"]*)"/.exec(s)?.[1], ...text(/<main[\s\S]*?<\/main>/.exec(s)?.[0] ?? '').split('\n')];
    for (const t of parts) if (t) assert.ok(!SEAM.test(t), `${p.path}: "${t.trim().slice(0, 60)}"`);
  }
});
