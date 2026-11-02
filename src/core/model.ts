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
export interface CustomFolder { id: string; title: string }
// A checklist line a Plus user added to a folder. Stored under Snapshot.lines, which older vaults
// simply do not have (additive: no existing record changes shape).
export interface CustomLine { id: string; title: string }
export interface Revision { title: string; note: string; happenedOn: string | null; changedOn: string; checklist: string | null; tags: string[] }
export interface Item {
  id: string; folder: string; checklist: string | null; kind: 'photo' | 'file' | 'note';
  title: string; note: string; happenedOn: string | null; savedOn: string; changedOn: string | null;
  filename: string | null; mime: string | null; bytes: string | null; sha256: string | null;
  tags: string[]; history: Revision[];
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
export function validate(input: unknown): Snapshot {
  if (!input || typeof input !== 'object') throw Error('FORMAT_INVALID');
  const s = structuredClone(input) as Snapshot;
  // The first portable format had no history/tags; migrate before validating.
  if ((s as unknown as { version: number }).version === 0) {
    s.version = 1;
    s.items = s.items.map(i => ({ ...i, tags: i.tags ?? [], history: i.history ?? [] }));
  }
  if (s.version !== 1 || !Array.isArray(s.items) || !Array.isArray(s.folders) || !strings(s.hidden) ||
      !s.ticks || typeof s.ticks !== 'object' || Array.isArray(s.ticks) || !Object.values(s.ticks).every(v => typeof v === 'boolean') ||
      !(s.backup === null || (date(s.backup?.checkedOn) && str(s.backup?.digest)))) throw Error('FORMAT_INVALID');
  const folders = new Set(launchFolders.map(f => f.id));
  for (const f of s.folders) {
    if (!str(f.id) || !f.id || !str(f.title) || !f.title.trim() || folders.has(f.id)) throw Error('FORMAT_INVALID');
    folders.add(f.id);
  }
  if (!s.hidden.every(id => folders.has(id))) throw Error('FORMAT_INVALID');
  if (s.lines !== undefined) {
    if (!s.lines || typeof s.lines !== 'object' || Array.isArray(s.lines)) throw Error('FORMAT_INVALID');
    for (const [folder, lines] of Object.entries(s.lines)) {
      const taken = new Set(launchFolders.find(f => f.id === folder)?.checklist_items?.map(c => c.id) ?? []);
      if (!folders.has(folder) || !Array.isArray(lines)) throw Error('FORMAT_INVALID');
      for (const l of lines) {
        if (!str(l?.id) || !l.id || taken.has(l.id) || !str(l.title) || !l.title.trim()) throw Error('FORMAT_INVALID');
        taken.add(l.id);
      }
    }
  }
  const ids = new Set<string>();
  for (const i of s.items) {
    const topic = launchFolders.find(f => f.id === i.folder);
    if (!str(i.id) || !i.id || ids.has(i.id) || !folders.has(i.folder) || !str(i.title) || !i.title.trim() || !str(i.note) ||
      !['photo','file','note'].includes(i.kind) || !nullable(i.checklist) ||
      (i.checklist !== null && !topic?.checklist_items?.some(c => c.id === i.checklist) && !s.lines?.[i.folder]?.some(l => l.id === i.checklist)) ||
      !(i.happenedOn === null || date(i.happenedOn)) || !date(i.savedOn) || !(i.changedOn === null || date(i.changedOn)) ||
      !strings(i.tags) || !Array.isArray(i.history) || !i.history.every(r => str(r.title) && str(r.note) && date(r.changedOn) &&
      (r.happenedOn === null || date(r.happenedOn)) && nullable(r.checklist) && strings(r.tags))) throw Error('FORMAT_INVALID');
    ids.add(i.id);
    if (i.kind === 'note') {
      if (i.bytes !== null || i.sha256 !== null || i.filename !== null || i.mime !== null) throw Error('FORMAT_INVALID');
    } else if (!str(i.bytes) || !str(i.sha256) || !str(i.filename) || !str(i.mime) || hash(unb64(i.bytes)) !== i.sha256) throw Error('FILE_CORRUPT');
  }
  return s;
}
export const contentDigest = (s: Snapshot) => hash(new TextEncoder().encode(JSON.stringify({ ...s, backup: null })));
export function checked(s: Snapshot, folder: string, line: string): boolean {
  return s.ticks[`${folder}/${line}`] ?? s.items.some(i => i.folder === folder && i.checklist === line);
}

/** Every checklist line of a folder: the suggested ones from topics.json, then the user's own (Plus). */
export function folderLines(s: Snapshot, folder: string, lang: Lang): { id: string; name: string; own: boolean }[] {
  const topic = launchFolders.find(f => f.id === folder);
  return [...(topic?.checklist_items ?? []).map(c => ({ id: c.id, name: (c.name as Labels)[lang], own: false })),
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
  return [...launchFolders.map(f => folder(f.id, false)), ...s.folders.map(f => folder(f.id, true))]
    .filter(b => b.kind === 'folder' && !s.hidden.includes(b.id)).concat({ kind: 'makeOwn', plus: true });
}
