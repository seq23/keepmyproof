// THE DEVICE GATE's checks (docs/device-gate.md): the 11 Simulator checks of scripts/release-gate.mjs SIMULATOR_CHECKS,
// plus the store-build smoke check. Each check starts from a clean app state of its own (the app deleted, the
// Simulator's Keychain emptied, the build installed again, a known vault put in place) and never leans on another.
// A check throws AppFail when the app did the wrong thing and TestError when the harness or the Simulator could not do
// its part; it returns its evidence when the app did the right thing.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { copy } from '../../src/strings';
import { phrase } from '../../src/core/crypto';
import { AppFail, run, TestError, type Sim } from './sim';
import { byId, center, type El, type Ui } from './ui';
import { againstManifest, bigger, compare, CORRUPTIONS, corrupt, readBackup } from './backup-tool';
import { inventedFiles, sha256, type Manifest } from './vault-fixture';

const t = copy('en');
/** A backup the app made, opened with the 12 words; one that will not open is the app's failure. */
function opened(text: string, words: string): ReturnType<typeof readBackup> {
  try { return readBackup(text, words); } catch (e) { throw new AppFail(`a backup the app made does not open with its 12 words as a valid backup (${(e as Error).message})`); }
}
export interface Fixture { dir: string; m: Manifest }
export interface Ctx { sim: Sim; ui: Ui; gateApp: string; storeApp: string; work: string; cur: Fixture; old: Fixture; log: (s: string) => void; ocr: string }

