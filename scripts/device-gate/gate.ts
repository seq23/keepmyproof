// THE DEVICE GATE on an iOS Simulator (.github/workflows/device-gate.yml, docs/device-gate.md): runs checks of
// scripts/device-gate/checks.ts and writes <out>/checks.tsv (check, result, evidence) for result.mjs.
//   tsx scripts/device-gate/gate.ts --udid <udid> --gate-app <gate .app> --store-app <store .app> --out <dir>
//        (--group <A-E> | --checks <a,b>) [--expect-fail]
// Each check runs on a clean app state of its own, with a screen video, the last screen tree and a screenshot saved per
// try under <out>/evidence/<check>/try-<n>/. Every check runs to its end whatever another check did.
// Results: pass | fail | not-run. not-run = the harness or the Simulator could not do its part (never a pass).
// A failure is tried again on a clean state: failing twice is a SUSPECTED APP BUG (see decide()).
// --expect-fail (mutation proof, scripts/device-gate/mutations/): the app was broken on purpose for these checks, and
// the run exits 0 only if every one of them FAILS (not-run is not a red the mutation caused).
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { run, Sim } from './sim';
import { Ui } from './ui';
import { CHECKS, type Ctx, type Fixture } from './checks';
import { makeFixture, type Manifest } from './vault-fixture';

export type Result = 'pass' | 'fail' | 'not-run';
export interface Attempt { result: Result; why: string }
/** What a check's tries add up to, or 'again' for one more try on a clean state.
 *  - a pass with no app failure before it: pass (a not-run before it was the harness, not the app);
 *  - an app failure: tried again; the same failure twice = fail, a SUSPECTED APP BUG; a pass after an app failure is
 *    still a fail (the app did the wrong thing once: unstable);
 *  - not-run: tried again, up to 3 tries; never a pass. */
export function decide(tries: Attempt[], max = 3): { result: Result | 'again'; why: string } {
  const fails = tries.filter(t => t.result === 'fail'), last = tries[tries.length - 1];
  if (!last) return { result: 'again', why: '' };
  if (last.result === 'pass') return fails.length
    ? { result: 'fail', why: `SUSPECTED APP BUG (unstable): failed on a clean state, then passed: ${fails.map(f => f.why).join(' | ')}` }
    : { result: 'pass', why: last.why };
  if (fails.length >= 2) return { result: 'fail', why: fails[0]!.why === fails[1]!.why
    ? `SUSPECTED APP BUG: failed twice the same way on a clean state: ${fails[0]!.why}`
    : `SUSPECTED APP BUG: failed twice on a clean state: ${fails.map(f => f.why).join(' | ')}` };
  if (tries.length >= max) return fails.length ? { result: 'fail', why: `failed once (${fails[0]!.why}); other tries not-run: ${tries.filter(t => t.result === 'not-run').map(t => t.why).join(' | ')}` }
    : { result: 'not-run', why: `test error on all ${tries.length} tries: ${tries.map(t => t.why).join(' | ')}` };
  return { result: 'again', why: '' };
}

