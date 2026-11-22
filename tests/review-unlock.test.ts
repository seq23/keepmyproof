// Google Play review code (site/server/review.mjs + src/billing/review.ts): how it breaks, each case proven.
// The server runs against a real SQLite database built from site/migrations (a D1 stand-in) and a fake RevenueCat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { LIMITS, reviewStatus, reviewUnlock } from '../site/server/review.mjs';
import { redeemReviewCode, reviewWindowOpen, REVIEW_URL } from '../src/billing/review';

const CODE = '4815162342', NOW = Date.parse('2026-12-01T12:00:00Z'), DAY = 86_400_000;
const anon = (n: number) => `$RCAnonymousID:${n.toString(16).padStart(32, '0')}`;

/** D1's prepare/bind/first/run/all over node:sqlite, with the repo's own migrations applied. */
function d1() {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync('site/migrations').sort()) db.exec(readFileSync(`site/migrations/${f}`, 'utf8'));
  let down = false;
  const api = {
    raw: db, fail(on: boolean) { down = on; },
    prepare(sql: string) {
      let args: unknown[] = [];
      const guard = () => { if (down) throw Error('D1_DOWN'); };
      const stmt = { bind(...a: unknown[]) { args = a; return stmt; },
        async first() { guard(); return db.prepare(sql).get(...(args as never[])) ?? null; },
        async run() { guard(); db.prepare(sql).run(...(args as never[])); return { success: true }; },
        async all() { guard(); return { results: db.prepare(sql).all(...(args as never[])) }; } };
      return stmt;
    },
  };
  return api;
}

/** A fake RevenueCat v2: known customers, their real purchases, granted entitlements; can fail on demand. */
function revenuecat() {
  const known = new Set<string>(), granted = new Map<string, number>(), purchases = new Map<string, string>();
  const calls: string[] = [];
  let mode: 'ok' | '5xx' | 'timeout' | '403' = 'ok', openLoops = 0;
  const fetcher = (async (url: string, init: RequestInit = {}) => {
    if (url.includes('open-loops/intake')) { openLoops++; return new Response('{}', { status: 201 }); }
    calls.push(`${init.method ?? 'GET'} ${url.replace(/^.*\/customers\//, '')}`);
    const id = decodeURIComponent(url.split('/customers/')[1]!.split('/')[0]!);
    if (url.endsWith('/actions/revoke_granted_entitlement')) { granted.delete(id); return new Response('{}', { status: 200 }); }
    if (mode === 'timeout' && url.endsWith('/grant_entitlement')) { granted.set(id, NOW + 1); throw Error('TimeoutError'); }
    if (mode === '5xx' && url.endsWith('/grant_entitlement')) return new Response('{}', { status: 502 });
    if (mode === '403' && url.endsWith('/grant_entitlement')) return new Response('{}', { status: 403 });
    if (!url.includes('/actions/')) return new Response('{}', { status: known.has(id) ? 200 : 404 });
    const body = JSON.parse(String(init.body)); granted.set(id, body.expires_at);
    return new Response('{}', { status: 201 });
  }) as unknown as typeof fetch;
  return { known, granted, purchases, calls, fetcher, set(m: typeof mode) { mode = m; }, get openLoops() { return openLoops; } };
}

function env(db = d1(), over: Record<string, unknown> = {}) {
  return { REVIEW_CODE: CODE, REVIEW_CODE_VERSION: 'v1', REVIEW_UNTIL: '2027-12-01', REVIEW_HASH_SECRET: 's'.repeat(40), REVIEW_MAX_DEVICES: '10',
    REVENUECAT_KMP_V2_SECRET_KEY: 'sk_fictional', REVENUECAT_PROJECT_ID: 'projfictional', REVENUECAT_ENTITLEMENT_ID: 'entlfictional', BOSS_OPEN_LOOPS_TOKEN: 't', DB: db, ...over };
}
const req = (body: unknown, ip = '203.0.113.7', type = 'application/json') =>
  new Request('https://keepmyproof.com/api/review/unlock', { method: 'POST', headers: { 'content-type': type, 'cf-connecting-ip': ip }, body: typeof body === 'string' ? body : JSON.stringify(body) });