const wait = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** Polls a file-system condition (the seam's files), every 0.5 s. */
function until<T>(pick: () => T | undefined | false | null, ms: number, what: string): T {
  const end = Date.now() + ms;
  for (;;) { const v = pick(); if (v) return v; if (Date.now() > end) throw new TestError(`waited ${Math.round(ms / 1000)} s for ${what}`); wait(500); }
}

// ── the app's screens, by test id ──────────────────────────────────────────────────────────────────────────────────
/** The count Home shows, read from its own line (src/strings.ts homeIntro / plusCount). */
export function parseCount(text: string): number | null {
  for (const key of ['homeIntro', 'plusCount'] as const) {
    const [a, b] = t(key, { n: '\u0000' }).split('\u0000') as [string, string];
    if (text.startsWith(a) && text.endsWith(b)) { const n = text.slice(a.length, text.length - b.length); if (/^\d+$/.test(n)) return Number(n); }
  }
  return null;
}
const vaultOpen = (els: El[]) => !!byId(els, 'kmp-tabs') || ['folder', 'add', 'detail'].includes(els.find(e => e.id.startsWith('kmp-screen-'))?.id.slice(11) ?? '');
const onScreen = (els: El[], s: string) => els.some(e => e.id === `kmp-screen-${s}`);

export function seed(c: Ctx, fx: Fixture) {
  const data = c.sim.container();
  cpSync(join(fx.dir, 'vault'), join(data, 'Documents', 'vault'), { recursive: true });
  writeFileSync(join(c.sim.gateDir(), 'keychain.json'), readFileSync(join(fx.dir, 'keychain.json')));
}
function launch(c: Ctx, expect: 'lock' | 'first') {
  c.sim.terminate(); c.sim.launch();
  c.ui.waitFor(els => onScreen(els, expect), 90_000, `the ${expect} screen after launch`);
}
/** Unlocks with a passcode: 'open', or the refusal the app showed. */
function unlock(c: Ctx, code: string): string {
  c.ui.type('kmp-passcode', code, true);
  c.ui.tap('kmp-unlock');
  const r = c.ui.waitFor(els => vaultOpen(els) ? 'open' : byId(els, 'kmp-error')?.text, 90_000, 'the vault to open or a refusal');
  return r!;
}
function mustUnlock(c: Ctx, code: string) { const r = unlock(c, code); if (r !== 'open') throw new AppFail(`passcode ${code} did not open the vault: "${r}"`); }
/** Goes to a tab screen (home, backup, settings): Back from a screen without tabs, then the tab. */
function goTab(c: Ctx, tab: 'home' | 'backup' | 'settings') {
  for (let k = 0; k < 5; k++) {
    const els = c.ui.tree();
    if (onScreen(els, tab)) return;
    if (byId(els, 'kmp-tabs')) c.ui.tap(`kmp-tab-${tab}`); else if (byId(els, 'kmp-back')) c.ui.tap('kmp-back');
    else throw new TestError(`no tab bar and no Back on screen ${els.find(e => e.id.startsWith('kmp-screen-'))?.id ?? '(none)'}`);
    c.ui.waitFor(e2 => onScreen(e2, tab) || !onScreen(e2, els.find(e => e.id.startsWith('kmp-screen-'))?.id.slice(11) ?? ''), 15_000, 'the screen to change', false);
  }
  throw new TestError(`could not reach the ${tab} tab`);
}
function count(c: Ctx): number {
  goTab(c, 'home');
  const text = c.ui.waitFor(els => onScreen(els, 'home') && byId(els, 'kmp-count')?.text, 20_000, 'Home and its count')!;
  const n = parseCount(text);
  if (n === null) throw new TestError(`Home's count line is not one the app writes: "${text}"`);
  return n;
}
function expectCount(c: Ctx, n: number, when: string) { const got = count(c); if (got !== n) throw new AppFail(`${when}: Home counts ${got} items, not ${n}`); }

/** Backup › Back up now. The gate build hands the file to outbox/ instead of the share sheet; returns its text. */
function backupNow(c: Ctx): string {
  const out = c.sim.gateDir('outbox'); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  goTab(c, 'backup');
  c.ui.tap('kmp-backUp');
  const f = until(() => readdirSync(out).find(n => n.endsWith('.kmp') && statSync(join(out, n)).size > 0), 90_000, 'the backup file');
  wait(1000);
  c.ui.waitFor(els => !byId(els, 'kmp-busy'), 60_000, 'the backup to finish');
  const err = byId(c.ui.tree(), 'kmp-error'); if (err) throw new AppFail(`Back up now showed: "${err.text}"`);
  return readFileSync(join(out, f), 'utf8');
}
/** "Choose a file" in the gate build: the seam returns this text (src/gate.ts pick). */
function offer(c: Ctx, name: string, text: string) {
  writeFileSync(join(c.sim.gateDir('inbox'), name), text);
  writeFileSync(join(c.sim.gateDir(), 'pick'), name);
}

type Restored = { outcome: 'restored' } | { outcome: 'refused'; text: string } | { outcome: 'cut' };
/** Restore a backup from the first screen of a new install (fresh, with a new passcode) or from Backup. With `arm`, the
 *  app is stopped at its n-th vault write (src/gate.ts at) and 'cut' is returned once it is there. */
function restore(c: Ctx, o: { text: string; words: string; newCode?: string; arm?: number }): Restored {
  if (o.newCode) { c.ui.waitFor(els => onScreen(els, 'first'), 30_000, 'the first screen'); c.ui.tap('kmp-restore'); }
  else { goTab(c, 'backup'); c.ui.tap('kmp-restore'); }
  c.ui.waitFor(els => onScreen(els, 'restore'), 20_000, 'the Restore screen');
  c.ui.type('kmp-words', o.words);
  if (o.newCode) { c.ui.type('kmp-new-code', o.newCode, true); c.ui.type('kmp-confirm-code', o.newCode, true); }
  offer(c, 'gate.kmp', o.text);
  c.ui.tap('kmp-restoreChoose');
  until(() => !existsSync(join(c.sim.gateDir(), 'pick')), 30_000, 'the app to take the chosen file');
  c.ui.waitFor(els => byId(els, 'kmp-restore') || byId(els, 'kmp-error'), 120_000, 'the Restore button after choosing the file');
  const early = byId(c.ui.tree(), 'kmp-error'); if (early) throw new TestError(`choosing the file showed: "${early.text}"`);
  const tag = `cut-${Date.now()}`;
  if (o.arm) writeFileSync(join(c.sim.gateDir(), 'arm'), `vault-write ${o.arm} ${tag}`);
  c.ui.tap('kmp-restore');
  const at = join(c.sim.gateDir(), `at-${tag}`), disarm = () => rmSync(join(c.sim.gateDir(), 'arm'), { force: true });
  for (const end = Date.now() + 300_000; Date.now() < end;) {
    if (o.arm && existsSync(at)) return { outcome: 'cut' };
    const els = c.ui.tree();
    const err = byId(els, 'kmp-error'); if (err) { disarm(); return { outcome: 'refused', text: err.text }; }
    if (onScreen(els, 'home') && byId(els, 'kmp-notice')?.text === t('restoreDone')) { disarm(); return { outcome: 'restored' }; }
  }
  throw new TestError('waited 300 s for the restore to end');
}
function mustRestore(c: Ctx, o: { text: string; words: string; newCode?: string }, when: string) {
  const r = restore(c, o); if (r.outcome !== 'restored') throw new AppFail(`${when}: the restore was ${r.outcome}${'text' in r ? `: "${r.text}"` : ''}`);
}
function mustRefuse(c: Ctx, o: { text: string; words: string; newCode?: string }, when: string): string {
  const r = restore(c, o); if (r.outcome !== 'refused') throw new AppFail(`${when}: the app ${r.outcome} it instead of refusing`);
  return r.text;
}
function openFolder(c: Ctx, folder: string) {
  goTab(c, 'home');
  c.ui.tap(`kmp-folder-${folder}`); c.ui.waitFor(els => onScreen(els, 'folder'), 20_000, 'the folder screen');
}
const newVault = (c: Ctx, fx = c.cur) => { c.sim.freshInstall(c.gateApp); seed(c, fx); launch(c, 'lock');
  if (!existsSync(join(c.sim.gateDir(), 'keychain-done'))) throw new TestError('the gate build did not put the fixture Keychain entries in place (is this the gate build?)');
  mustUnlock(c, fx.m.code); };

// ── the checks ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const CHECKS: Record<string, (c: Ctx) => string> = {
  'old-data-upgraded': c => {
    newVault(c, c.old);
    expectCount(c, c.old.m.items.length, 'old vault opened by this build');
    const diff = againstManifest(opened(backupNow(c), c.old.m.words), c.old.m);
    if (diff.length) throw new AppFail(`the old vault read by this build differs: ${diff.join('; ')}`);
    return `a vault made by ${c.old.m.core} (4 items, 2 files; Keychain entries as that build wrote them) opened by this build with its passcode: Home 4, and its backup holds every item with every file's sha256 as made`;
  },

  'passcode-reset-face-id-and-phrase': c => {
    const m = c.cur.m, code2 = '246802';
    c.sim.enrollFaceId(true);
    newVault(c);
    const status = JSON.parse(readFileSync(join(c.sim.gateDir(), 'status.json'), 'utf8'));
    if (status.enrolled !== true) throw new TestError(`Face ID enrolled on the Simulator, but the app reads ${JSON.stringify(status)}`);
    // 1. With the 12 words.
    goTab(c, 'settings');
    c.ui.tap('kmp-lockNow'); c.ui.waitFor(els => onScreen(els, 'lock'), 20_000, 'the lock screen');
    c.ui.tap('kmp-forgot'); c.ui.waitFor(els => onScreen(els, 'reset'), 20_000, 'the reset screen');
    c.ui.type('kmp-new-code', code2, true); c.ui.type('kmp-confirm-code', code2, true); c.ui.type('kmp-words', m.words);
    c.ui.tap('kmp-reset');
    c.ui.waitFor(els => vaultOpen(els) || byId(els, 'kmp-error'), 90_000, 'the vault after the reset with the 12 words');
    const e1 = byId(c.ui.tree(), 'kmp-error'); if (e1) throw new AppFail(`reset with the 12 words refused: "${e1.text}"`);
    expectCount(c, 4, 'after the reset with the 12 words');
    launch(c, 'lock');
    if (unlock(c, m.code) === 'open') throw new AppFail('the old passcode still opens the vault after the reset');
    mustUnlock(c, code2); expectCount(c, 4, 'new passcode after the reset with the 12 words');
    // 2. Face ID on (Settings), then a reset with a Face ID match.
    goTab(c, 'settings');
    c.ui.tap('kmp-biometrics');
    faceId(c, els => !!byId(els, 'kmp-biometrics')?.checked || byId(els, 'kmp-biometrics')?.value === '1', 'the Face ID switch to turn on');
    c.ui.tap('kmp-lockNow'); c.ui.waitFor(els => onScreen(els, 'lock'), 20_000, 'the lock screen');
    cancelFaceId(c);
    c.ui.tap('kmp-forgot'); c.ui.waitFor(els => onScreen(els, 'reset'), 20_000, 'the reset screen');
    c.ui.type('kmp-new-code', m.code, true); c.ui.type('kmp-confirm-code', m.code, true);
    c.ui.tap('kmp-useBio');
    faceId(c, els => vaultOpen(els), 'the vault after the Face ID reset');
    expectCount(c, 4, 'after the reset with Face ID');
    launch(c, 'lock'); cancelFaceId(c);
    if (unlock(c, code2) === 'open') throw new AppFail('the passcode before the Face ID reset still opens the vault');
    mustUnlock(c, m.code); expectCount(c, 4, 'new passcode after the Face ID reset');
    return `the app read Face ID as enrolled (${JSON.stringify(status.types)}); reset with the 12 words: the old passcode refused, the new one opens the same 4 items; Face ID turned on in Settings with a match; reset with a Face ID match: the passcode before it refused, the new one opens the same 4 items`;
  },

  'full-test-vault-backed-up': c => {
    newVault(c);
    const text = backupNow(c), diff = againstManifest(opened(text, c.cur.m.words), c.cur.m);
    if (diff.length) throw new AppFail(`the backup file is not the whole vault: ${diff.join('; ')}`);
    offer(c, 'saved.kmp', text);
    c.ui.tap('kmp-backupCheck');
    until(() => !existsSync(join(c.sim.gateDir(), 'pick')), 30_000, 'the app to take the saved backup');
    c.ui.waitFor(els => !byId(els, 'kmp-busy'), 60_000, 'the backup to be read');
    c.ui.tap('kmp-backupCheck');
    const r = c.ui.waitFor(els => byId(els, 'kmp-notice')?.text ?? byId(els, 'kmp-error')?.text, 60_000, 'the check of the saved backup')!;
    if (r !== t('backupDone')) throw new AppFail(`Check the saved backup said "${r}", not "${t('backupDone')}"`);
    return `Back up now made a file the 12 words open holding all 4 items with every file's sha256 as made; Check the saved backup on that file: "${r}"`;
  },

  'fresh-install-restore-with-phrase-only': c => {
    newVault(c); const text = backupNow(c), code2 = '246802';
    c.sim.freshInstall(c.gateApp); launch(c, 'first');
    mustRestore(c, { text, words: c.cur.m.words, newCode: code2 }, 'restore on a new install');
    expectCount(c, 4, 'after the restore on a new install');
    launch(c, 'lock'); mustUnlock(c, code2); expectCount(c, 4, 'the new passcode after the restore');
    return 'app deleted, Keychain emptied, installed again: Restore a backup with only the file, the 12 words and a new passcode gave back the 4 items, and the new passcode opens them after a relaunch';
  },

  'every-file-hash-matches': c => {
    newVault(c); const before = backupNow(c);
    c.sim.freshInstall(c.gateApp); launch(c, 'first');
    mustRestore(c, { text: before, words: c.cur.m.words, newCode: '246802' }, 'restore on a new install');
    const after = backupNow(c), w = c.cur.m.words;
    const diff = [...againstManifest(opened(after, w), c.cur.m), ...compare(opened(before, w), opened(after, w))];
    if (diff.length) throw new AppFail(`after the restore: ${diff.join('; ')}`);
    return `a backup made after a restore on a new install holds every item of the backup before it (same ids, fields and bytes), and each file's bytes hash to the sha256 of the file first saved (${c.cur.m.items.filter(i => i.sha256).length} files)`;
  },

  'restore-twice-no-duplicates': c => {
    newVault(c); const text = backupNow(c);
    for (const k of [1, 2]) { mustRestore(c, { text, words: c.cur.m.words }, `restore ${k}`); expectCount(c, 4, `after restore ${k}`); }
    const diff = againstManifest(opened(backupNow(c), c.cur.m.words), c.cur.m);
    if (diff.length) throw new AppFail(`after two restores: ${diff.join('; ')}`);
    return 'the vault\'s own backup restored into it twice: restored both times, Home 4 both times, and a backup after holds each item once';
  },

  'corrupt-or-missing-file-rejected': c => {
    newVault(c); const good = backupNow(c), w = c.cur.m.words, seen: string[] = [];
    for (const how of CORRUPTIONS) {
      const said = mustRefuse(c, { text: corrupt(good, how, w), words: w }, `${how} file into the vault`);
      expectCount(c, 4, `after the ${how} file was refused`); seen.push(`${how}: "${said.slice(0, 40)}…"`);
    }
    // On a new install nothing else (an item already there) can be what refuses it: the file's own check must.
    for (const how of CORRUPTIONS) {
      c.sim.freshInstall(c.gateApp); launch(c, 'first');
      mustRefuse(c, { text: corrupt(good, how, w), words: w, newCode: '246802' }, `${how} file on a new install`);
      launch(c, 'first');
    }
    return `a backup with a file's bytes removed, with a file's bytes altered under its recorded hash, with one ciphertext byte flipped, and cut in half: each refused into the vault (Home still 4; ${seen.join(', ')}) and on a new install (the app still had no vault after a relaunch)`;
  },

  'wrong-phrase-changes-nothing': c => {
    newVault(c); const good = backupNow(c), random = (n: number) => new Uint8Array(randomBytes(n));
    let wrong = phrase(random); while (wrong === c.cur.m.words) wrong = phrase(random);
    const said = mustRefuse(c, { text: good, words: wrong }, 'a different valid phrase into the vault');
    expectCount(c, 4, 'after the wrong phrase was refused');
    c.sim.freshInstall(c.gateApp); launch(c, 'first');
    mustRefuse(c, { text: good, words: wrong, newCode: '246802' }, 'a different valid phrase on a new install');
    launch(c, 'first');
    return `a valid but different 12-word phrase on the real backup: refused into the vault ("${said}"), Home still 4; refused on a new install, which still had no vault after a relaunch`;
  },

  'full-disk-changes-nothing': c => {
    const m = c.cur.m, tick = `kmp-tick-${m.line}`;
    newVault(c); openFolder(c, m.folder);
    if (byId(c.ui.tree(), tick)?.checked) throw new TestError('the checklist line was already ticked');
    c.sim.terminate();
    const V = join(c.sim.container(), 'Documents', 'vault'), before = join(c.work, 'vault-before'), after = join(c.work, 'vault-after'), dmg = join(c.work, 'full.dmg');
    cpSync(V, before, { recursive: true });
    const kb = Number(run('du', ['-sk', V]).out.split('\t')[0]) + 2048;
    const sh = (cmd: string, args: string[]) => { const r = run(cmd, args); if (r.status !== 0) throw new TestError(`${cmd} ${args[0]}: ${r.err.trim().slice(0, 200)}`); return r.out; };
    sh('hdiutil', ['create', '-size', `${kb}k`, '-fs', 'HFS+', '-volname', 'gatefull', '-layout', 'NONE', dmg]);
    rmSync(V, { recursive: true, force: true }); mkdirSync(V);
    sh('hdiutil', ['attach', '-nobrowse', '-mountpoint', V, dmg]);
    let said: string | undefined, free = '?', tickedAfter = true;
    try {
      cpSync(before, V, { recursive: true });
      launch(c, 'lock'); mustUnlock(c, m.code); openFolder(c, m.folder);
      // Filled only now, with the vault open: the save must grow the database's write-ahead log and no block is left
      // (on a disk filled before the database opened, SQLite still saved a note: gate run 46098006485).
      run('dd', ['if=/dev/zero', `of=${join(V, '.filler')}`, 'bs=4k'], { timeout: 120_000 });
      free = run('df', ['-k', V]).out.split('\n')[1]?.split(/\s+/)[3] ?? '?';
      c.ui.tap(tick);
      said = c.ui.waitFor(els => byId(els, 'kmp-error')?.text, 30_000, 'a refusal of the save on the full disk', false);
      tickedAfter = !!byId(c.ui.tree(), tick)?.checked;
    } finally {
      c.sim.terminate(); rmSync(join(V, '.filler'), { force: true });
      cpSync(V, after, { recursive: true });
      if (run('hdiutil', ['detach', V]).status !== 0) run('hdiutil', ['detach', '-force', V]);
      rmSync(V, { recursive: true, force: true }); cpSync(after, V, { recursive: true });
    }
    if (!said) throw new AppFail(`ticking a checklist line on a full disk (${free} KB free) showed no refusal`);
    if (tickedAfter) throw new AppFail('the line shows ticked although the save was refused');
    launch(c, 'lock'); mustUnlock(c, m.code); expectCount(c, 4, 'after the disk was freed');
    openFolder(c, m.folder);
    if (byId(c.ui.tree(), tick)?.checked) throw new AppFail('after the disk was freed the refused tick was saved after all');
    const diff = againstManifest(opened(backupNow(c), m.words), m);
    if (diff.length) throw new AppFail(`after the disk was freed: ${diff.join('; ')}`);
    return `vault folder on a disk image filled to ${free} KB free with the vault open: ticking a line was refused on screen ("${said}") and left unticked; after the disk was freed the vault opens with the same 4 items and files and the line unticked`;
  },

  'interrupted-restore-changes-nothing': c => {
    const m = c.cur.m, FILLERS = 30, full = 4 + FILLERS;
    newVault(c); const big = bigger(backupNow(c), FILLERS, m.words), seen: string[] = [];
    // The restore is cut at its 1st vault write, then its 2nd, …, each time on the untouched vault, until a restore runs
    // to the end without reaching that write. Every cut must leave the vault as it was (4): a restore that saves in
    // more than one step would leave part of it at its second cut.
    let cuts = 0;
    for (let k = 1; k <= 6; k++) {
      if (k > 1) { launch(c, 'lock'); mustUnlock(c, m.code); }
      const r = restore(c, { text: big, words: m.words, arm: k });
      if (r.outcome === 'refused') throw new AppFail(`the ${full}-item backup was refused: "${r.text}"`);
      if (r.outcome === 'restored') { expectCount(c, full, 'after the restore ran to the end'); seen.push(`run ${k}: finished, Home ${full}`); break; }
      c.sim.terminate(); rmSync(join(c.sim.gateDir(), 'arm'), { force: true }); cuts++;
      launch(c, 'lock'); mustUnlock(c, m.code);
      const n = count(c); seen.push(`cut at write ${k}: Home ${n}`);
      if (n !== 4) throw new AppFail(`killed at the restore's vault write ${k}, the vault came back with ${n} items (4 before, ${full} restored): a part restore`);
      if (k === 6) throw new AppFail('the restore reached a 6th vault write');
    }
    if (!cuts) throw new TestError('no cut landed: the restore never reached a vault write');
    return `a ${full}-item (60 MB) restore killed (simctl terminate) while stopped at each of its vault writes, written but not committed: ${seen.join('; ')}; every kill left the vault as it was`;
  },

  'app-switcher-preview-hidden': c => {
    const m = c.cur.m;
    newVault(c); openFolder(c, m.folder);
    // The papers are listed under the checklist, below the first screen (gate run 46181196558): scrolled into view.
    c.ui.showText(m.items.map(i => i.title));
    const shown = join(c.work, 'folder-open.png'); c.sim.screenshot(shown);
    const titles = m.items.map(i => i.title.toLowerCase());
    const read = (f: string) => run(c.ocr, [f], { timeout: 60_000 }).out.toLowerCase().replace(/\s+/g, ' ');
    const onScreenTitles = titles.filter(x => read(shown).includes(x));
    if (!onScreenTitles.length) throw new TestError('OCR read no paper title on the open folder, so it could not see one in a snapshot either');
    const snaps = join(c.sim.container(), 'Library', 'SplashBoard', 'Snapshots');
    rmSync(snaps, { recursive: true, force: true });
    c.sim.openOther();
    const files = until(() => { const f = existsSync(snaps) ? walk(snaps).filter(p => /\.(ktx|png|jpe?g)$/i.test(p)) : []; return f.length ? f : undefined; }, 20_000, 'iOS to keep an app-switcher snapshot');
    const found: string[] = [];
    files.forEach((f, k) => {
      const png = join(c.work, `switcher-snapshot-${k + 1}.png`);
      if (run('sips', ['-s', 'format', 'png', f, '--out', png]).status !== 0) throw new TestError(`could not read snapshot ${f}`);
      const text = read(png); for (const x of titles) if (text.includes(x)) found.push(`"${x}" in snapshot ${k + 1}`);
    });
    if (found.length) throw new AppFail(`the app-switcher snapshot shows paper titles: ${found.join(', ')}`);
    return `with a folder open, OCR read ${onScreenTitles.length} paper titles on screen (folder-open.png); iOS kept ${files.length} app-switcher snapshot(s) (switcher-snapshot-*.png) and OCR reads no title in any`;
  },

  // The store build itself, end to end with the real system screens: the gate build above is the same app plus a seam,
  // and this proves the binary that ships. Its vault comes from the gate build installed first (an update keeps the
  // app's files and Keychain), then the store build is installed over it.
  'store-build-smoke': c => {
    const m = c.cur.m, code2 = '246802';
    newVault(c); c.sim.terminate(); rmSync(join(c.sim.gateDir(), 'status.json'), { force: true });
    c.sim.install(c.storeApp); launch(c, 'lock'); mustUnlock(c, m.code); expectCount(c, 4, 'the store build over the gate build\'s vault');
    if (existsSync(join(c.sim.gateDir(), 'status.json'))) throw new TestError('the "store" build wrote the seam\'s status file: it is not the store build');
    const { pdf } = inventedFiles(), smoke = Buffer.concat([pdf, Buffer.from(`% smoke ${Date.now()}\n`)]);
    const files = filesDir(c);
    writeFileSync(join(files, 'gate-smoke-paper.pdf'), smoke);
    goTab(c, 'home'); c.ui.tap('kmp-add'); c.ui.waitFor(els => onScreen(els, 'add'), 20_000, 'the add screen');
    c.ui.tap('kmp-kind-file');
    pickInPicker(c, 'kmp-pick', 'gate-smoke-paper');
    c.ui.waitFor(els => onScreen(els, 'add') && !byId(els, 'kmp-busy'), 60_000, 'the add screen with the file');
    c.ui.type('kmp-name', 'Gate smoke paper');
    c.ui.tap('kmp-save');
    c.ui.waitFor(els => onScreen(els, 'folder') || onScreen(els, 'heard') || byId(els, 'kmp-error'), 60_000, 'the save');
    const e = byId(c.ui.tree(), 'kmp-error'); if (e) throw new AppFail(`saving the picked file: "${e.text}"`);
    if (onScreen(c.ui.tree(), 'folder')) c.ui.tap('kmp-back');
    expectCount(c, 5, 'after adding a file through the picker');
    const want = { items: [...m.items, { title: 'Gate smoke paper', kind: 'file', filename: 'gate-smoke-paper.pdf', sha256: sha256(smoke) }] };
    const first = shareSheetBackup(c);
    let diff = againstManifest(opened(first, m.words), want);
    if (diff.length) throw new AppFail(`the store build's backup: ${diff.join('; ')}`);
    writeFileSync(join(files, 'gate-smoke-backup.kmp'), first);
    c.sim.freshInstall(c.storeApp); launch(c, 'first');
    c.ui.tap('kmp-restore'); c.ui.waitFor(els => onScreen(els, 'restore'), 20_000, 'the Restore screen');
    c.ui.type('kmp-words', m.words); c.ui.type('kmp-new-code', code2, true); c.ui.type('kmp-confirm-code', code2, true);
    pickInPicker(c, 'kmp-restoreChoose', 'gate-smoke-backup');
    c.ui.waitFor(els => byId(els, 'kmp-restore'), 120_000, 'the Restore button after choosing the backup');
    c.ui.tap('kmp-restore');
    const r = c.ui.waitFor(els => (onScreen(els, 'home') && byId(els, 'kmp-notice')?.text === t('restoreDone') && 'restored') || byId(els, 'kmp-error')?.text, 300_000, 'the restore')!;
    if (r !== 'restored') throw new AppFail(`the store build refused its own backup: "${r}"`);
    expectCount(c, 5, 'after the store build restored its backup');
    diff = againstManifest(opened(shareSheetBackup(c), m.words), want);
    if (diff.length) throw new AppFail(`after the store build's restore: ${diff.join('; ')}`);
    return 'the store build (no seam) opened the gate build\'s vault after an update, added a PDF through the system file picker, backed up through the share sheet (5 items, every sha256 as saved), and on a new install restored that file through the picker with the 12 words: Home 5, and its next backup holds every file byte for byte';
  },
};

