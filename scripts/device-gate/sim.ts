// THE DEVICE GATE's Simulator hands (scripts/device-gate/gate.ts): install, wipe, the app's container, Face ID, video.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BID = 'com.keepmyproof.app';
/** A harness or system problem (a tap that cannot be made clear, a Simulator that does not answer): the check is
 *  not-run with this reason, never passed and never called an app failure. */
export class TestError extends Error { readonly kind = 'test'; }
/** The app did the wrong thing: the check fails. */
export class AppFail extends Error { readonly kind = 'app'; }

export function run(cmd: string, args: string[], { timeout = 120_000, input }: { timeout?: number; input?: string } = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout, input, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status ?? -1, out: r.stdout ?? '', err: (r.stderr ?? '') + (r.error ? String(r.error) : '') };
}
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class Sim {
  constructor(readonly udid: string, private log: (s: string) => void = () => {}) {}
  simctl(args: string[], ok = true, timeout = 120_000) {
    const r = run('xcrun', ['simctl', ...args], { timeout });
    if (ok && r.status !== 0) throw new TestError(`simctl ${args[0]} failed (${r.status}): ${(r.err || r.out).trim().slice(0, 300)}`);
    return r;
  }
  terminate() { this.simctl(['terminate', this.udid, BID], false); }
  launch() { this.simctl(['launch', this.udid, BID]); }
  /** A clean app state: the app deleted, the Simulator's Keychain emptied, the given build installed. */
  freshInstall(app: string) {
    this.terminate(); this.simctl(['uninstall', this.udid, BID], false);
    this.simctl(['keychain', this.udid, 'reset']);
    this.install(app);
  }
  /** The Simulator's unified log for the last `secs` seconds about the app (its own lines and the system's lines naming
   *  it: launches, terminations and their reasons), written to `file`; never fails the try. */
  deviceLog(file: string, secs: number) {
    const r = spawnSync('xcrun', ['simctl', 'spawn', this.udid, 'log', 'show', '--style', 'compact', '--last', `${secs}s`, '--predicate',
      `process == "KeepMyProof" OR eventMessage CONTAINS[c] "${BID}" OR eventMessage CONTAINS "KeepMyProof"`],
      { encoding: 'utf8', timeout: 120_000, maxBuffer: 64 * 1024 * 1024 });
    try { writeFileSync(file, (r.stdout || '') + (r.stderr ? `\n[stderr] ${r.stderr}` : '')); } catch { /* evidence only */ }
  }
  install(app: string) { if (!existsSync(app)) throw new TestError(`no app at ${app}`); this.simctl(['install', this.udid, app]); }
  container(): string {
    const r = this.simctl(['get_app_container', this.udid, BID, 'data']);
    const c = r.out.trim(); if (!c || !existsSync(c)) throw new TestError('the app has no data container');
    return c;
  }
  /** Documents/kmp-gate: the gate build's seam folder (src/gate.ts). */
  gateDir(...sub: string[]) { const d = join(this.container(), 'Documents', 'kmp-gate', ...sub); mkdirSync(d, { recursive: true }); return d; }
  /** Face ID enrolled (or not) on this Simulator, as Features › Face ID › Enrolled does. */
  enrollFaceId(on: boolean) {
    this.simctl(['spawn', this.udid, 'notifyutil', '-s', 'com.apple.BiometricKit.enrollmentChanged', on ? '1' : '0']);
    this.simctl(['spawn', this.udid, 'notifyutil', '-p', 'com.apple.BiometricKit.enrollmentChanged']);
  }
  face(match: boolean) { this.simctl(['spawn', this.udid, 'notifyutil', '-p', `com.apple.BiometricKit_Sim.pearl.${match ? 'match' : 'nomatch'}`]); }
  openOther(bundle = 'com.apple.Preferences') { this.simctl(['launch', this.udid, bundle]); }
  screenshot(file: string) { this.simctl(['io', this.udid, 'screenshot', file], false); }
  /** Screen video of one check attempt; stop() finishes the file. */
  record(file: string): { stop(): Promise<void> } {
    const p: ChildProcess = spawn('xcrun', ['simctl', 'io', this.udid, 'recordVideo', '--codec=h264', '--force', file], { stdio: 'ignore' });
    return { stop: async () => {
      if (p.exitCode !== null) return;
      p.kill('SIGINT');
      await Promise.race([new Promise(r => p.once('exit', r)), sleep(15_000)]);
      if (p.exitCode === null) { p.kill('SIGKILL'); this.log(`video ${file}: recorder did not finish in 15 s`); }
    } };
  }
}
