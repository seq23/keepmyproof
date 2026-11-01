import { b64, decode, hash, open, recoveryKey, seal, unb64, utf8, type Random } from './crypto';
import { contentDigest, empty, validate, type Item, type Snapshot } from './model';
export interface AtomicStore { read(): Promise<string | null>; write(ciphertext: string): Promise<void> }
export const FREE_LIMIT = 25;
export function mayAdd(count: number, plus: boolean): boolean { return plus || count < FREE_LIMIT; }
export type Draft = Pick<Item, 'folder'|'checklist'|'kind'|'title'|'note'|'happenedOn'|'filename'|'mime'|'bytes'|'tags'>;
export class Vault {
  private state: Snapshot = empty();
  private queue: Promise<unknown> = Promise.resolve();
  private active = true;
  constructor(private store: AtomicStore, private key: Uint8Array, private random: Random, private now = () => new Date().toISOString()) {}
  async load() {
    const data = await this.store.read();
    if (data) this.state = validate(JSON.parse(decode(open(data, this.key, 'vault-v1'))));
  }
  snapshot(): Snapshot { if (!this.active) throw Error('LOCKED'); return structuredClone(this.state); }
  lock() { this.active = false; this.key.fill(0); this.state = empty(); }
  private mutate(change: (s: Snapshot) => void): Promise<void> {
    const run = async () => {
      if (!this.active) throw Error('LOCKED');
      const next = this.snapshot(); change(next); validate(next);
      const cipher = seal(utf8(JSON.stringify(next)), this.key, 'vault-v1', this.random);
      await this.store.write(cipher);
      if (this.active) this.state = next;
    };
    const result = this.queue.then(run); this.queue = result.catch(() => {}); return result;
  }
  async add(draft: Draft, plus: boolean) {
    const id = hash(this.random(32));
    await this.mutate(s => {
      if (!mayAdd(s.items.length, plus)) throw Error('ITEM_LIMIT');
      if (draft.tags.length && !plus) throw Error('PLUS_REQUIRED');
      s.items.push({ ...draft, id, savedOn: this.now(), changedOn: null, history: [], sha256: draft.bytes === null ? null : hash(unb64(draft.bytes)) });
      if (draft.checklist) delete s.ticks[`${draft.folder}/${draft.checklist}`];
    }); return id;
  }
  async edit(id: string, change: Pick<Item,'title'|'note'|'happenedOn'|'checklist'|'tags'>, confirmed: boolean, plus: boolean) {
    if (!confirmed) throw Error('CONFIRM_REQUIRED');
    await this.mutate(s => {
      const item = s.items.find(i => i.id === id); if (!item) throw Error('ITEM_MISSING');
      if (!plus && JSON.stringify(change.tags) !== JSON.stringify(item.tags)) throw Error('PLUS_REQUIRED');
      const changedOn = this.now();
      item.history.push({ title: item.title, note: item.note, happenedOn: item.happenedOn, checklist: item.checklist, tags: item.tags, changedOn });
      Object.assign(item, change, { changedOn });
      if (item.checklist) delete s.ticks[`${item.folder}/${item.checklist}`];
    });
  }
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
  items(folder: string, selection?: { ids?: string[]; from?: string; to?: string }, plus = false): Item[] {
    if (selection && !plus) throw Error('PLUS_REQUIRED');
    return this.snapshot().items.filter(i => i.folder === folder && (!selection ||
      ((!selection.ids || selection.ids.includes(i.id)) && (!selection.from || (i.happenedOn !== null && i.happenedOn >= selection.from)) &&
      (!selection.to || (i.happenedOn !== null && i.happenedOn <= selection.to))))).sort((a,b) => b.savedOn.localeCompare(a.savedOn));
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
