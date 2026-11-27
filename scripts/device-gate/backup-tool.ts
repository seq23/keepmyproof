// THE DEVICE GATE's host side (scripts/device-gate/run.sh): reads and makes KeepMyProof backup files with the
// app's own crypto (src/core/crypto.ts, src/core/model.ts), so the Simulator run can prove what a backup holds.
// Invented test vaults only. Usage (tsx):
//   summary <backup> <words>            JSON: item count and each item's id, title, kind and sha256 of its bytes
//   compare <a> <b> <words>             exit 0 only if both hold the same items with byte-identical files
//   corrupt <in> <out> <how> <words>    how: missing (a file's bytes removed) | changed (a file's bytes altered,
//                                       its hash kept) | flipped (one ciphertext byte) | truncated (half the file)
//   bigger <in> <out> <n> <words>       the same backup plus n invented 2 MB files (for the interrupted restore)
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { b64, decode, hash, open, recoveryKey, seal, unb64, utf8 } from '../../src/core/crypto';
import { PRIVATE_FOLDER, validate, type Snapshot } from '../../src/core/model';

const random = (n: number) => new Uint8Array(randomBytes(n));
const read = (file: string, words: string): Snapshot => validate(JSON.parse(decode(open(readFileSync(file, 'utf8'), recoveryKey(words), 'backup-v1'))));
const write = (file: string, s: Snapshot, words: string) => writeFileSync(file, seal(utf8(JSON.stringify(s)), recoveryKey(words), 'backup-v1', random));
const fileHash = (bytes: string | null) => bytes === null ? null : hash(unb64(bytes));
export function summary(s: Snapshot) {
  return { count: s.items.length, files: s.items.filter(i => i.bytes !== null).length,
    items: s.items.map(i => ({ id: i.id, title: i.title, kind: i.kind, sha256: fileHash(i.bytes) })).sort((a, b) => a.id < b.id ? -1 : 1) };
}
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
function main() {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === 'summary') { console.log(JSON.stringify(summary(read(a[0], a[1])))); return; }
  if (cmd === 'compare') {
    const diff = compare(read(a[0], a[2]), read(a[1], a[2]));
    console.log(diff.length ? `DIFFERENT: ${diff.join('; ')}` : 'SAME: every item and every file byte matches');
    process.exitCode = diff.length ? 1 : 0; return;
  }
  if (cmd === 'corrupt') {
    const [input, out, how, words] = a;
    if (how === 'flipped' || how === 'truncated') {
      const text = readFileSync(input, 'utf8');
      if (how === 'truncated') { writeFileSync(out, text.slice(0, Math.floor(text.length / 2))); return; }
      const box = JSON.parse(text), c = unb64(box.c); c[Math.floor(c.length / 2)] ^= 0x01; box.c = b64(c);
      writeFileSync(out, JSON.stringify(box)); return;
    }
    const s = read(input, words), file = s.items.find(i => i.bytes !== null);
    if (!file) throw Error('NAMED STOP [NO_FILE_ITEM] the backup holds no file to break');
    if (how === 'missing') file.bytes = null;
    else if (how === 'changed') { const b = unb64(file.bytes!); b[0] ^= 0x01; file.bytes = b64(b); }
    else throw Error(`unknown how: ${how}`);
    // Sealed without validate(): this file is meant to be refused by the app.
    writeFileSync(out, seal(utf8(JSON.stringify(s)), recoveryKey(words), 'backup-v1', random)); return;
  }
  if (cmd === 'bigger') {
    const [input, out, n, words] = a, s = read(input, words), now = new Date().toISOString();
    for (let k = 1; k <= Number(n); k++) {
      const bytes = random(2 * 1024 * 1024);
      s.items.push({ id: `gate-filler-${k}-${b64(random(6)).replace(/[^A-Za-z0-9]/g, '')}`, folder: PRIVATE_FOLDER.id, checklist: null, kind: 'file',
        title: `Gate filler ${k}`, note: '', happenedOn: null, savedOn: now, changedOn: null, filename: `filler-${k}.bin`,
        mime: 'application/octet-stream', bytes: b64(bytes), sha256: hash(bytes), tags: [], history: [] });
    }
    write(out, validate(s), words); return;
  }
  throw Error(`unknown command: ${cmd}`);
}
if (process.argv[1]?.endsWith('backup-tool.ts')) main();
