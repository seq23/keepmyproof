// Writes release/device-gate.json from a device gate run's result.json (scripts/device-gate/run.sh), only when every
// check passed. app-switcher-preview-hidden is the one check a person judges from the run's snapshot images: it
// is recorded only with --switcher-seen "<who looked, and what they saw>". Usage:
//   node scripts/device-gate/record.mjs <result.json> <run url> [--switcher-seen "<note>"]
import { readFileSync, writeFileSync } from 'node:fs';
import { DEVICE_CHECKS } from '../release-gate.mjs';

/** @param {any} result @param {{ run: string, version: string | undefined, seen?: string }} o */
export function record(result, { run, version, seen }) {
  const missing = [];
  const checks = {}, evidence = {};
  for (const c of DEVICE_CHECKS) {
    const r = result.checks?.[c];
    const ok = r?.result === 'pass' || (c === 'app-switcher-preview-hidden' && r?.result === 'look' && !!seen);
    if (!ok) missing.push(`${c}: ${r?.result ?? 'absent'}`);
    checks[c] = ok; evidence[c] = c === 'app-switcher-preview-hidden' && seen ? `${r?.evidence ?? ''} Seen: ${seen}` : r?.evidence ?? '';
  }
  if (missing.length) throw Error(`NAMED STOP [DEVICE_GATE_NOT_PASSED] ${missing.join('; ')}`);
  if (!result.device || !/simulator|iphone|ipad/i.test(result.device)) throw Error('NAMED STOP [DEVICE_UNNAMED] the run does not say which device it ran on');
  return { version, device: result.device, run, commit: result.commit, checks, evidence };
}
if (process.argv[1] === import.meta.filename) {
  const [file, run] = process.argv.slice(2), i = process.argv.indexOf('--switcher-seen');
  const version = /version:\s*'([^']+)'/.exec(readFileSync('app.config.ts', 'utf8'))?.[1];
  const out = record(JSON.parse(readFileSync(file, 'utf8')), { run, version, seen: i > 0 ? process.argv[i + 1] : undefined });
  writeFileSync('release/device-gate.json', JSON.stringify(out, null, 2) + '\n');
  console.log(`release/device-gate.json: ${Object.keys(out.checks).length} checks recorded for ${version} on ${out.device}`);
}
