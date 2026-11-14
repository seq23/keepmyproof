import topics from '../../topics.json';
import { hash, unb64 } from './crypto';
/** App languages, in the order of every entry in src/strings.ts. zh = Simplified Chinese (zh-Hans). */
export const LANGS = ['en', 'es', 'zh', 'ko'] as const;
export type Lang = typeof LANGS[number];
export type Labels = Record<Lang, string>;
/** BCP 47 tag for dates and the PDF's lang attribute; US residents, so US regional formats. */
export const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-US', zh: 'zh-Hans-US', ko: 'ko-US' };
/** Each language named in itself, for the first-launch picker and Settings. */
export const LANG_NAME: Record<Lang, string> = { en: 'English', es: 'Español', zh: '简体中文', ko: '한국어' };
/** The phone's language as an app language: any Chinese reads Simplified, anything unsupported reads English. */
export function phoneLang(locale: { languageCode?: string | null } | undefined): Lang {
  const code = locale?.languageCode?.toLowerCase();
  return (LANGS as readonly string[]).includes(code ?? '') ? code as Lang : 'en';
}
export const isLang = (v: unknown): v is Lang => (LANGS as readonly unknown[]).includes(v);
export const launchFolders = topics.topics.filter(t => t.release === 'launch').sort((a,b) => a.folder_order! - b.folder_order!);
/** The one neutral folder, free on every plan, for anything that is not a topic: private photos and
 *  papers (user review 14 Nov 2026, finding 2). App-only: it is not a search topic, so it is not in
 *  topics.json (which also drives the website and the search loop). */
export const PRIVATE_FOLDER = { id: 'private', display_name: { en: 'Private', es: 'Privado', zh: '私人', ko: '개인 보관' } as Labels,
  checklist_items: [] as { id: string; name: Labels }[] };
/** Every built-in folder, in Home order: the topic folders, then Private. */
export const appFolders: { id: string; display_name: Labels; checklist_items?: { id: string; name: Labels }[] }[] =
  [...launchFolders.map(f => ({ id: f.id, display_name: f.display_name as Labels, checklist_items: f.checklist_items as { id: string; name: Labels }[] | undefined })), PRIVATE_FOLDER];
/** Where an add that did not start inside a folder goes until the person picks one: the neutral folder. */
export const DEFAULT_ADD_FOLDER = PRIVATE_FOLDER.id;
export interface CustomFolder { id: string; title: string }
// A checklist line a Plus user added to a folder. Stored under Snapshot.lines, which older vaults
// simply do not have (additive: no existing record changes shape).
export interface CustomLine { id: string; title: string }
/** An earlier version of an item. folder / filename / sha256: what it was before a move or a replaced
 *  file (absent on revisions made before 14 Nov 2026). */
export interface Revision { title: string; note: string; happenedOn: string | null; changedOn: string; checklist: string | null; tags: string[];
  folder?: string; filename?: string | null; sha256?: string | null }
export interface Item {
  id: string; folder: string; checklist: string | null; kind: 'photo' | 'file' | 'note';
  title: string; note: string; happenedOn: string | null; savedOn: string; changedOn: string | null;
  filename: string | null; mime: string | null; bytes: string | null; sha256: string | null;
  tags: string[]; history: Revision[];
  /** A photo's own "taken" time from the phone (EXIF), used only to order items with no "happened"
   *  date; absent on items saved before 14 Nov 2026. */
  takenOn?: string | null;
}
export interface Snapshot {
  version: 1; items: Item[]; folders: CustomFolder[]; ticks: Record<string, boolean>;
  hidden: string[]; backup: { checkedOn: string; digest: string } | null;
  lines?: Record<string, CustomLine[]>;
}
export const empty = (): Snapshot => ({ version: 1, items: [], folders: [], ticks: {}, hidden: [], backup: null });
const str = (v: unknown): v is string => typeof v === 'string';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(str);
const nullable = (v: unknown) => v === null || str(v);
const date = (v: unknown) => str(v) && Number.isFinite(Date.parse(v));
/** A deep copy of plain data that shares strings instead of copying them. Strings are immutable, so a
 *  vault's photo bytes (base64, megabytes each) are never copied on a render or a save. */
