// Translates verified facts into Chinese (divorce) and Korean (executor) for US readers, through
// OpenRouter ":free" models only ($0: a response with a non-zero usage.cost stops the run). Writes
// site/data/translations/<folder>/<subtopic>.<lang>.json, keyed by fact key, marked for a native reader.
// Every translation must keep exactly the numbers of the English claim and pass the banned-word gate,
// or that fact stays untranslated (and the page may not publish in that language: the gate decides).
//   OPENROUTER_API_KEY=… node scripts/translate-facts.mjs --folder divorce --lang zh
// Exit 2 = NAMED STOP [NO_FREE_MODEL] / [SECRET_MISSING_OPENROUTER_API_KEY] / [NOTHING_TRANSLATED].
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFactsFiles } from './verify-facts.mjs';
import { factKey, bannedWord, factProblems, untranslated } from '../site/lib/gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = (process.env.KMP_FREE_MODELS || 'google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3.5-lightning:free').split(',');
const LANG = { zh: 'Simplified Chinese (zh-Hans) for Chinese speakers living in the United States', ko: 'Korean for Korean speakers living in the United States' };
const nums = (s) => (String(s).match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/,/g, '')).sort().join('|');

async function ask(messages) {
  const dead = new Set();
  for (let round = 0; round < 3; round++) for (const model of MODELS) {
    if (dead.has(model)) continue;
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(90000),
        headers: { authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.2, reasoning: { enabled: false }, usage: { include: true } }) });
      if (r.status === 404 || r.status === 403 || r.status === 400) { dead.add(model); continue; }
      if (!r.ok) continue;
      const j = await r.json();
      if (Number(j.usage?.cost || 0) > 0) throw Error(`NAMED STOP [PAID_MODEL] ${model} reported cost ${j.usage.cost}`);
      const text = j.choices?.[0]?.message?.content || '';
      const m = /\{[\s\S]*\}/.exec(text);
      if (m) return { model, out: JSON.parse(m[0]) };
    } catch (e) { if (/PAID_MODEL/.test(e.message)) throw e; }
  }
  return null;
}

async function main() {
  const a = process.argv.slice(2), folder = a[a.indexOf('--folder') + 1], lang = a[a.indexOf('--lang') + 1];
  if (!LANG[lang] || !folder) { console.error('usage: --folder <folder> --lang zh|ko'); process.exit(1); }
  if (!process.env.OPENROUTER_API_KEY) { console.error('NAMED STOP [SECRET_MISSING_OPENROUTER_API_KEY]'); process.exit(2); }
  const verified = JSON.parse(readFileSync(join(ROOT, 'site', 'data', 'verified', `${folder}.json`), 'utf8')).facts;
  const outDir = join(ROOT, 'site', 'data', 'translations', folder); mkdirSync(outDir, { recursive: true });
  let total = 0;
  for (const { data } of readFactsFiles([folder])) {
    const file = join(outDir, `${data.subtopic}.${lang}.json`);
    const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { facts: {} };
    const todo = new Map(), clean = (t) => t && !untranslated(t);
    for (const e of Object.values(data.states || {})) for (const f of e.facts || []) { const k = factKey(f); if (verified[k] && !factProblems(f).length && !clean(prev.facts[k])) todo.set(k, f.claim_en); }
    const facts = Object.fromEntries(Object.entries(prev.facts).filter(([, t]) => !untranslated(t))), models = new Set(prev.models || []);
    let title = prev.title;
    const sys = { role: 'system', content: `You translate short factual sentences from US government sources into natural ${LANG[lang]}. Translate every ordinary word: no English word may remain except official names. Keep every number, dollar amount, date, form number and official agency or court name exactly as written (you may add a short ${lang === 'zh' ? 'Chinese' : 'Korean'} gloss in parentheses after an English proper name). Keep the meaning exact: add nothing, give no advice, never use words meaning "best", "proves", "admissible", "court-ready" or "win your case". Return only JSON.` };
    if (!title || untranslated(title)) {
      title = null;
      const r = await ask([sys, { role: 'user', content: `Translate this page title template. Keep the placeholder {state} exactly once. Frame it for US residents. Return {"title":"..."}.\n${data.title_en}` }]);
      if (r?.out?.title && /\{state\}/.test(r.out.title) && !bannedWord(r.out.title)) { title = r.out.title; models.add(r.model); }
    }
    const items = [...todo.entries()];
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      const r = await ask([sys, { role: 'user', content: `Translate each value. Return {"t":{"<id>":"<translation>",...}} with the same ids.\n${JSON.stringify(Object.fromEntries(batch))}` }]);
      if (!r) { console.log(`NAMED STOP [NO_FREE_MODEL] ${folder}/${data.subtopic}: batch ${i / 25 + 1} untranslated; re-run later`); continue; }
      models.add(r.model);
      for (const [k, en] of batch) { const t = r.out?.t?.[k]; if (typeof t === 'string' && t.trim() && nums(t) === nums(en) && !bannedWord(t) && !untranslated(t)) facts[k] = t.trim(); }
    }
    total += Object.keys(facts).length - Object.keys(prev.facts).length;
    writeFileSync(file, JSON.stringify({ schema: 'kmp-translation-v1', folder, subtopic: data.subtopic, lang, review: 'pending native reader before the app launches', translated_on: new Date().toISOString().slice(0, 10), models: [...models], title, facts }, null, 1) + '\n');
    console.log(`${folder}/${data.subtopic} ${lang}: ${Object.keys(facts).length} facts translated (${todo.size} new asked), title ${title ? 'ok' : 'MISSING'}`);
  }
  if (!total && !process.argv.includes('--allow-none')) { console.error('NAMED STOP [NOTHING_TRANSLATED]'); process.exit(2); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