// ── system screens the gate build replaces and the store smoke check uses for real ─────────────────────────────────
function walk(d: string): string[] { return readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]); }
/** Files › On My iPhone, where the system picker looks. */
function filesDir(c: Ctx): string {
  c.sim.simctl(['launch', c.sim.udid, 'com.apple.DocumentsApp'], false); wait(6000); c.sim.simctl(['terminate', c.sim.udid, 'com.apple.DocumentsApp'], false);
  const g = c.sim.simctl(['get_app_container', c.sim.udid, 'com.apple.DocumentsApp', 'groups']).out.split('\n').find(l => l.includes('FileProvider.LocalStorage'));
  if (!g) throw new TestError('no Files › On My iPhone storage on this Simulator');
  const d = join(g.replace(/^\S+\s+/, '').trim(), 'File Provider Storage'); mkdirSync(d, { recursive: true }); return d;
}
const tapEl = (c: Ctx, e: El, name: string) => { const p = center(e.box); c.ui.tapPoint(p.x, p.y, name); };
const named = (els: El[], words: string[]) => els.find(e => words.includes(e.text) && e.enabled);
/** The real document picker: open it with the app's button, go to On My iPhone, tap the file, see the picker close.
 *  A picker that ignores the tap is closed with its own Cancel and a new one opened (gate runs 46158994320 and
 *  46163383574: one picker ignored four taps while the next took the first). */
