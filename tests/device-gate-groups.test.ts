// The device gate runs its checks in 5 groups side by side (scripts/device-gate/groups.json, device-gate.yml matrix).
// A check in no group would never run; one in two groups would be judged twice; a group that uploads nothing, a check
// not reached and the store-build smoke check not passed must each fail the merged result, never pass it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIMULATOR_CHECKS, PURCHASE_CHECK } from '../scripts/release-gate.mjs';
import { join, lines, passed, GROUPS, SMOKE } from '../scripts/device-gate/result.mjs';
import { CHECKS } from '../scripts/device-gate/checks';

const groups = Object.entries(GROUPS).filter(([g]) => !g.startsWith('_')) as [string, string[]][];
const ALL = [...SIMULATOR_CHECKS, SMOKE];

test('every Simulator check and the store-build smoke check is in exactly one group; the purchase check in none', () => {
  const seen = groups.flatMap(([, l]) => l);
  for (const c of ALL) assert.equal(seen.filter(x => x === c).length, 1, c);
  assert.equal(seen.length, ALL.length);
  assert.ok(!seen.includes(PURCHASE_CHECK));
  assert.ok(groups.length <= 5, 'the free plan runs 5 macOS jobs at once');
});

test('every grouped check has its code in checks.ts and checks.ts has no check outside the groups', () => {
  assert.deepEqual(Object.keys(CHECKS).sort(), [...ALL].sort());
  const wf = readFileSync('.github/workflows/device-gate.yml', 'utf8');
  for (const [g] of groups) assert.match(wf, new RegExp(`group: \\[[^\\]]*\\b${g}\\b`), `the workflow matrix does not run group ${g}`);
  assert.match(wf, /scripts\/device-gate\/gate\.ts/);
});

const tsv = (rows: [string, string][]) => rows.map(([c, v]) => `${c}\t${v}\tevidence`).join('\n') + '\n';
const allPass = Object.fromEntries(groups.map(([g, l]) => [g, tsv(l.map(c => [c, 'pass']))]));
const files = (skip?: string) => Object.fromEntries(groups.map(([g]) => [g, g === skip ? null : g]));

test('five passing groups join into one passing result with every check and the smoke check', () => {
  const f = files(), r = join(f, g => allPass[g]);
  assert.deepEqual(r.problems, []);
  for (const c of ALL) assert.equal(r.checks[c].result, 'pass', c);
  assert.equal(r.checks[PURCHASE_CHECK].result, 'testflight');
  assert.equal(passed(r, f), true);
});

test('a fail, a not-run, or the smoke check not passing fails the run', () => {
  const f = files();
  for (const [c, v] of [['old-data-upgraded', 'fail'], ['full-disk-changes-nothing', 'not-run'], [SMOKE, 'fail'], [SMOKE, 'not-run'], ['app-switcher-preview-hidden', 'look']] as const) {
    const g = groups.find(([, l]) => l.includes(c))![0];
    const r = join(f, x => x === g ? tsv(GROUPS[g].map((k: string) => [k, k === c ? v : 'pass'])) : allPass[x]);
    assert.equal(passed(r, f), false, `${c} ${v}`);
  }
});

test('a group that uploaded no file, or an empty one, leaves its checks not-run and is a problem', () => {
  let r = join(files('E'), g => allPass[g]);
  assert.ok(r.problems.some(p => p.startsWith('group E')));
  assert.equal(r.checks['full-disk-changes-nothing'].result, 'not-run');
  assert.equal(passed(r, files('E')), false);
  r = join(files(), g => (g === 'C' ? '' : allPass[g]));
  assert.ok(r.problems.some(p => p.includes('group C') && p.includes('no row')));
  assert.equal(r.checks['every-file-hash-matches'].result, 'not-run');
});

test('a row for another group\'s check is ignored, so a group cannot pass a check it does not own', () => {
  const { checks } = join({ A: 'A' }, () => tsv([['old-data-upgraded', 'fail'], ['restore-twice-no-duplicates', 'pass']]));
  assert.equal(checks['restore-twice-no-duplicates'].result, 'not-run');
  assert.equal(checks['old-data-upgraded'].result, 'fail');
});

test('one group\'s job prints only its own checks, so a passing group is never red on the others\' not-run', () => {
  // Gate run 46163383574: group C passed its 3 checks and its job failed on the 8 "not-run" lines of A, B, D and E.
  const one = { C: 'C' };
  const printed = lines(join(one, g => allPass[g]), one);
  const own = GROUPS.C as string[];
  for (const c of own) assert.ok(printed.some(l => l.startsWith('pass') && l.includes(` ${c}: `)), c);
  assert.ok(!printed.some(l => /^(fail|not-run|problem) /.test(l)), printed.join('\n'));
  for (const c of ALL.filter(c => !own.includes(c))) assert.ok(!printed.some(l => l.includes(` ${c}: `)), c);
  assert.equal(passed(join(one, g => allPass[g]), one), true);
  // Its own check not reached still prints, as not-run, and fails the job.
  const half = join(one, () => tsv([[own[0]!, 'pass']]));
  assert.ok(lines(half, one).some(l => l.startsWith('not-run') && l.includes(` ${own[1]}: `)));
  assert.equal(passed(half, one), false);
  // The merge job (all five) prints every check, and a group with no file as a problem.
  const all = files('E');
  const merged = lines(join(all, g => allPass[g]), all);
  for (const c of ALL) assert.ok(merged.some(l => l.includes(` ${c}: `)), c);
  assert.ok(merged.some(l => l.startsWith('problem group E')));
});
