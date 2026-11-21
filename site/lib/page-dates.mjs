// Each page's real first-publish and last-change dates (review of #66, 21 Nov 2026: new pages said
// "Published November 6, 2026" from a hard-coded constant). Pages are rendered with date tokens; this
// fills them from site/data/page-dates.json, the ledger of { published, modified, hash } per file.
// A file the ledger has never seen is published today (the build day is the day it goes live); a file
// whose main content changed is modified today. `node site/build.mjs` writes the ledger back, and the
// page-dates workflow commits it after each push to main, so a date never moves on a later build.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const PUB = '⟦pub⟧', MOD = '⟦mod⟧';
export const pubOn = (lang) => `⟦pub|${lang}⟧`, modOn = (lang) => `⟦mod|${lang}⟧`;
export const LEDGER = new URL('../data/page-dates.json', import.meta.url);

/** Today in Central time (the business's day), as YYYY-MM-DD. */
export const todayCentral = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
/** What counts as a change: the page's own content, not the shared header, footer or styles. */
export const contentHash = (html) => createHash('sha256').update((/<main>([\s\S]*)<\/main>/.exec(html) || [, html])[1]).digest('hex').slice(0, 16);
export const readLedger = (file = LEDGER) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).pages : {});

/**
 * Fill every date token. Returns the next ledger (only files still built) and whether it changed.
 * format(lang, iso) renders a date for readers.
 */
export function stampDates(files, { ledger = readLedger(), today = todayCentral(), format }) {
  const next = {};
  let changed = false;
  for (const [file, html] of Object.entries(files)) {
    if (typeof html !== 'string' || !html.includes('⟦')) continue;
    const hash = contentHash(html), was = ledger[file];
    const row = !was ? { published: today, modified: today, hash } : was.hash === hash ? was : { ...was, modified: today, hash };
    if (row !== was) changed = true;
    next[file] = row;
    files[file] = html.replaceAll(PUB, row.published).replaceAll(MOD, row.modified)
      .replace(/⟦(pub|mod)\|(\w+)⟧/g, (_, k, l) => format(l, k === 'pub' ? row.published : row.modified));
  }
  if (Object.keys(ledger).some((f) => !next[f])) changed = true;
  return { ledger: next, changed };
}
export const writeLedger = (pages, file = LEDGER) => writeFileSync(file, JSON.stringify({ about: 'Written by node site/build.mjs (site/lib/page-dates.mjs). published = first day the file was built; modified = last day its main content changed.', pages: Object.fromEntries(Object.entries(pages).sort()) }, null, 0).replace(/\},"/g, '},\n"') + '\n');