export function clone<T>(v: T): T {
  if (Array.isArray(v)) return v.map(clone) as T;
  if (v && typeof v === 'object') { const out: Record<string, unknown> = {}; for (const [k, x] of Object.entries(v)) out[k] = clone(x); return out as T; }
  return v;
}
/** trusted: items whose bytes are already known to match their sha256 (the authenticated vault just
 *  opened, or bytes unchanged since the last save), so megabytes of photos are not hashed again. */
export function validate(input: unknown, trusted: (i: Item) => boolean = () => false): Snapshot {
  if (!input || typeof input !== 'object') throw Error('FORMAT_INVALID');
  const s = clone(input) as Snapshot;
  // The first portable format had no history/tags; migrate before validating.
  if ((s as unknown as { version: number }).version === 0) {
    s.version = 1;
    s.items = s.items.map(i => ({ ...i, tags: i.tags ?? [], history: i.history ?? [] }));
  }
  if (s.version !== 1 || !Array.isArray(s.items) || !Array.isArray(s.folders) || !strings(s.hidden) ||
      !s.ticks || typeof s.ticks !== 'object' || Array.isArray(s.ticks) || !Object.values(s.ticks).every(v => typeof v === 'boolean') ||
      !(s.backup === null || (date(s.backup?.checkedOn) && str(s.backup?.digest)))) throw Error('FORMAT_INVALID');
  const folders = new Set(appFolders.map(f => f.id));
  for (const f of s.folders) {
    if (!str(f.id) || !f.id || !str(f.title) || !f.title.trim() || folders.has(f.id)) throw Error('FORMAT_INVALID');
    folders.add(f.id);
  }
  if (!s.hidden.every(id => folders.has(id))) throw Error('FORMAT_INVALID');
  if (s.lines !== undefined) {
    if (!s.lines || typeof s.lines !== 'object' || Array.isArray(s.lines)) throw Error('FORMAT_INVALID');
    for (const [folder, lines] of Object.entries(s.lines)) {
      const taken = new Set(appFolders.find(f => f.id === folder)?.checklist_items?.map(c => c.id) ?? []);
      if (!folders.has(folder) || !Array.isArray(lines)) throw Error('FORMAT_INVALID');
      for (const l of lines) {
        if (!str(l?.id) || !l.id || taken.has(l.id) || !str(l.title) || !l.title.trim()) throw Error('FORMAT_INVALID');
        taken.add(l.id);
      }
    }
  }
  const ids = new Set<string>();
  for (const i of s.items) {
    const topic = appFolders.find(f => f.id === i.folder);
    if (!str(i.id) || !i.id || ids.has(i.id) || !folders.has(i.folder) || !str(i.title) || !i.title.trim() || !str(i.note) ||
      !['photo','file','note'].includes(i.kind) || !nullable(i.checklist) ||
      (i.checklist !== null && !topic?.checklist_items?.some(c => c.id === i.checklist) && !s.lines?.[i.folder]?.some(l => l.id === i.checklist)) ||
      !(i.happenedOn === null || date(i.happenedOn)) || !date(i.savedOn) || !(i.changedOn === null || date(i.changedOn)) ||
      !strings(i.tags) || !Array.isArray(i.history) || !i.history.every(r => str(r.title) && str(r.note) && date(r.changedOn) &&
      (r.happenedOn === null || date(r.happenedOn)) && nullable(r.checklist) && strings(r.tags) &&
      (r.folder === undefined || folders.has(r.folder)) && (r.filename === undefined || nullable(r.filename)) && (r.sha256 === undefined || nullable(r.sha256)))) throw Error('FORMAT_INVALID');
    ids.add(i.id);
    if (i.kind === 'note') {
      if (i.bytes !== null || i.sha256 !== null || i.filename !== null || i.mime !== null) throw Error('FORMAT_INVALID');
    } else if (!str(i.bytes) || !str(i.sha256) || !str(i.filename) || !str(i.mime) || (!trusted(i) && hash(unb64(i.bytes)) !== i.sha256)) throw Error('FILE_CORRUPT');
    if (i.takenOn !== undefined && !(i.takenOn === null || date(i.takenOn))) throw Error('FORMAT_INVALID');
  }
  return s;
}
export const contentDigest = (s: Snapshot) => hash(new TextEncoder().encode(JSON.stringify({ ...s, backup: null })));
export function checked(s: Snapshot, folder: string, line: string): boolean {
  return s.ticks[`${folder}/${line}`] ?? s.items.some(i => i.folder === folder && i.checklist === line);
}