async function call(e: ReturnType<typeof env>, rc: ReturnType<typeof revenuecat>, body: unknown, ip?: string, now = NOW) {
  const waits: Promise<unknown>[] = [];
  const res = await reviewUnlock(req(body, ip), e, { now, fetcher: rc.fetcher, waitUntil: p => waits.push(p) });
  await Promise.all(waits);
  return { status: res.status, body: await res.json() as { error?: string; unlocked?: boolean }, headers: res.headers };
}
const triesTaken = (e: ReturnType<typeof env>) => Number((e.DB as ReturnType<typeof d1>).raw.prepare("SELECT COALESCE(SUM(tries),0) AS n FROM review_try WHERE bucket LIKE 'all:%'").get()!.n);
const slots = (e: ReturnType<typeof env>) => Number((e.DB as ReturnType<typeof d1>).raw.prepare('SELECT COUNT(*) AS n FROM review_grant').get()!.n);

test('closed window (past, missing, malformed, no key, no D1): status and unlock answer 404 and call no one', async () => {
  const rc = revenuecat(); rc.known.add(anon(1));
  for (const over of [{ REVIEW_UNTIL: '2026-01-01' }, { REVIEW_UNTIL: undefined }, { REVIEW_UNTIL: 'soon' }, { REVIEW_CODE: undefined }, { REVIEW_CODE: '123456' },
    { REVENUECAT_KMP_V2_SECRET_KEY: undefined }, { REVIEW_HASH_SECRET: 'short' }, { DB: undefined }]) {
    const e = env(d1(), over);
    assert.equal((await reviewStatus(e, NOW)).status, 404, JSON.stringify(over));
    assert.equal((await call(e, rc, { code: CODE, app_user_id: anon(1) })).status, 404);
  }
  assert.deepEqual(rc.calls, []);
  const open = await reviewStatus(env(), NOW);
  assert.equal(open.status, 200); assert.equal(open.headers.get('cache-control'), 'no-store');
});

test('the right code grants 7 days of Plus to a known ID; the code never appears in a response', async () => {
  const e = env(), rc = revenuecat(); rc.known.add(anon(1));
  const r = await call(e, rc, { code: CODE, app_user_id: anon(1) });
  assert.deepEqual(r.body, { unlocked: true });
  assert.equal(rc.granted.get(anon(1)), NOW + 7 * DAY);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  // The grant never outlives the window.
  const e2 = env(d1(), { REVIEW_UNTIL: '2026-12-03T00:00:00Z' }), rc2 = revenuecat(); rc2.known.add(anon(2));
  await call(e2, rc2, { code: CODE, app_user_id: anon(2) });
  assert.equal(rc2.granted.get(anon(2)), Date.parse('2026-12-03T00:00:00Z'));
  for (const body of [{ code: '0000000000', app_user_id: anon(1) }, { code: CODE, app_user_id: anon(1) }])
    assert.ok(!JSON.stringify((await call(e, rc, body, '198.51.100.1')).body).includes(CODE));
});

test('guessing: wrong code 403 and counted; per-IP 20 a day, burst 5 a minute and the global cap all refuse BEFORE the compare', async () => {
  const e = env(), rc = revenuecat(); rc.known.add(anon(1));
  assert.equal((await call(e, rc, { code: '0000000000', app_user_id: anon(1) })).body.error, 'WRONG_CODE');
  assert.equal(triesTaken(e), 1);
  // Burst: 5 in one minute from one IP, the 6th (even the RIGHT code) is refused without reaching the compare.
  const b = env(), rcb = revenuecat(); rcb.known.add(anon(1));
  for (let i = 0; i < LIMITS.burstPerMinute; i++) await call(b, rcb, { code: '0000000000', app_user_id: anon(1) });
  const burst = await call(b, rcb, { code: CODE, app_user_id: anon(1) });
  assert.equal(burst.status, 429); assert.equal(rcb.granted.size, 0); assert.deepEqual(rcb.calls, []);
  // Per IP per day: 20 tries spread over minutes, the 21st (right code) is 429 and never compared or granted.
  const d = env(), rcd = revenuecat(); rcd.known.add(anon(1));
  for (let i = 0; i < LIMITS.perIpDaily; i++) assert.equal((await call(d, rcd, { code: '0000000000', app_user_id: anon(1) }, undefined, NOW + i * 61_000)).status, 403);
  const late = await call(d, rcd, { code: CODE, app_user_id: anon(1) }, undefined, NOW + 30 * 61_000);
  assert.equal(late.status, 429); assert.equal(rcd.granted.size, 0); assert.deepEqual(rcd.calls, []);
  // Another IP is not blocked by that one; the global daily cap stops everyone.
  assert.equal((await call(d, rcd, { code: CODE, app_user_id: anon(1) }, '198.51.100.9', NOW + 31 * 61_000)).status, 200);
  const g = env(), rcg = revenuecat(); rcg.known.add(anon(1));
  (g.DB as ReturnType<typeof d1>).raw.prepare('INSERT INTO review_try VALUES (?, ?, ?, ?)').run(`all:2026-12-01`, 'all', LIMITS.globalDaily, NOW + DAY);
  const global = await call(g, rcg, { code: CODE, app_user_id: anon(1) });
  assert.equal(global.status, 429); assert.deepEqual(rcg.calls, []);
});

