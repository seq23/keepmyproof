// GOOGLE PLAY STORE ART (Mac, local; nothing is sent anywhere). Renders, with the local Google Chrome:
//   assets/app/adaptive-icon.png   1024 x 1024, transparent: the brass seal inside Android's safe zone
//                                  (background colour is app.config.ts android.adaptiveIcon.backgroundColor)
//   store/play/icon-512.png        512 x 512 Play listing icon (the 1024 app icon, shrunk)
//   store/play/feature-graphic.png 1024 x 500 in the brand
//   store/play/phone-NN.png        1080 x 1920, from the approved App Store iPhone screenshots
//                                  (1320 x 2868, downloaded from App Store Connect), cropped to 9:16; the
//                                  passcode shot says "fingerprint", as the Android app does (src/core/bio.ts)
//   node scripts/store/play-assets.mjs <dir with the iPhone screenshots 01.png 02.png 03.png>
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '../..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = mkdtempSync(join(tmpdir(), 'kmp-play-'));
const font = (f) => `url(file://${ROOT}/assets/site/${f})`;
const FONTS = `@font-face{font-family:Serif;font-weight:700;src:${font('noto-serif-700.woff2')}}@font-face{font-family:Sans;src:${font('noto-sans.woff2')}}`;
const SEAL = `<circle cx="28" cy="28" r="17" fill="none" stroke="#D9A441" stroke-width="5"/><circle cx="28" cy="24.5" r="4.6" fill="#D9A441"/><path d="M25.4 27 h5.2 l1.6 9 h-8.4 z" fill="#D9A441"/>`;

function shot(name, w, h, body, { transparent = false } = {}) {
  const html = join(tmp, `${name}.html`), out = join(tmp, `${name}.png`);
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${FONTS}*{margin:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden;${transparent ? 'background:transparent' : ''}}</style>${body}`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${w},${h}`,
    ...(transparent ? ['--default-background-color=00000000'] : []), `--screenshot=${out}`, `file://${html}`], { stdio: 'ignore' });
  return out;
}
/** Play wants opaque images: a JPEG round trip through sips drops the alpha channel. */
function opaque(src, dest) {
  const jpg = join(tmp, 'flat.jpg');
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', src, '--out', jpg], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', dest], { stdio: 'ignore' });
}

const shotsDir = process.argv[2];
mkdirSync(join(ROOT, 'store/play'), { recursive: true });

// Adaptive icon foreground: the seal at 46% of the canvas (about 69% of the visible 72/108 icon), well inside the 66/108 safe circle.
const fg = shot('adaptive', 1024, 1024, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="1024" height="1024"><g transform="translate(28 28) scale(0.66) translate(-28 -28)">${SEAL}</g></svg>`, { transparent: true });
execFileSync('cp', [fg, join(ROOT, 'assets/app/adaptive-icon.png')]);

execFileSync('sips', ['-z', '512', '512', join(ROOT, 'assets/app/icon.png'), '--out', join(ROOT, 'store/play/icon-512.png')], { stdio: 'ignore' });

const fgr = shot('feature', 1024, 500, `<div style="width:1024px;height:500px;background:#0B6E4F;display:flex;align-items:center;gap:56px;padding:0 84px">
<svg viewBox="0 0 56 56" width="232" height="232" style="flex:none"><rect width="56" height="56" rx="13" fill="#0A5F44"/>${SEAL}</svg>
<div style="color:#F3F4F1"><div style="font:700 70px/1.05 Serif">KeepMy<span style="color:#D9A441">Proof</span></div>
<div style="font:400 34px/1.3 Sans;margin-top:22px;max-width:560px;text-wrap:balance">A private vault for your photos and papers.</div>
<div style="font:400 24px/1.3 Sans;margin-top:18px;opacity:.85">No account. Free for your first 25 items.</div></div></div>`);
opaque(fgr, join(ROOT, 'store/play/feature-graphic.png'));

if (!shotsDir) { console.log('play-assets: icons and feature graphic written; pass the iPhone screenshot dir for phone shots.'); process.exit(0); }
// iPhone 1320 wide -> 1080 wide (scale 0.818); keep the top 1920 px (caption and the top of the screen).
// Shot 2's small print names the iPhone's Face ID; on Android the app says fingerprint, so that line is re-set.
const FIX = { '02': `<div style="position:absolute;left:86px;top:1294px;width:898px;height:160px;padding-left:9px;padding-top:6px;background:#F3F4F1;font:400 29.5px/1.5 Sans;color:#4A5053">After a few wrong guesses the app makes you wait, longer each time. It never erases your papers. Forgot the passcode? You can set a new one with fingerprint or your recovery phrase.</div>` };
for (const n of ['01', '02', '03']) {
  const src = join(resolve(shotsDir), `${n}.png`);
  if (!existsSync(src)) throw Error(`NAMED STOP [PLAY_SHOT_SOURCE_MISSING] ${src}`);
  const out = shot(`phone-${n}`, 1080, 1920, `<div style="position:relative;width:1080px;height:1920px;overflow:hidden;background:#F3F4F1"><img src="file://${src}" style="width:1080px;display:block">${FIX[n] ?? ''}</div>`);
  opaque(out, join(ROOT, `store/play/phone-${n}.png`));
}
rmSync(tmp, { recursive: true, force: true });
console.log('play-assets: adaptive icon, 512 icon, feature graphic and 3 phone screenshots written.');
