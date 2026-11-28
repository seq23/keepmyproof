// THE DEVICE GATE's result (scripts/device-gate/run.sh, .github/workflows/device-gate.yml): joins the checks.tsv of
// each group that ran into result.json. A check whose group did not run, or whose group's file is missing or holds no
// row for it, is "not-run", and not-run is never a pass. The purchase check is always "testflight" (her TestFlight
// Buy + Restore, record.mjs --purchase).
// Usage: node result.mjs <out result.json> <group>=<checks.tsv> ...  Only the named groups are judged (one group's job
// names its own; the merge job names all five, so a group that uploaded nothing fails the run). Exit 1 when a named
// group's check is not "pass"/"look"/"testflight", or a named group's file is missing or empty.
import fs from 'node:fs';
import { DEVICE_CHECKS, PURCHASE_CHECK } from '../release-gate.mjs';

export const GROUPS = JSON.parse(fs.readFileSync(new URL('./groups.json', import.meta.url), 'utf8'));
const PURCHASE_WHY = 'a Simulator cannot buy (RevenueCat refuses its Test Store key in a Release build; Apple\'s sandbox sign-in fails on the iOS 26 Simulator): met by her TestFlight Buy + Restore on a real iPhone';

/** files: { A: 'path/checks.tsv' | null, ... } → { checks, problems } */
export function join(files, read = p => fs.readFileSync(p, 'utf8')) {
  const checks = {}; const problems = [];
  for (const [g, list] of Object.entries(GROUPS)) {
    if (g.startsWith('_')) continue;
    let rows = {};
    if (!(g in files)) { for (const c of list) checks[c] = { result: 'not-run', evidence: `group ${g} was not run here`, group: g }; continue; }
    const p = files[g];
    if (!p) problems.push(`group ${g}: no checks.tsv (did not run or uploaded nothing)`);
    else {
      let text = ''; try { text = read(p); } catch { problems.push(`group ${g}: ${p} unreadable`); }
      for (const l of text.split('\n').filter(Boolean)) { const [c, v, e] = l.split('\t'); if (list.includes(c)) rows[c] = { result: v, evidence: e, group: g }; }
      if (p && Object.keys(rows).length === 0) problems.push(`group ${g}: checks.tsv holds no row`);
    }
    for (const c of list) checks[c] = rows[c] ?? { result: 'not-run', evidence: `group ${g} never reached it`, group: g };
  }
  checks[PURCHASE_CHECK] = { result: 'testflight', evidence: PURCHASE_WHY };
  const ordered = Object.fromEntries(DEVICE_CHECKS.map(c => [c, checks[c] ?? { result: 'not-run', evidence: 'in no group' }]));
  return { checks: ordered, problems };
}

/** The lines a run prints: only the checks of the groups it was given (plus the purchase line), so one group's job
 *  shows its own checks, never the other groups' "not-run" (gate run 46163383574: group C passed its 3 checks and its
 *  job still went red on the 8 "not-run" lines of groups it does not run). The merge job gives all five groups. */
export function lines({ checks, problems }, files) {
  const shown = Object.entries(checks).filter(([, r]) => !r.group || r.group in files);
  return [...shown.map(([c, r]) => `${r.result.padEnd(7)} ${c}: ${r.evidence}`), ...problems.map(p => `problem ${p}`)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [out, ...pairs] = process.argv.slice(2);
  const files = Object.fromEntries(pairs.map(s => { const i = s.indexOf('='); return [s.slice(0, i), fs.existsSync(s.slice(i + 1)) ? s.slice(i + 1) : null]; }));
  const { checks, problems } = join(files);
  fs.writeFileSync(out, JSON.stringify({ commit: process.env.GITHUB_SHA ?? 'local', device: process.env.GATE_DEVICE, checks }, null, 2));
  for (const l of lines({ checks, problems }, files)) console.log(l);
  const bad = Object.values(checks).some(r => r.group in files && !['pass', 'look', 'testflight'].includes(r.result));
  process.exit(bad || problems.length ? 1 : 0);
}