test('lying client: malformed, custom or oversized IDs and bodies are refused before any count or call', async () => {
  const e = env(), rc = revenuecat();
  for (const body of [{ code: CODE, app_user_id: 'my-own-id' }, { code: CODE, app_user_id: '$RCAnonymousID:xyz' }, { code: CODE }, { app_user_id: anon(1) },
    { code: 4815162342, app_user_id: anon(1) }, 'not json', JSON.stringify({ code: CODE, app_user_id: anon(1), pad: 'x'.repeat(2000) })])
    assert.equal((await call(e, rc, body)).status, 400);
  assert.equal((await reviewUnlock(req({ code: CODE, app_user_id: anon(1) }, undefined, 'text/plain'), e, { now: NOW, fetcher: rc.fetcher })).status, 400);
  assert.equal(triesTaken(e), 0); assert.deepEqual(rc.calls, []);
  // A made-up (well-formed) ID RevenueCat does not know: refused, no slot, no grant.
  const r = await call(e, rc, { code: CODE, app_user_id: anon(99) });
  assert.equal(r.status, 503); assert.equal(slots(e), 0); assert.equal(rc.granted.size, 0);
});

test('leaked code: 10 devices per code version, 2 new per IP a day, the 11th files an Open Loops row; the same ID again takes no slot', async () => {
  const e = env(), rc = revenuecat();
  for (let n = 1; n <= 12; n++) rc.known.add(anon(n));
  // One IP: two new devices, the third is USED_UP without taking a slot.
  assert.equal((await call(e, rc, { code: CODE, app_user_id: anon(1) }, '192.0.2.1')).status, 200);
  assert.equal((await call(e, rc, { code: CODE, app_user_id: anon(2) }, '192.0.2.1')).status, 200);
  const third = await call(e, rc, { code: CODE, app_user_id: anon(3) }, '192.0.2.1');
  assert.equal(third.body.error, 'USED_UP'); assert.equal(slots(e), 2); assert.ok(!rc.granted.has(anon(3)));
  // The same ID again (even after its 7 days, before its row is purged): no new slot, a fresh grant.
  const again = await call(e, rc, { code: CODE, app_user_id: anon(1) }, '192.0.2.1', NOW + 8 * DAY);
  assert.equal(again.status, 200); assert.equal(slots(e), 2); assert.equal(rc.granted.get(anon(1)), NOW + 15 * DAY);
  // Fill to 10 from other IPs; the 11th is USED_UP and files the Open Loops row.
  for (let n = 3; n <= 10; n++) assert.equal((await call(e, rc, { code: CODE, app_user_id: anon(n) }, `198.51.100.${n}`)).status, 200);
  assert.equal(slots(e), 10);
  const eleventh = await call(e, rc, { code: CODE, app_user_id: anon(11) }, '198.51.100.200');
  assert.equal(eleventh.body.error, 'USED_UP'); assert.equal(slots(e), 10); assert.ok(!rc.granted.has(anon(11))); assert.equal(rc.openLoops, 1);
  // A new code version is a new window: its own 10 slots.
  const v2 = { ...e, REVIEW_CODE_VERSION: 'v2' };
  assert.equal((await call(v2, rc, { code: CODE, app_user_id: anon(11) }, '198.51.100.201')).status, 200);
});

