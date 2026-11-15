import { b64, decode, hash, open, recoveryKey, seal, unb64, utf8, type Random } from './crypto';
import { calendarDay, happenedKey, happenedValue } from './dates';
import { clone, contentDigest, empty, validate, type Item, type Snapshot } from './model';
export interface AtomicStore { read(): Promise<string | null>; write(ciphertext: string): Promise<void> }
export const FREE_LIMIT = 25;
export function mayAdd(count: number, plus: boolean): boolean { return plus || count < FREE_LIMIT; }
const day = happenedValue;
/** Sort key: the day it happened (the user's date, then the time if one was typed); with no date, the
 *  photo's own "taken" time; else the day it was saved. Same key: the later save first. */
const shownDay = (i: Item) => i.happenedOn !== null ? happenedKey(i.happenedOn) : i.takenOn ? happenedKey(i.takenOn) : calendarDay(i.savedOn);
/** Larger first, by plain code-unit order (ISO dates sort as text; localeCompare collation is not used). */
const desc = (x: string, y: string) => x < y ? 1 : x > y ? -1 : 0;
/** Newest first: the day it happened, else the photo's own date, else the day it was saved. Same day (photos
 *  saved together with one typed date): the photo's own taken time, newest first, then the later save. */
export const newestFirst = (a: Item, b: Item) => desc(shownDay(a), shownDay(b)) || desc(a.takenOn ?? '', b.takenOn ?? '') || desc(a.savedOn, b.savedOn);
/** A replacement file for an item (Change it → Replace the file). */
export interface Replacement { filename: string; mime: string; bytes: string }
export type Draft = Pick<Item, 'folder'|'checklist'|'kind'|'title'|'note'|'happenedOn'|'filename'|'mime'|'bytes'|'tags'> & Pick<Partial<Item>, 'takenOn'>;
export class Vault {
  private state: Snapshot = empty();
  private queue: Promise<unknown> = Promise.resolve();
  private active = true;
  /** Ids whose bytes were hashed inside the change being saved (addMany), so they are not hashed twice. */
  private hashed = new Set<string>();
  constructor(private store: AtomicStore, private key: Uint8Array, private random: Random, private now = () => new Date().toISOString()) {}
  async load() {
    const data = await this.store.read();
    // AES-GCM has just authenticated every byte, and each file was hashed when it was saved.
    if (data) this.state = validate(JSON.parse(decode(open(data, this.key, 'vault-v1'))), () => true);
  }
  /** A copy to read or change; file bytes are shared, not copied (they are immutable strings). */
  snapshot(): Snapshot { if (!this.active) throw Error('LOCKED'); return clone(this.state); }
  lock() { this.active = false; this.key.fill(0); this.state = empty(); }
  private mutate(change: (s: Snapshot) => void): Promise<void> {
    const run = async () => {
      if (!this.active) throw Error('LOCKED');
      const before = new Map(this.state.items.map(i => [i.id, i.bytes]));
      const next = this.snapshot(); change(next); const fresh = this.hashed; this.hashed = new Set();
      validate(next, i => i.bytes !== null && (before.get(i.id) === i.bytes || fresh.has(i.id)));
      const cipher = seal(utf8(JSON.stringify(next)), this.key, 'vault-v1', this.random);
      await this.store.write(cipher);
      if (this.active) this.state = next;
    };
    const result = this.queue.then(run); this.queue = result.catch(() => {}); return result;
  }
  async add(draft: Draft, plus: boolean) { return (await this.addMany([draft], plus))[0]; }
  /** Several items in one save (several photos picked at once). All or nothing: past the free limit,
   *  none is added and ITEM_LIMIT is thrown. */
  async addMany(drafts: Draft[], plus: boolean): Promise<string[]> {
    const ids = drafts.map(() => hash(this.random(32)));
    await this.mutate(s => {
      if (!plus && s.items.length + drafts.length > FREE_LIMIT) throw Error('ITEM_LIMIT');
      drafts.forEach((draft, n) => {
        if (draft.tags.length && !plus) throw Error('PLUS_REQUIRED');
        const { takenOn, ...rest } = draft; if (draft.bytes !== null) this.hashed.add(ids[n]);
        s.items.push({ ...rest, ...(takenOn ? { takenOn } : {}), happenedOn: day(draft.happenedOn), id: ids[n], savedOn: this.now(), changedOn: null, history: [], sha256: draft.bytes === null ? null : hash(unb64(draft.bytes)) });
        if (draft.checklist) delete s.ticks[`${draft.folder}/${draft.checklist}`];
      });
    }); return ids;
  }
  /** Change an item. The earlier version is kept in its history, including the folder it was in and the
   *  file it held when the change moves it (folder) or replaces its file (file). "Saved on" never changes. */
  async edit(id: string, change: Pick<Item,'title'|'note'|'happenedOn'|'checklist'|'tags'> & { folder?: string; file?: Replacement }, confirmed: boolean, plus: boolean) {
    if (!confirmed) throw Error('CONFIRM_REQUIRED');
    await this.mutate(s => {
      const item = s.items.find(i => i.id === id); if (!item) throw Error('ITEM_MISSING');
      if (!plus && JSON.stringify(change.tags) !== JSON.stringify(item.tags)) throw Error('PLUS_REQUIRED');
      if (change.file && item.kind === 'note') throw Error('fileRequired');
      const changedOn = this.now(), { folder, file, ...rest } = change;
      item.history.push({ title: item.title, note: item.note, happenedOn: item.happenedOn, checklist: item.checklist, tags: item.tags, changedOn,
        folder: item.folder, filename: item.filename, sha256: item.sha256 });
      Object.assign(item, rest, { happenedOn: day(change.happenedOn), changedOn });
      if (folder !== undefined) item.folder = folder;
      if (file) Object.assign(item, { filename: file.filename, mime: file.mime, bytes: file.bytes, sha256: hash(unb64(file.bytes)) });
      if (item.checklist) delete s.ticks[`${item.folder}/${item.checklist}`];
    });
  }
  /** New recovery words make every earlier backup the old words' backup: the check is cleared so the
   *  app asks for a new backup. */
  async forgetBackup() { await this.mutate(s => { s.backup = null; }); }
  async remove(id: string, confirmed: boolean) {
    if (!confirmed) throw Error('CONFIRM_REQUIRED');
    await this.mutate(s => { if (!s.items.some(i => i.id === id)) throw Error('ITEM_MISSING'); s.items = s.items.filter(i => i.id !== id); });
  }
  async tick(folder: string, line: string, value: boolean) { await this.mutate(s => { s.ticks[`${folder}/${line}`] = value; }); }
  async hide(folder: string, hidden: boolean) { await this.mutate(s => { s.hidden = [...s.hidden.filter(f => f !== folder), ...(hidden ? [folder] : [])]; }); }
  async addFolder(title: string, plus: boolean) {
    if (!plus) throw Error('PLUS_REQUIRED');
    const id = hash(this.random(32)); await this.mutate(s => { s.folders.push({ id, title }); }); return id;
  }
  async addLine(folder: string, title: string, plus: boolean) {
    if (!plus) throw Error('PLUS_REQUIRED');
    if (!title.trim()) throw Error('LINE_EMPTY');
    const id = hash(this.random(32));
    await this.mutate(s => { s.lines = { ...s.lines, [folder]: [...(s.lines?.[folder] ?? []), { id, title: title.trim() }] }; });
    return id;
  }
  /** A folder's items, newest first. Leaving items out (ids) is free; a date range is Plus. */
  items(folder: string, selection?: { ids?: string[]; from?: string; to?: string }, plus = false): Item[] {
    if ((selection?.from || selection?.to) && !plus) throw Error('PLUS_REQUIRED');
    return this.snapshot().items.filter(i => i.folder === folder && (!selection ||
      ((!selection.ids || selection.ids.includes(i.id)) && (!selection.from || (i.happenedOn !== null && calendarDay(i.happenedOn) >= calendarDay(selection.from))) &&
      (!selection.to || (i.happenedOn !== null && calendarDay(i.happenedOn) <= calendarDay(selection.to)))))).sort(newestFirst);
  }
  original(id: string): Uint8Array {
    const item = this.snapshot().items.find(i => i.id === id);
    if (!item || item.bytes === null) throw Error('ITEM_MISSING'); return unb64(item.bytes);
  }
  backup(key: Uint8Array): string { return seal(utf8(JSON.stringify(this.snapshot())), key, 'backup-v1', this.random); }
  async checkBackup(data: string, key: Uint8Array) {
    const restored = validate(JSON.parse(decode(open(data, key, 'backup-v1'))));
    const digest = contentDigest(restored);
    await this.mutate(s => {
      if (digest !== contentDigest(s)) throw Error('BACKUP_OUTDATED');
      s.backup = { checkedOn: this.now(), digest };
    });
  }
  async restore(data: string, words: string) {
    const restored = validate(JSON.parse(decode(open(data, recoveryKey(words), 'backup-v1'))));
    await this.mutate(s => {
      for (const f of restored.folders) {
        const existing = s.folders.find(x => x.id === f.id);
        if (existing && existing.title !== f.title) throw Error('RESTORE_CONFLICT');
        if (!existing) s.folders.push(f);
      }
      for (const [folder, lines] of Object.entries(restored.lines ?? {})) for (const l of lines) {
        const existing = s.lines?.[folder]?.find(x => x.id === l.id);
        if (existing && existing.title !== l.title) throw Error('RESTORE_CONFLICT');
        if (!existing) s.lines = { ...s.lines, [folder]: [...(s.lines?.[folder] ?? []), l] };
      }
      for (const item of restored.items) {
        const existing = s.items.find(i => i.id === item.id);
        if (!existing) s.items.push(item);
        else if (JSON.stringify(existing) !== JSON.stringify(item)) throw Error('RESTORE_CONFLICT');
      }
      s.ticks = { ...restored.ticks, ...s.ticks };
      s.hidden = [...new Set([...s.hidden, ...restored.hidden])];
      s.backup = null;
    });
  }
}
export interface InstallStore extends AtomicStore { archive(): Promise<void> }
// A device restore (iCloud / Android transfer) copies the encrypted vault file but never the
// this-device-only key, so the ciphertext can't be opened here. Set it aside (never erase it)
// so this phone can start fresh or restore from the user's own backup with the 12 words.
export async function prepareInstall(store: InstallStore, hasLock: boolean): Promise<boolean> {
  if (hasLock) return true;
  if (await store.read()) await store.archive();
  return false;
}
/** First launch of this install. installed: the app's own vault file was already on disk before this
 *  launch opened it. When it was not, this is a new install (or a reinstall), and whatever an earlier
 *  install left in the Keychain (which iOS keeps after the app is deleted) is forgotten, so setup starts
 *  fresh instead of asking for a passcode that guards nothing. */
export async function startInstall(o: { installed: boolean; store: InstallStore; hasLock: () => Promise<boolean>; forget: () => Promise<void> }): Promise<boolean> {
  if (!o.installed) { await o.forget(); return prepareInstall(o.store, false); }
  return prepareInstall(o.store, await o.hasLock());
}