/** Every checklist line of a folder: the suggested ones from topics.json, then the user's own (Plus). */
export function folderLines(s: Snapshot, folder: string, lang: Lang): { id: string; name: string; own: boolean }[] {
  const topic = appFolders.find(f => f.id === folder);
  return [...(topic?.checklist_items ?? []).map(c => ({ id: c.id, name: c.name[lang], own: false })),
    ...(s.lines?.[folder] ?? []).map(l => ({ id: l.id, name: l.title, own: true }))];
}
/** How a ticked line got its tick: filed papers ('paper'), or the user's own tap ('hand'). null = not ticked. */
export function tickedBy(s: Snapshot, folder: string, line: string): 'paper' | 'hand' | null {
  const manual = s.ticks[`${folder}/${line}`];
  if (manual !== undefined) return manual ? 'hand' : null;
  return s.items.some(i => i.folder === folder && i.checklist === line) ? 'paper' : null;
}
export type HomeButton = { kind: 'folder'; id: string; own: boolean; done: number; items: number } | { kind: 'makeOwn'; plus: true };
/** The Home screen's big buttons, in order: every shown launch folder, the user's own folders, then
 *  "Make your own folder" (Plus). Hidden folders are left out; nothing else is. */
export function homeButtons(s: Snapshot): HomeButton[] {
  const folder = (id: string, own: boolean): HomeButton => ({ kind: 'folder', id, own,
    done: folderLines(s, id, 'en').filter(l => checked(s, id, l.id)).length, items: s.items.filter(i => i.folder === id).length });
  return [...appFolders.map(f => folder(f.id, false)), ...s.folders.map(f => folder(f.id, true))]
    .filter(b => b.kind === 'folder' && !s.hidden.includes(b.id)).concat({ kind: 'makeOwn', plus: true });
}

/** Tags as typed: split on commas, trimmed only here (on save), empty ones dropped, each once. */
export function parseTags(input: string): string[] {
  return [...new Set(input.split(',').map(t => t.trim()).filter(Boolean))];
}
/** Every tag in use, A to Z, for the tag filter. */
export const allTags = (items: Item[]) => [...new Set(items.flatMap(i => i.tags))].sort((a, b) => a.localeCompare(b));
/** Search: every word must appear in the name, note, file name or a tag (any case). tag: only items with that tag. */
export function searchItems(items: Item[], query: string, tag: string | null = null): Item[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(i => (tag === null || i.tags.includes(tag)) &&
    words.every(w => [i.title, i.note, i.filename ?? '', ...i.tags].some(f => f.toLowerCase().includes(w))));
}
/** The backup nudge on Home and Backup. none: nothing to back up yet, or the newest backup was checked.
 *  check: a backup was just shared and still needs its check (pick it again). backup: back up now. */
export function backupNudge(s: Snapshot, shared: boolean): 'none' | 'backup' | 'check' {
  if (!s.items.length && s.backup === null) return 'none';
  if (s.backup?.digest === contentDigest(s)) return 'none';
  return shared ? 'check' : 'backup';
}