test('outage: RevenueCat 5xx, timeout or read-only key = 503, slot given back, nothing granted; D1 down = 503', async () => {
  for (const mode of ['5xx', 'timeout', '403'] as const) {
    const e = env(), rc = revenuecat(); rc.known.add(anon(1)); rc.set(mode);
    const r = await call(e, rc, { code: CODE, app_user_id: anon(1) });
    assert.equal(r.status, 503, mode); assert.equal(r.body.error, 'TRY_AGAIN');
    assert.equal(slots(e), 0, mode); assert.ok(!rc.granted.has(anon(1)), `${mode}: nothing half-granted`);
    // The slot really came back: the same IP can still open its two new devices.
    rc.set('ok'); rc.known.add(anon(2));
    assert.equal((await call(e, rc, { code: CODE, app_user_id: anon(1) })).status, 200);
    assert.equal((await call(e, rc, { code: CODE, app_user_id: anon(2) })).status, 200);
  }
  const db = d1(), e = env(db), rc = revenuecat(); rc.known.add(anon(1)); db.fail(true);
  const r = await call(e, rc, { code: CODE, app_user_id: anon(1) });
  assert.equal(r.status, 503); assert.deepEqual(rc.calls, []);
});

test('data loss: a buyer who redeems keeps the purchase; a failed grant only ever revokes GRANTED entitlements', async () => {
  const e = env(), rc = revenuecat(); rc.known.add(anon(1)); rc.purchases.set(anon(1), 'kmp_plus_lifetime');
  await call(e, rc, { code: CODE, app_user_id: anon(1) });
  rc.set('timeout'); await call(e, rc, { code: CODE, app_user_id: anon(1) });
  assert.equal(rc.purchases.get(anon(1)), 'kmp_plus_lifetime');
  // Every call the server made is a read, a grant or a revoke of a granted entitlement: never a purchase or customer delete.
  assert.ok(rc.calls.every(c => /^GET |\/actions\/(grant_entitlement|revoke_granted_entitlement)$/.test(c)), rc.calls.join('\n'));
  // Stored: HMACs only, no raw ID or IP.
  const dump = JSON.stringify((e.DB as ReturnType<typeof d1>).raw.prepare('SELECT * FROM review_grant').all()) + JSON.stringify((e.DB as ReturnType<typeof d1>).raw.prepare('SELECT * FROM review_try').all());
  assert.ok(!dump.includes(anon(1).slice(15)) && !dump.includes('203.0.113.7'));
});

test('the app: Plus only from RevenueCat, never from the server alone; no network = hidden link or "try again"', async () => {
  const real = globalThis.fetch; const seen: string[] = [];
  try {
    globalThis.fetch = (async () => { throw Error('offline'); }) as typeof fetch;
    assert.equal(await reviewWindowOpen(), false);
    assert.equal(await redeemReviewCode(CODE, anon(1)), 'tryAgain');
    globalThis.fetch = (async (url: string, init?: RequestInit) => { seen.push(`${init?.method ?? 'GET'} ${url} ${init?.body ?? ''}`);
      return url === REVIEW_URL ? new Response('{"error":"NOT_FOUND"}', { status: 404 }) : new Response('{"error":"USED_UP"}', { status: 403 }); }) as typeof fetch;
    assert.equal(await reviewWindowOpen(), false);
    assert.equal(await redeemReviewCode(CODE, anon(1)), 'usedUp');
    // Not 10 digits, or no anonymous ID (mock, custom ID): nothing is sent.
    assert.equal(await redeemReviewCode('12345', anon(1)), 'wrong');
    assert.equal(await redeemReviewCode(CODE, null), 'tryAgain');
    assert.equal(await redeemReviewCode(CODE, 'custom-user'), 'tryAgain');
    assert.equal(seen.length, 2);
    // What leaves the phone: the code and the anonymous purchase ID, nothing else.
    assert.deepEqual(Object.keys(JSON.parse(seen[1]!.split(' ').slice(2).join(' '))), ['code', 'app_user_id']);
  } finally { globalThis.fetch = real; }
  // The screen sets Plus from billing.refresh() (RevenueCat), and the link is Android-only.
  const screen = readFileSync('app/index.tsx', 'utf8');
  assert.match(screen, /const reviewable = Platform\.OS === 'android' && billing\.mode === 'sandbox' && !ent\.plus;/);
  assert.match(screen, /const next = await billing\.refresh\(\); setEnt\(next\)/);
});

test('the Play reviewer note fits 500 characters and every screen name in it is on the Android build', async () => {
  const { strings } = await import('../src/strings');
  const note = readFileSync('store/play-console-answers.md', 'utf8').split('## App access')[1]!.match(/^> (.+)$/m)![1]!;
  assert.ok([...note].length <= 500, `${[...note].length} characters`);
  for (const key of ['seePlus', 'reviewLink', 'reviewUse'] as const) assert.ok(note.includes(strings[key][0].replace(/\s*›$/, '')), key);
  assert.ok(note.includes('Settings'));
});
