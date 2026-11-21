import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as realExport from '../src/core/export';

// iOS printing ignores CSS @page margins: the folder PDF's text ran ~14 pt from the paper's edge until
// the margins were also handed to the printer. This runs sharePdf with the native modules stubbed and
// checks what the printer is asked for.
test('the folder PDF is printed with at least half-inch margins on every side', async () => {
  const compiled = ts.transpileModule(readFileSync(new URL('../src/native/files.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const printed: any[] = []; const shared: string[] = [];
  class File { exists = true; constructor(public uri: string) {} async bytes() { return new Uint8Array([1]); } delete() { this.exists = false; } async write() {} }
  const exports: any = {};
  runInNewContext(compiled, { exports, require: (name: string) => {
    if (name === 'expo-file-system') return { File };
    if (name === 'expo-print') return { printToFileAsync: async (o: any) => { printed.push(o); return { uri: 'file:///meta.pdf' }; } };
    if (name === 'expo-sharing') return { shareAsync: async (uri: string) => { shared.push(uri); } };
    if (name.endsWith('/core/export')) return { ...realExport, assemblePdf: async () => new Uint8Array([2]) };
    if (name.endsWith('/storage')) return { tempFile: (n: string) => new File(`file:///tmp/${n}`) };
    return {};
  } });
  await exports.sharePdf([], { title: 'Divorce or custody', madeOn: '2026-11-20T10:00:00Z', lang: 'en' });
  assert.equal(printed.length, 1, 'printed once');
  assert.equal(shared.length, 1, 'shared once');
  for (const side of ['top', 'right', 'bottom', 'left']) assert.ok(printed[0].margins?.[side] >= 36, `${side} margin is ${printed[0].margins?.[side]} pt`);
});
