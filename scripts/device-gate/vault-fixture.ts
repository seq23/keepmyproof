// THE DEVICE GATE's vault fixtures (docs/device-gate.md): a vault exactly as the app leaves it on a device, made with an
// app's own core code (src/core: Vault, createLock, the crypto), so a check starts from a known vault without driving
// setup and add through the UI. Invented papers only: the repo is public.
//   tsx scripts/device-gate/vault-fixture.ts <out dir> [--core <a src/core folder> --label <which build>] [--code 135790]
// --core: another build's core (old-data-upgraded's fixture was made from b0531f3's, the build App Review last saw).
// Writes <out>/vault/vault.sqlite (the app's Documents/vault), <out>/keychain.json (its Keychain entries, which the gate
// build's seam puts in place at start: src/gate.ts) and <out>/manifest.json (passcode, 12 words, every item and the
// sha256 of every file's bytes, to check what comes back against).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { join, resolve } from 'node:path';
import { deflateSync, crc32 } from 'node:zlib';

// The app's schema and Keychain names (src/native/storage.ts; tests/device-gate-harness.test.ts keeps them equal).
export const SCHEMA = 'PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY CHECK(id=1), ciphertext TEXT NOT NULL); CREATE TABLE IF NOT EXISTS orphaned (archivedOn TEXT NOT NULL, ciphertext TEXT NOT NULL)';
export const KEYCHAIN = { lock: 'kmp-lock-v1', key: 'kmp-key-v1' };
export const FOLDER = 'divorce-prep', LINE = 'financial-statements';

/** An invented one-page PDF and a small PNG: real formats, so the app treats them as a person's files. */
export function inventedFiles() {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 52>>stream\nBT /F1 18 Tf 30 100 Td (Invented gate paper) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
  const w = 64, h = 48, rows: Buffer[] = [];
  for (let y = 0; y < h; y++) { const r = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) r.set([x * 4 % 256, y * 5 % 256, 120], 1 + x * 3); rows.push(r); }
  const chunk = (t: string, b: Buffer) => { const tb = Buffer.concat([Buffer.from(t), b]); const len = Buffer.alloc(4); len.writeUInt32BE(b.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(tb) >>> 0); return Buffer.concat([len, tb, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 2, 0, 0, 0], 8);
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
  return { pdf, png };
}
export const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

export interface Manifest { code: string; words: string; folder: string; line: string; core: string;
  items: { title: string; kind: string; filename: string | null; sha256: string | null }[] }

export async function makeFixture(out: string, { core = resolve(__dirname, '../../src/core'), code = '135790', label = 'this commit: src/core' } = {}): Promise<Manifest> {
  const imp = (m: string) => import(join(core, m));
  const { Vault } = await imp('vault.ts'), { createLock } = await imp('lock.ts'), { b64, phrase } = await imp('crypto.ts');
  const random = (n: number) => new Uint8Array(randomBytes(n));
  const words: string = phrase(random), key = random(32);
  let cipher: string | null = null;
  const vault = new Vault({ read: async () => cipher, write: async (c: string) => { cipher = c; } }, key, random); await vault.load();
  const { pdf, png } = inventedFiles();
  const base = { folder: FOLDER, checklist: null, happenedOn: null, tags: [], note: '' };
  // Titles the switcher check reads back with OCR: long, plain words.
  const drafts = [
    { ...base, kind: 'note', title: 'Gate invented note one', note: 'An invented note for the device gate.', filename: null, mime: null, bytes: null },
    { ...base, kind: 'note', title: 'Gate invented note two', note: 'Another invented note.', filename: null, mime: null, bytes: null },
    { ...base, kind: 'file', title: 'Gate invented lease', filename: 'gate-paper.pdf', mime: 'application/pdf', bytes: b64(pdf) },
    { ...base, kind: 'photo', title: 'Gate invented photo', filename: 'gate-photo.png', mime: 'image/png', bytes: b64(png) },
  ];
  await vault.addMany(drafts, false);
  if (!cipher) throw Error('NAMED STOP [FIXTURE_NOT_WRITTEN] the core saved nothing');
  const lock = await createLock(code, words, false, random);
  rmSync(out, { recursive: true, force: true }); mkdirSync(join(out, 'vault'), { recursive: true });
  const db = new DatabaseSync(join(out, 'vault', 'vault.sqlite'));
  db.exec(SCHEMA); db.prepare('INSERT INTO vault(id,ciphertext) VALUES(1,?)').run(cipher);
  db.exec('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode = DELETE;'); db.close();
  writeFileSync(join(out, 'keychain.json'), JSON.stringify({ [KEYCHAIN.key]: b64(key), [KEYCHAIN.lock]: JSON.stringify(lock) }, null, 2) + '\n');
  const manifest: Manifest = { code, words, folder: FOLDER, line: LINE, core: label,
    items: drafts.map(d => ({ title: d.title, kind: d.kind, filename: d.filename, sha256: d.bytes ? sha256(Buffer.from(d.bytes, 'base64')) : null })) };
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1]?.endsWith('vault-fixture.ts')) {
  const arg = (n: string) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
  const out = process.argv[2];
  if (!out || out.startsWith('--')) throw Error('usage: vault-fixture.ts <out dir> [--core <src/core>] [--code <6 digits>]');
  void makeFixture(resolve(out), { core: arg('--core') ? resolve(arg('--core')!) : undefined, code: arg('--code') ?? '135790', label: arg('--label') })
    .then(m => console.log(`vault fixture: ${m.items.length} items (${m.items.filter(i => i.sha256).length} files) in ${out}, core ${m.core}`));
}