function pickInPicker(c: Ctx, open: string, file: string) {
  const cell = (els: El[]) => els.find(e => e.id.startsWith(`${file}, `) || e.id.startsWith(`${file}.`));
  for (let k = 1; k <= 3; k++) {
    c.ui.tap(open);
    for (let s = 0; s < 4 && !cell(c.ui.tree()); s++) {
      const els = c.ui.tree(), browse = named(els, ['Browse']), mine = named(els, ['On My iPhone']);
      if (mine) tapEl(c, mine, 'picker-on-my-iphone'); else if (browse) tapEl(c, browse, 'picker-browse'); else wait(2000);
    }
    const f = c.ui.waitFor(els => cell(els), 20_000, `${file} in the picker`, false);
    if (!f) throw new TestError(`${file} is not in Files › On My iPhone`);
    tapEl(c, f, 'picker-file');
    const closed = c.ui.waitFor(els => { if (!cell(els)) return true; const o = named(els, ['Open']); if (o) tapEl(c, o, 'picker-open'); return false; }, 30_000, 'the picker to close', false);
    if (closed) return;
    c.log(`picker attempt ${k}: the picker did not take the tap; cancelled`);
    const cancel = named(c.ui.tree(), ['Cancel']); if (cancel) tapEl(c, cancel, 'picker-cancel');
    c.ui.waitFor(els => !cell(els), 20_000, 'the cancelled picker to close');
  }
  throw new TestError(`the system file picker did not take the tap on ${file} in 3 fresh pickers`);
}
/** Back up now in the store build: the share sheet opens with the encrypted file, which is read from the app's own
 *  outgoing folder while the sheet is up; the sheet is then closed. */
