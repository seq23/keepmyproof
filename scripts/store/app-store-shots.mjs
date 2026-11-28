// APP STORE SCREENSHOTS (Mac, local; nothing is sent anywhere). Renders, with the local Google Chrome, the three
// approved App Store shots around fresh Simulator screens of the current build (the Simulator preview's Maestro
// walk, .github/workflows/preview.yml with screens=true: 07-home, 19-lock, 13-backup):
//   store/app-store/iphone-0N.png  1320 x 2868 (6.9" iPhone)   store/app-store/ipad-0N.png  2048 x 2732 (13" iPad)
// The captions are the approved ones (15 Nov 2026: the private photo vault leads); only the screen inside changes.
//   node scripts/store/app-store-shots.mjs <iphone walk dir> <ipad walk dir>
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '../..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = mkdtempSync(join(tmpdir(), 'kmp-asc-'));
const font = (f) => `url(file://${ROOT}/assets/site/${f})`;
const FONTS = `@font-face{font-family:Serif;font-weight:700;src:${font('noto-serif-700.woff2')}}@font-face{font-family:Sans;src:${font('noto-sans.woff2')}}`;
export const SHOTS = [
  { n: '01', screen: '07-home', caption: 'A private vault for your photos and screenshots.' },
  { n: '02', screen: '19-lock', caption: 'Locked with your own passcode.' },
  { n: '03', screen: '13-backup', caption: 'No account. Nobody else sees it.' },
];
// Sizes in px. top: where the screen card starts; crop: the Simulator's status bar, left out of the card.
const DEVICES = {
  iphone: { w: 1320, h: 2868, pad: 86, bar: 172, font: 106, top: 712, radius: 66, crop: 0.062 },
  ipad: { w: 2048, h: 2732, pad: 150, bar: 190, font: 120, top: 640, radius: 56, crop: 0.03 },
};
function render(kind, n, caption, src) {
  const d = DEVICES[kind], html = join(tmp, `${kind}-${n}.html`), out = join(tmp, `${kind}-${n}.png`), card = d.w - 2 * d.pad;
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${FONTS}*{margin:0;box-sizing:border-box}html,body{width:${d.w}px;height:${d.h}px;overflow:hidden;background:#F3F4F1}</style>
<div style="position:absolute;left:${d.pad}px;top:${d.bar}px;width:${Math.round(d.font)}px;height:${Math.round(d.font / 8)}px;background:#0B6E4F;border-radius:6px"></div>
<div style="position:absolute;left:${d.pad}px;top:${d.bar + d.font * 0.55}px;width:${card}px;font:700 ${d.font}px/1.1 Serif;color:#1E2326;text-wrap:balance">${caption}</div>
<div style="position:absolute;left:${d.pad}px;top:${d.top}px;width:${card}px;height:${d.h}px;border-radius:${d.radius}px;overflow:hidden;border:3px solid #DADDD6;box-shadow:0 18px 60px rgba(30,35,38,.10);background:#F3F4F1">
<img src="file://${src}" style="display:block;width:100%;margin-top:-${d.crop * 100 * (card / d.w)}%"></div>`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${d.w},${d.h}`, `--screenshot=${out}`, `file://${html}`], { stdio: 'ignore' });
  // App Store Connect refuses an alpha channel: a JPEG round trip through sips drops it.
  const jpg = join(tmp, 'flat.jpg'), dest = join(ROOT, 'store/app-store', `${kind}-${n}.png`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', out, '--out', jpg], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', dest], { stdio: 'ignore' });
}
if (process.argv[1] === import.meta.filename) {
  const dirs = { iphone: process.argv[2], ipad: process.argv[3] };
  mkdirSync(join(ROOT, 'store/app-store'), { recursive: true });
  for (const [kind, dir] of Object.entries(dirs)) for (const s of SHOTS) {
    const src = join(resolve(dir ?? ''), `${s.screen}.png`);
    if (!dir || !existsSync(src)) throw Error(`NAMED STOP [ASC_SHOT_SOURCE_MISSING] ${src}`);
    render(kind, s.n, s.caption, src);
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log('app-store-shots: 3 iPhone and 3 iPad screenshots written to store/app-store/.');
}
