import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as realExport from '../src/core/export';
import { setPressedAnchor } from '../src/anchor';
import * as anchor from '../src/anchor';

// iOS printing ignores CSS @page margins: the folder PDF's text ran ~14 pt from the paper's edge until
// the margins were also handed to the printer. This runs sharePdf with the native modules stubbed and
// checks what the printer is asked for.
test('the folder PDF is printed with at least half-inch margins and its share popover points at the pressed button', async () => {
  const compiled = ts.transpileModule(readFileSync(new URL('../src/native/files.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const printed: any[] = []; const shared: string[] = []; const anchors: any[] = [];
  // The Save PDF button was just pressed here (iPad pass: the popover pointed at empty space).
  setPressedAnchor({ x: 236, y: 1180, width: 560, height: 48 });
  class File { exists = true; constructor(public uri: string) {} async bytes() { return new Uint8Array([1]); } delete() { this.exists = false; } async write() {} }
  const exports: any = {};
  runInNewContext(compiled, { exports, require: (name: string) => {
    if (name === 'expo-file-system') return { File };
    if (name === 'expo-print') return { printToFileAsync: async (o: any) => { printed.push(o); return { uri: 'file:///meta.pdf' }; } };
    if (name === 'expo-sharing') return { shareAsync: async (uri: string, o: any) => { shared.push(uri); anchors.push(o?.anchor); } };
    if (name.endsWith('/anchor')) return anchor;
    if (name.endsWith('/core/export')) return { ...realExport, assemblePdf: async () => new Uint8Array([2]) };
    if (name.endsWith('/storage')) return { tempFile: (n: string) => new File(`file:///tmp/${n}`) };
    return {};
  } });
  await exports.sharePdf([], { title: 'Divorce or custody', madeOn: '2026-11-20T10:00:00Z', lang: 'en' });
  assert.equal(printed.length, 1, 'printed once');
  assert.equal(shared.length, 1, 'shared once');
  assert.deepEqual(anchors[0], { x: 236, y: 1180, width: 560, height: 48 });
  for (const side of ['top', 'right', 'bottom', 'left']) assert.ok(printed[0].margins?.[side] >= 36, `${side} margin is ${printed[0].margins?.[side]} pt`);
});