function main() {
  const arg = (n: string) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
  const out = resolve(arg('--out') ?? 'gate-out'), udid = arg('--udid'), gateApp = arg('--gate-app'), storeApp = arg('--store-app');
  if (!udid || !gateApp || !storeApp) { console.log('NAMED STOP [GATE_USAGE] --udid, --gate-app and --store-app are needed'); process.exit(2); }
  const groups = JSON.parse(readFileSync(join(__dirname, 'groups.json'), 'utf8')) as Record<string, string[]>;
  const names = arg('--checks')?.split(',') ?? groups[arg('--group') ?? ''] ?? [];
  const unknown = names.filter(n => !CHECKS[n]);
  if (!names.length || unknown.length) { console.log(`NAMED STOP [GATE_UNKNOWN_CHECK] ${unknown.join(', ') || 'no check named'}`); process.exit(2); }
  mkdirSync(out, { recursive: true });
  const logFile = join(out, 'gate.log'), tsv = join(out, 'checks.tsv'); writeFileSync(tsv, '');
  const log = (s: string) => { const line = `${new Date().toISOString().slice(11, 19)} ${s}`; console.log(line); appendFileSync(logFile, line + '\n'); };
  if (run('xcrun', ['simctl', 'list', 'devices', udid]).out.indexOf('Booted') < 0) { console.log(`NAMED STOP [GATE_NO_SIMULATOR] ${udid} is not a booted Simulator`); process.exit(2); }
  // Vision OCR (the app-switcher check), compiled once.
  const ocr = join(out, 'ocr');
  const built = run('swiftc', ['-O', join(__dirname, 'ocr.swift'), '-o', ocr], { timeout: 300_000 });
  if (built.status !== 0) log(`OCR did not build: ${built.err.slice(0, 300)}`);
  const old: Fixture = { dir: join(__dirname, 'fixtures', 'old-b0531f3'), m: JSON.parse(readFileSync(join(__dirname, 'fixtures', 'old-b0531f3', 'manifest.json'), 'utf8')) as Manifest };
  const sim = new Sim(udid, log);
  (async () => {
    const cur: Fixture = { dir: join(out, 'fixture'), m: await makeFixture(join(out, 'fixture')) };
    const final: Record<string, { result: Result; why: string }> = {};
    for (const name of names) {
      const tries: Attempt[] = [];
      let d = decide(tries);
      while (d.result === 'again') {
        const n = tries.length + 1, work = join(out, 'evidence', name, `try-${n}`); mkdirSync(work, { recursive: true });
        log(`── ${name}, try ${n}`);
        const ui = new Ui(sim, join(work, 'flows'), log);
        const video = sim.record(join(work, 'screen.mp4')), started = Date.now();
        const ctx: Ctx = { sim, ui, gateApp: resolve(gateApp), storeApp: resolve(storeApp), work, cur, old, log, ocr };
        let a: Attempt;
        try { a = { result: 'pass', why: CHECKS[name]!(ctx) }; }
        catch (e) {
          const err = e as Error & { kind?: string };
          a = { result: err.kind === 'app' ? 'fail' : 'not-run', why: `${err.kind === 'app' ? '' : 'test error: '}${err.message}` };
          if (!err.kind) log(String(err.stack));
        }
        ui.saveTree(join(work, 'final-tree.json')); sim.screenshot(join(work, 'final.png'));
        // A crash of the app during the try is an app failure, whatever the check was doing (gate run 46181196558: the
        // store build left Home for the springboard 2 s after unlocking, and the check could only say "no tab bar").
        // The phone's own log of the app and of who ended it (runningboardd, SpringBoard): a kill with no crash report
        // (gate run 46183295834: the store build opened Files and then was gone, no .ips) is read here.
        sim.deviceLog(join(work, 'device.log'), Math.ceil((Date.now() - started) / 1000) + 5);
        const crashes = crashReports(started);
        crashes.forEach((f, k) => copyFileSync(f, join(work, `crash-${k + 1}.ips`)));
        if (crashes.length) { const head = crashSummary(crashes[0]!); log(`the app crashed: ${head}`); if (a.result !== 'fail') a = { result: 'fail', why: `the app crashed (crash-1.ips): ${head}; the check had said: ${a.why}` }; }
        await video.stop();
        log(`${name}, try ${n}: ${a.result} — ${a.why}`);
        tries.push(a); d = decide(tries);
      }
      final[name] = { result: d.result as Result, why: `${d.why} (tries: ${tries.map(t => t.result).join(', ')}; evidence/${name}/)` };
      appendFileSync(tsv, `${name}\t${final[name]!.result}\t${final[name]!.why.replace(/[\t\n]/g, ' ')}\n`);
    }
    for (const [name, r] of Object.entries(final)) console.log(`${r.result.padEnd(7)} ${name}: ${r.why}`);
    if (process.argv.includes('--expect-fail')) {
      const notRed = Object.entries(final).filter(([, r]) => r.result !== 'fail');
      console.log(notRed.length ? `MUTATION NOT CAUGHT: ${notRed.map(([n, r]) => `${n} ${r.result}`).join(', ')}` : `MUTATION CAUGHT: ${names.join(', ')} failed`);
      process.exit(notRed.length ? 1 : 0);
    }
    process.exit(Object.values(final).every(r => r.result === 'pass') ? 0 : 1);
  })().catch(e => { console.log(`NAMED STOP [GATE_CRASHED] ${(e as Error).stack}`); process.exit(2); });
}
/** KeepMyProof crash reports macOS wrote for the Simulator since `since` (~/Library/Logs/DiagnosticReports). */
export function crashReports(since: number, dir = join(homedir(), 'Library', 'Logs', 'DiagnosticReports')): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => /^KeepMyProof.*\.(ips|crash)$/i.test(f)).map(f => join(dir, f)).filter(f => statSync(f).mtimeMs >= since - 1000);
}
/** One line from a crash report: the exception and the first frames of the crashed thread. */
export function crashSummary(file: string): string {
  const raw = readFileSync(file, 'utf8'), nl = raw.indexOf('\n');
  try {
    const b = JSON.parse(raw.slice(nl + 1)) as { exception?: { type?: string; signal?: string }; asi?: Record<string, string[]>; termination?: { indicator?: string };
      faultingThread?: number; threads?: { frames?: { symbol?: string; imageIndex?: number }[] }[]; usedImages?: { name?: string }[] };
    const fr = (b.threads?.[b.faultingThread ?? 0]?.frames ?? []).slice(0, 6).map(f => f.symbol ?? b.usedImages?.[f.imageIndex ?? -1]?.name ?? '?');
    return [b.exception?.type, b.exception?.signal, b.termination?.indicator, Object.values(b.asi ?? {}).flat().join(' ').slice(0, 300), fr.join(' < ')].filter(Boolean).join(' | ');
  } catch { return raw.slice(0, 300).replace(/\s+/g, ' '); }
}
if (process.argv[1]?.endsWith('gate.ts')) main();