function shareSheetBackup(c: Ctx): string {
  goTab(c, 'backup');
  const outgoing = join(c.sim.container(), 'Library', 'Caches', 'outgoing');
  rmSync(outgoing, { recursive: true, force: true });
  c.ui.tap('kmp-backUp');
  const f = until(() => existsSync(outgoing) && readdirSync(outgoing).find(n => n.endsWith('.kmp') && statSync(join(outgoing, n)).size > 0), 90_000, 'the backup file under the share sheet');
  let text = ''; until(() => { try { text = readFileSync(join(outgoing, f), 'utf8'); JSON.parse(text); return true; } catch { return false; } }, 30_000, 'the whole backup file');
  for (let k = 0; k < 4; k++) {
    const els = c.ui.tree(), close = named(els, ['Close', 'Cancel']);
    if (close) tapEl(c, close, 'share-close'); else c.ui.tapPoint(20, 120, 'share-outside');
    if (c.ui.waitFor(els2 => !named(els2, ['Close']) && onScreen(els2, 'backup'), 8000, 'the share sheet to close', false)) break;
  }
  c.ui.tap('kmp-tab-home'); c.ui.waitFor(els => onScreen(els, 'home'), 20_000, 'Home after the share sheet (a sheet still up would take the tap)');
  return text;
}

