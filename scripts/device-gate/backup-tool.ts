// THE DEVICE GATE's backup reader (scripts/device-gate/checks.ts): opens and makes KeepMyProof backup files with the
// app's own crypto (src/core/crypto.ts, src/core/model.ts), so the Simulator run can prove what a backup holds.
// Invented test vaults only.
import { randomBytes } from 'node:crypto';
import { b64, decode, hash, open, recoveryKey, seal, unb64, utf8 } from '../../src/core/crypto';
import { PRIVATE_FOLDER, validate, type Snapshot } from '../../src/core/model';
import type { Manifest } from './vault-fixture';

const random = (n: number) => new Uint8Array(randomBytes(n));
/** A backup's text, opened with the 12 words and checked the way the app checks one (every file's hash). */
export const readBackup = (text: string, words: string): Snapshot => validate(JSON.parse(decode(open(text, recoveryKey(words), 'backup-v1'))));
const sealBackup = (s: Snapshot, words: string) => seal(utf8(JSON.stringify(s)), recoveryKey(words), 'backup-v1', random);
const fileHash = (bytes: string | null) => bytes === null ? null : hash(unb64(bytes));

export function summary(s: Snapshot) {
  return { count: s.items.length, files: s.items.filter(i => i.bytes !== null).length,
    items: s.items.map(i => ({ title: i.title, kind: i.kind, sha256: fileHash(i.bytes) })).sort((a, b) => a.title < b.title ? -1 : 1) };
}

/** What differs between a backup and the vault fixture it should hold: every item by title, kind and the sha256 of its
 *  file's bytes (computed here from the bytes, never read from the item's own sha256 field). [] = the same. */
export function againstManifest(s: Snapshot, m: Pick<Manifest, 'items'>, extra = 0): string[] {
  const diff: string[] = [];
  if (!m.items.length) diff.push('empty manifest: nothing was compared');
  if (s.items.length !== m.items.length + extra) diff.push(`${s.items.length} items, not ${m.items.length + extra}`);
  for (const want of m.items) {
    const got = s.items.filter(i => i.title === want.title);
    if (got.length !== 1) { diff.push(`${got.length} items titled "${want.title}"`); continue; }
    const i = got[0]!;
    if (i.kind !== want.kind) diff.push(`"${want.title}" is a ${i.kind}, not a ${want.kind}`);
    if (fileHash(i.bytes) !== want.sha256) diff.push(`"${want.title}" file bytes sha256 ${fileHash(i.bytes)?.slice(0, 12) ?? 'none'}, not ${want.sha256?.slice(0, 12) ?? 'none'}`);
  }
  return diff;
}

/** Item-by-item comparison of two backups (ids, every field, every file byte). [] = the same. */
export function compare(a: Snapshot, b: Snapshot): string[] {
  const diff: string[] = [], bi = new Map(b.items.map(i => [i.id, i]));
  if (a.items.length !== b.items.length) diff.push(`count ${a.items.length} vs ${b.items.length}`);
  for (const i of a.items) {
    const j = bi.get(i.id);
    if (!j) { diff.push(`missing ${i.id} ${i.title}`); continue; }
    if (fileHash(i.bytes) !== fileHash(j.bytes)) diff.push(`bytes differ ${i.id} ${i.title}`);
    for (const k of ['title', 'note', 'folder', 'kind', 'happenedOn', 'savedOn', 'filename', 'mime', 'sha256'] as const)
      if (i[k] !== j[k]) diff.push(`${k} differs ${i.id}`);
  }
  if (!a.items.length) diff.push('empty backup: nothing was compared');
  return diff;
}

export const CORRUPTIONS = ['missing', 'changed', 'flipped', 'truncated'] as const;
/** A broken copy of a backup the app must refuse: missing (a file's bytes removed), changed (a file's bytes altered, its
 *  recorded hash kept), flipped (one ciphertext byte), truncated (half the file). */
export function corrupt(text: string, how: typeof CORRUPTIONS[number], words: string): string {
  if (how === 'truncated') return text.slice(0, Math.floor(text.length / 2));
  if (how === 'flipped') { const box = JSON.parse(text), c = unb64(box.c); c[Math.floor(c.length / 2)] ^= 0x01; box.c = b64(c); return JSON.stringify(box); }
  const s = readBackup(text, words), file = s.items.find(i => i.bytes !== null);
  if (!file) throw Error('NAMED STOP [NO_FILE_ITEM] the backup holds no file to break');
  if (how === 'missing') file.bytes = null;
  else { const b = unb64(file.bytes!); b[0] ^= 0x01; file.bytes = b64(b); }
  return sealBackup(s, words); // sealed without validate(): this file is meant to be refused
}

/** The same backup plus n invented 2 MB files (a restore long enough to be cut part way). */
export function bigger(text: string, n: number, words: string): string {
  const s = readBackup(text, words), now = new Date().toISOString();
  for (let k = 1; k <= n; k++) {
    const bytes = random(2 * 1024 * 1024);
    s.items.push({ id: `gate-filler-${k}-${b64(random(6)).replace(/[^A-Za-z0-9]/g, '')}`, folder: PRIVATE_FOLDER.id, checklist: null, kind: 'file',
      title: `Gate filler ${k}`, note: '', happenedOn: null, savedOn: now, changedOn: null, filename: `filler-${k}.bin`,
      mime: 'application/octet-stream', bytes: b64(bytes), sha256: hash(bytes), tags: [], history: [] });
  }
  return sealBackup(validate(s), words);
}
