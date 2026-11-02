// CI step of the simulator preview (.github/workflows/preview.yml). Rule 0: exits 1 with a NAMED STOP
// unless there is one PNG per takeScreenshot step in .maestro/preview.yaml, none of them blank.
// Writes the screen list, in order, to the job summary.
//   node scripts/preview/shots.mjs <screenshot dir>
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { FLOW, flowShots } from '../lib/preview-flow.mjs';

/** Decodes an 8-bit, non-interlaced RGB/RGBA PNG to { width, height, channels, pixels }. */
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw Error('NOT_PNG');
  let off = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), kind = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (kind === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    off += 12 + len;
  }
  const channels = { 2: 3, 6: 4 }[type];
  if (depth !== 8 || !channels || interlace) throw Error(`PNG_UNSUPPORTED depth ${depth} type ${type} interlace ${interlace}`);
  const raw = inflateSync(Buffer.concat(idat)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[row + x - channels] : 0, b = y ? pixels[row - stride + x] : 0, c = x >= channels && y ? pixels[row - stride + x - channels] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      pixels[row + x] = (src[x] + pred) & 255;
    }
  }
  return { width, height, channels, pixels };
}

/** Share of pixels below the status bar that differ from the most common colour. A blanked
 *  (screenshot-protected) or empty screen is ~0; a real screen with text and cards is several %. */
export function detail({ width, height, channels, pixels }) {
  const top = Math.floor(height * 0.08), counts = new Map(); let n = 0;
  const key = i => (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
  for (let y = top; y < height; y += 2) for (let x = 0; x < width; x += 2) { const k = key((y * width + x) * channels); counts.set(k, (counts.get(k) ?? 0) + 1); n++; }
  const most = Math.max(...counts.values());
  return n ? 1 - most / n : 0;
}
export const MIN_DETAIL = 0.01;

function main() {
  const dir = process.argv[2];
  if (!dir) throw Error('usage: node scripts/preview/shots.mjs <screenshot dir>');
  const { shots, notShown } = flowShots(readFileSync(FLOW, 'utf8'));
  if (!shots.length) { console.error(`NAMED STOP [PREVIEW_NO_SCREEN_LIST] ${FLOW} has no takeScreenshot step`); process.exit(1); }
  const rows = [], bad = [];
  for (const name of shots) {
    const file = join(dir, `${name}.png`);
    if (!existsSync(file)) { bad.push(`PREVIEW_SHOT_MISSING ${name}.png`); rows.push(`| ${name} | missing |`); continue; }
    let d = 0;
    try { d = detail(decodePng(readFileSync(file))); } catch (e) { bad.push(`PREVIEW_SHOT_UNREADABLE ${name}.png: ${e.message}`); }
    if (d < MIN_DETAIL) bad.push(`PREVIEW_SHOT_BLANK ${name}.png (${(d * 100).toFixed(2)}% detail)`);
    rows.push(`| ${name} | ${(d * 100).toFixed(1)}% detail${d < MIN_DETAIL ? ' — BLANK' : ''} |`);
  }
  const summary = [`### Screens, in order (${shots.length - bad.length} of ${shots.length} good)`, '', '| Screen | Check |', '|---|---|', ...rows, '',
    ...notShown.map(n => `Not shown: **${n.screen}** — ${n.reason}`), ''].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  console.log(summary);
  if (bad.length) { for (const b of bad) console.error(`NAMED STOP [${b.split(' ')[0]}] ${b}`); process.exit(1); }
  console.log(`preview: ${shots.length} screenshots, none blank.`);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
