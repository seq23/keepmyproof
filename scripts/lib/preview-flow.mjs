// The simulator preview's screen list, read from the Maestro flow (.maestro/preview.yaml), and the
// app's own screens, read from the `type Screen` union in app/index.tsx. One parser for both the
// validator (scripts/validate.mjs, check "preview-screens") and the CI screenshot check
// (scripts/preview/shots.mjs), so the two can never disagree about what "every screen" means.
//   takeScreenshot: NN-<screen>[--<variant>]     one PNG per step, in flow order
//   # not-shown: <screen> — <reason>            a screen the preview cannot reach, with the reason
export const FLOW = '.maestro/preview.yaml';
export const APP = 'app/index.tsx';

export function appScreens(src) {
  const union = /type Screen\s*=\s*([^;]+);/.exec(src)?.[1] ?? '';
  return [...union.matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]);
}

export function flowShots(yaml) {
  const shots = [...yaml.matchAll(/^\s*-\s*takeScreenshot:\s*["']?([^\s"']+)["']?\s*$/gm)].map(m => m[1]);
  const notShown = [...yaml.matchAll(/^#\s*not-shown:\s*([A-Za-z]+)\s*[—-]+\s*(.*)$/gm)].map(m => ({ screen: m[1], reason: m[2].trim() }));
  return { shots, notShown };
}

export const screenOf = name => /^\d{2}-([A-Za-z]+)(?:--[a-z0-9-]+)?$/.exec(name)?.[1] ?? null;

/** Every way the flow and the app have drifted apart; [] = in step. */
export function drift(src, yaml) {
  const screens = appScreens(src), { shots, notShown } = flowShots(yaml), out = [];
  if (!screens.length) return ['NO_APP_SCREENS: no `type Screen` union in ' + APP];
  if (!shots.length) return ['NO_PREVIEW_SHOTS: no takeScreenshot step in ' + FLOW];
  const shown = new Set();
  shots.forEach((name, i) => {
    const s = screenOf(name);
    if (!s || !screens.includes(s)) out.push(`PREVIEW_SHOT_UNKNOWN ${name}: not NN-<screen> for a screen in ${APP}`);
    else shown.add(s);
    if (!name.startsWith(String(i + 1).padStart(2, '0') + '-')) out.push(`PREVIEW_SHOT_ORDER ${name}: step ${i + 1} must be numbered ${String(i + 1).padStart(2, '0')}`);
  });
  for (const n of notShown) if (!screens.includes(n.screen) || !n.reason) out.push(`PREVIEW_NOT_SHOWN_INVALID ${n.screen}`);
  const excused = new Set(notShown.map(n => n.screen));
  for (const s of screens) if (!shown.has(s) && !excused.has(s)) out.push(`PREVIEW_SCREEN_MISSING ${s}: add a takeScreenshot step to ${FLOW}`);
  return out;
}