/** Face ID: taps the one-time "allow Face ID" alert if it shows and matches the enrolled face until `done`. */
function faceId(c: Ctx, done: (els: El[]) => boolean, what: string) {
  for (const end = Date.now() + 60_000; Date.now() < end;) {
    const els = c.ui.tree();
    if (done(els)) return;
    const err = byId(els, 'kmp-error'); if (err) throw new AppFail(`${what}: "${err.text}"`);
    const ok = named(els, ['OK', 'Allow']); if (ok) { tapEl(c, ok, 'faceid-allow'); continue; }
    c.sim.face(true); wait(2500);
  }
  throw new TestError(`waited 60 s for ${what}`);
}
/** The lock screen opens Face ID by itself when it is on; the reset path needs it cancelled (no face is matched). */
function cancelFaceId(c: Ctx) {
  // The Face ID sheet has no button until a face fails; a failed face (nomatch) brings Try Again and Cancel.
  for (let k = 0; k < 5; k++) {
    wait(2000);
    const cancel = named(c.ui.tree(), ['Cancel']);
    if (cancel) { tapEl(c, cancel, 'faceid-cancel'); c.ui.waitFor(e2 => !named(e2, ['Cancel']), 10_000, 'Face ID to close'); return; }
    c.sim.face(false);
  }
  c.log('no Face ID prompt to cancel on the lock screen');
}
