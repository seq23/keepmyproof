// The device gate runs its checks in 5 groups side by side (scripts/device-gate/groups.json, device-gate.yml matrix).
// A check in no group would never run; one in two groups would be judged twice; a group that uploads nothing must fail
// the merged result, never pass it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIMULATOR_CHECKS, PURCHASE_CHECK } from '../scripts/release-gate.mjs';
import { join, GROUPS } from '../scripts/device-gate/result.mjs';

const groups = Object.entries(GROUPS).filter(([g]) => !g.startsWith('_')) as [string, string[]][];

test('every Simulator check is in exactly one group, and the purchase check in none', () => {
  const seen = groups.flatMap(([, l]) => l);
  for (const c of SIMULATOR_CHECKS) assert.equal(seen.filter(x => x === c).length, 1, c);
  assert.equal(seen.length, SIMULATOR_CHECKS.length);
  assert.ok(!seen.includes(PURCHASE_CHECK));
  assert.ok(groups.length <= 5, 'the free plan runs 5 macOS jobs at once');
});

test('run.sh runs each group it is given, and the workflow matrix names every group', () => {
  const sh = readFileSync('scripts/device-gate/run.sh', 'utf8');
  for (const [g] of groups) assert.match(sh, new RegExp(`^\\s+${g}\\) `, 'm'), `run.sh has no case for group ${g}`);
  const fns: Record<string, string> = { 'old-data-upgraded': 'c_old', 'passcode-reset-face-id-and-phrase': 'c_reset', 'full-test-vault-backed-up': 'c_backup',
    'fresh-install-restore-with-phrase-only': 'c_fresh', 'every-file-hash-matches': 'c_fresh', 'corrupt-or-missing-file-rejected': 'c_bad',
    'wrong-phrase-changes-nothing': 'c_bad', 'restore-twice-no-duplicates': 'c_twice', 'full-disk-changes-nothing': 'c_full',
    'interrupted-restore-changes-nothing': 'c_cut', 'app-switcher-preview-hidden': 'c_switch' };
  for (const [g, list] of groups) {
    const line = sh.split('\n').find(l => new RegExp(`^\\s+${g}\\) `).test(l))!;
    for (const c of list) assert.ok(line.includes(fns[c]), `group ${g} does not run ${fns[c]} for ${c}`);
  }
});

const tsv = (rows: [string, string][]) => rows.map(([c, v]) => `${c}\t${v}\tevidence`).join('\n') + '\n';
const allPass = Object.fromEntries(groups.map(([g, l]) => [g, tsv(l.map(c => [c, c === 'app-switcher-preview-hidden' ? 'look' : 'pass']))]));
const files = (skip?: string) => Object.fromEntries(groups.map(([g]) => [g, g === skip ? null : g]));

test('five passing groups join into one result with every check', () => {
  const { checks, problems } = join(files(), g => allPass[g]);
  assert.deepEqual(problems, []);
  for (const c of SIMULATOR_CHECKS) assert.ok(['pass', 'look'].includes(checks[c].result), c);
  assert.equal(checks[PURCHASE_CHECK].result, 'testflight');
});

test('a group that uploaded no file, or an empty one, leaves its checks not-run and is a problem', () => {
  let r = join(files('E'), g => allPass[g]);
  assert.ok(r.problems.some(p => p.startsWith('group E')));
  assert.equal(r.checks['full-disk-changes-nothing'].result, 'not-run');
  r = join(files(), g => (g === 'C' ? '' : allPass[g]));
  assert.ok(r.problems.some(p => p.includes('group C') && p.includes('no row')));
  assert.equal(r.checks['every-file-hash-matches'].result, 'not-run');
});

test('a row for another group\'s check is ignored, so a group cannot pass a check it does not own', () => {
  const { checks } = join({ A: 'A' }, () => tsv([['old-data-upgraded', 'fail'], ['restore-twice-no-duplicates', 'pass']]));
  assert.equal(checks['restore-twice-no-duplicates'].result, 'not-run');
  assert.equal(checks['old-data-upgraded'].result, 'fail');
});
