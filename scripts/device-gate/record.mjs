// Writes release/device-gate.json. Two steps, each refusing anything short of a pass:
// 1. From a device gate run's result.json (scripts/device-gate/run.sh), only when every Simulator check passed.
//    app-switcher-preview-hidden is the one check a person judges from the run's snapshot images: it is recorded
//    only with --switcher-seen "<who looked, and what they saw>". The purchase check stays false (a Simulator
//    cannot buy), which is enough for a TestFlight upload and never for a submission.
//      node scripts/device-gate/record.mjs <result.json> <run url> --switcher-seen "<note>"
// 2. Her TestFlight sandbox Buy + Restore on a real iPhone (her yes, 27 Nov 2026), on the build that will be submitted:
//      node scripts/device-gate/record.mjs --purchase --build <n> --date <YYYY-MM-DD> --by "<who tapped>" --restored
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { DEVICE_CHECKS, SIMULATOR_CHECKS, PURCHASE_CHECK, purchaseProblems } from '../release-gate.mjs';

/** @param {any} result @param {{ run: string, version: string | undefined, seen?: string }} o */
export function record(result, { run, version, seen }) {
  const missing = [];
  const checks = {}, evidence = {};
  for (const c of SIMULATOR_CHECKS) {
    const r = result.checks?.[c];
    const ok = r?.result === 'pass' || (c === 'app-switcher-preview-hidden' && r?.result === 'look' && !!seen);
    if (!ok) missing.push(`${c}: ${r?.result ?? 'absent'}`);
    checks[c] = ok; evidence[c] = c === 'app-switcher-preview-hidden' && seen ? `${r?.evidence ?? ''} Seen: ${seen}` : r?.evidence ?? '';
  }
  if (missing.length) throw Error(`NAMED STOP [DEVICE_GATE_NOT_PASSED] ${missing.join('; ')}`);
  if (!result.device || !/simulator|iphone|ipad/i.test(result.device)) throw Error('NAMED STOP [DEVICE_UNNAMED] the run does not say which device it ran on');
  if (!version) throw Error('NAMED STOP [VERSION_UNREADABLE] no app version to record against');
  checks[PURCHASE_CHECK] = false;
  evidence[PURCHASE_CHECK] = 'Pending: a TestFlight sandbox Buy + Restore on a real iPhone (record.mjs --purchase).';
  return { version, device: result.device, run, commit: result.commit, checks, evidence };
}

/** Adds her TestFlight Buy + Restore to a Simulator record of the same version. @param {any} existing */
export function recordPurchase(existing, { build, date, by, restored, version, now = Date.now() }) {
  if (!existing || existing.version !== version || SIMULATOR_CHECKS.some(c => existing.checks?.[c] !== true))
    throw Error(`NAMED STOP [SIMULATOR_GATE_NOT_RECORDED] release/device-gate.json has no passing Simulator record for ${version}; record the device gate run first.`);
  const purchase = { build: String(build ?? ''), date, tappedBy: by, restored: restored === true, how: 'TestFlight build, Apple sandbox account, real iPhone' };
  const why = purchaseProblems(purchase, { build: purchase.build, now });
  if (why.length) throw Error(`NAMED STOP [PURCHASE_NOT_RECORDED] ${why.join('; ')}`);
  return { ...existing, checks: { ...existing.checks, [PURCHASE_CHECK]: true },
    evidence: { ...existing.evidence, [PURCHASE_CHECK]: `Bought Plus and restored it in TestFlight build ${purchase.build} on ${date} (${by}).` }, purchase };
}

if (process.argv[1] === import.meta.filename) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const version = /version:\s*'([^']+)'/.exec(readFileSync('app.config.ts', 'utf8'))?.[1];
  const file = 'release/device-gate.json';
  let out;
  if (process.argv.includes('--purchase')) {
    const existing = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
    out = recordPurchase(existing, { build: arg('--build'), date: arg('--date'), by: arg('--by'), restored: process.argv.includes('--restored'), version });
  } else {
    const [res, run] = process.argv.slice(2);
    out = record(JSON.parse(readFileSync(res, 'utf8')), { run, version, seen: arg('--switcher-seen') });
  }
  writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  const passed = DEVICE_CHECKS.filter(c => out.checks[c] === true).length;
  console.log(`${file}: ${passed} of ${DEVICE_CHECKS.length} checks passed for ${version} on ${out.device}${out.purchase ? `; TestFlight Buy + Restore on build ${out.purchase.build}` : '; the TestFlight Buy + Restore is still to come (submit waits for it)'}`);
}
