// Google Play review access: KeepMyProof's only server code (Cloudflare Pages Functions, site/functions/api/review).
// KeepMyProof has no accounts, so a store reviewer reaches Plus with ONE 10-digit code typed on the Plus screen
// (Android only). The code lives only in the Pages secret REVIEW_CODE, the Boss OS vault (KMP_PLAY_REVIEW_CODE) and
// Play Console's private sign-in details: never in the app or this public repo. The right code asks RevenueCat to
// grant this phone's anonymous purchase ID the Plus entitlement for 7 days; RevenueCat then answers "Plus" to the app
// exactly as for a buyer. Nothing here or in the app decides Plus on its own. One contract with Peace Be Still's
// worker/src/review.ts (the reference) and the other Spry Labs apps:
// ~/Work/google-play-2026-11-21/REVIEW-UNLOCK-DESIGN.md section 3.
//
// Order: window -> body and ID format -> try limits (atomic, BEFORE the compare) -> constant-time compare -> ID known
// to RevenueCat -> per-IP new-slot limit -> device slot (cap REVIEW_MAX_DEVICES per code version) -> grant. Any
// RevenueCat failure revokes what this call granted, gives the slot back and answers 503: never half-granted.
// Stored: HMACs of the ID and the IP (REVIEW_HASH_SECRET), the code version, timestamps. Never a raw ID, IP or code.
// The papers never reach this route: the app sends only the code and RevenueCat's anonymous purchase ID.

export const RC = 'https://api.revenuecat.com/v2';
export const LIMITS = { perIpDaily: 20, globalDaily: 1000, burstPerMinute: 5, newSlotsPerIpDaily: 2, maxDevices: 10 };
const CODE = /^\d{10}$/;
const ANON_ID = /^\$RCAnonymousID:[0-9a-f]{32}$/;
const DAY = 86_400_000, WEEK = 7 * DAY, MAX_BODY = 1024;
const OPEN_LOOPS_INTAKE = 'https://boss.sequoiataylor.com/api/boss/open-loops/intake';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const closed = () => json({ error: 'NOT_FOUND' }, 404);
const stop = (code) => console.log(`NAMED STOP [${code}]`);

/** Open only when every secret and binding it needs is present, the code is 10 digits and REVIEW_UNTIL is in the future. */
export function reviewOpen(env, now) {
  const until = Date.parse(env.REVIEW_UNTIL ?? '');
  return CODE.test(env.REVIEW_CODE ?? '') && Number.isFinite(until) && until > now &&
    /^[A-Za-z0-9._-]{1,32}$/.test(env.REVIEW_CODE_VERSION ?? '') && (env.REVIEW_HASH_SECRET ?? '').length >= 32 &&
    !!env.REVENUECAT_KMP_V2_SECRET_KEY && !!env.REVENUECAT_PROJECT_ID && !!env.REVENUECAT_ENTITLEMENT_ID && !!env.DB;
}

const maxDevices = (env) => { const n = Number(env.REVIEW_MAX_DEVICES ?? LIMITS.maxDevices); return Number.isInteger(n) && n > 0 && n <= 50 ? n : LIMITS.maxDevices; };

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text)));
}
const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
/** Constant time: both sides are HMAC'd to 32 bytes first, then every byte is compared. */
async function same(secret, typed, real) {
  const [a, b] = await Promise.all([hmac(secret, `code:${typed}`), hmac(secret, `code:${real}`)]);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** One atomic try against a cap: true when taken, false when the bucket is full. */
async function take(db, bucket, key, cap, until) {
  const row = await db.prepare('INSERT INTO review_try (bucket, key, tries, until) VALUES (?, ?, 1, ?) ON CONFLICT(bucket, key) DO UPDATE SET tries = tries + 1 WHERE tries < ? RETURNING tries')
    .bind(bucket, key, until, cap).first();
  return !!row;
}
const giveBack = (db, bucket, key) => db.prepare('UPDATE review_try SET tries = tries - 1 WHERE bucket = ? AND key = ? AND tries > 0').bind(bucket, key).run();

export async function reviewStatus(env, now = Date.now()) {
  return reviewOpen(env, now) ? json({ open: true }) : closed();
}

/**
 * POST /api/review/unlock. `request` is the incoming Request; `fetcher` reaches RevenueCat and the Open Loops intake;
 * `waitUntil` keeps the Open Loops post alive after the answer.
 */
export async function reviewUnlock(request, env, { now = Date.now(), fetcher = fetch, waitUntil = (p) => p } = {}) {
  if (!reviewOpen(env, now)) return closed();
  // Body: JSON only, at most 1 KB, a code and RevenueCat's anonymous ID. Anything else is refused before any count or call.
  const length = Number(request.headers.get('content-length') ?? 0);
  if (!/^application\/json\b/i.test(request.headers.get('content-type') ?? '') || length > MAX_BODY) return json({ error: 'BAD_REQUEST' }, 400);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'BAD_REQUEST' }, 400);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: 'BAD_REQUEST' }, 400); }
  const code = body?.code, id = body?.app_user_id;
  if (typeof code !== 'string' || typeof id !== 'string' || !ANON_ID.test(id)) return json({ error: 'BAD_REQUEST' }, 400);

  const db = env.DB, secret = env.REVIEW_HASH_SECRET, version = env.REVIEW_CODE_VERSION;
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipHash = hex(await hmac(secret, `ip:${ip}`)), idHash = hex(await hmac(secret, `id:${id}`));
  const day = new Date(now).toISOString().slice(0, 10), minute = Math.floor(now / 60_000);
  try {
    // Expired rows first (the design's KMP cleanup): try counters past their day or minute, grants 7 days past expiry.
    await db.prepare('DELETE FROM review_try WHERE until < ?').bind(now).run();
    await db.prepare('DELETE FROM review_grant WHERE expires_at + ? < ?').bind(WEEK, now).run();
    // Limits, taken before the code is compared, so guessing costs a try whatever the guess.
    if (!(await take(db, `burst:${minute}`, ipHash, LIMITS.burstPerMinute, (minute + 2) * 60_000))) return json({ error: 'SLOW_DOWN' }, 429);
    if (!(await take(db, `ip:${day}`, ipHash, LIMITS.perIpDaily, now + 2 * DAY))) { stop('REVIEW_IP_DAILY_CAP'); return json({ error: 'SLOW_DOWN' }, 429); }
    if (!(await take(db, `all:${day}`, 'all', LIMITS.globalDaily, now + 2 * DAY))) { stop('REVIEW_DAILY_CAP'); return json({ error: 'SLOW_DOWN' }, 429); }
  } catch { stop('REVIEW_DB_UNAVAILABLE'); return json({ error: 'TRY_AGAIN' }, 503); }

  if (!CODE.test(code) || !(await same(secret, code, env.REVIEW_CODE))) { stop('REVIEW_CODE_WRONG'); return json({ error: 'WRONG_CODE' }, 403); }

  const rc = (path, init = {}) => fetcher(`${RC}/projects/${encodeURIComponent(env.REVENUECAT_PROJECT_ID)}/customers/${encodeURIComponent(id)}${path}`, {
    ...init, headers: { authorization: `Bearer ${env.REVENUECAT_KMP_V2_SECRET_KEY}`, 'content-type': 'application/json', accept: 'application/json' }, signal: AbortSignal.timeout(8000),
  });
  // The ID must be one RevenueCat already knows (the SDK creates it on first launch): a made-up ID takes no slot.
  try {
    const known = await rc('');
    if (known.status === 404) { stop('REVIEW_ID_UNKNOWN'); return json({ error: 'TRY_AGAIN' }, 503); }
    if (!known.ok) throw Error(`HTTP_${known.status}`);
  } catch { stop('REVIEW_RC_UNAVAILABLE'); return json({ error: 'TRY_AGAIN' }, 503); }

  // Device slot: the same ID again takes no new slot (and gets a fresh grant); a new ID takes one of REVIEW_MAX_DEVICES,
  // and one IP may open at most 2 new slots a day, so a leaked code cannot burn every slot at once.
  const expires = Math.min(now + WEEK, Date.parse(env.REVIEW_UNTIL));
  let newSlot = false, ipSlot = false;
  try {
    const had = await db.prepare('SELECT 1 AS x FROM review_grant WHERE window_id = ? AND id_hash = ?').bind(version, idHash).first();
    if (!had) {
      if (!(await take(db, `slot:${day}`, ipHash, LIMITS.newSlotsPerIpDaily, now + 2 * DAY))) { stop('REVIEW_IP_SLOT_CAP'); return json({ error: 'USED_UP' }, 403); }
      ipSlot = true;
      const row = await db.prepare('INSERT INTO review_grant (window_id, id_hash, granted_at, expires_at) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM review_grant WHERE window_id = ?) < ? ON CONFLICT(window_id, id_hash) DO NOTHING RETURNING id_hash')
        .bind(version, idHash, now, expires, version, maxDevices(env)).first();
      if (!row) {
        await giveBack(db, `slot:${day}`, ipHash);
        stop('REVIEW_DEVICE_CAP');
        waitUntil(fileCapLoop(env, fetcher));
        return json({ error: 'USED_UP' }, 403);
      }
      newSlot = true;
    }
  } catch {
    if (ipSlot) await giveBack(db, `slot:${day}`, ipHash).catch(() => {});
    stop('REVIEW_DB_UNAVAILABLE'); return json({ error: 'TRY_AGAIN' }, 503);
  }

  const undo = async () => {
    if (newSlot) await db.prepare('DELETE FROM review_grant WHERE window_id = ? AND id_hash = ?').bind(version, idHash).run().catch(() => {});
    if (ipSlot) await giveBack(db, `slot:${day}`, ipHash).catch(() => {});
  };
  const entitlement = JSON.stringify({ entitlement_id: env.REVENUECAT_ENTITLEMENT_ID });
  try {
    const res = await rc('/actions/grant_entitlement', { method: 'POST', body: JSON.stringify({ entitlement_id: env.REVENUECAT_ENTITLEMENT_ID, expires_at: expires }) });
    if (res.status === 403) { stop('REVIEW_RC_KEY_READONLY'); await undo(); return json({ error: 'TRY_AGAIN' }, 503); }
    if (!res.ok) throw Error(`HTTP_${res.status}`);
  } catch {
    // A timeout may still have granted: revoke what this call may have granted (granted entitlements only, never a
    // purchase), give the slot back, answer "try again".
    await rc('/actions/revoke_granted_entitlement', { method: 'POST', body: entitlement }).catch(() => {});
    await undo();
    stop('REVIEW_RC_UNAVAILABLE'); return json({ error: 'TRY_AGAIN' }, 503);
  }
  if (!newSlot) await db.prepare('UPDATE review_grant SET granted_at = ?, expires_at = ? WHERE window_id = ? AND id_hash = ?').bind(now, expires, version, idHash).run().catch(() => {});
  console.log('REVIEW_UNLOCKED');
  return json({ unlocked: true });
}

/** The cap was hit: a row on Boss OS's Open Loops list (the repo's existing failure path), so it is seen, not only logged. */
async function fileCapLoop(env, fetcher) {
  if (!env.BOSS_OPEN_LOOPS_TOKEN) { stop('OPEN_LOOPS_TOKEN_MISSING'); return; }
  try {
    const r = await fetcher(OPEN_LOOPS_INTAKE, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.BOSS_OPEN_LOOPS_TOKEN}` },
      body: JSON.stringify({ repo: 'seq23/keepmyproof', stop: 'REVIEW_DEVICE_CAP', business: 'spry', finish_line: 'KeepMyProof: live in both stores, selling', owner: 'claude',
        title: 'KeepMyProof: the Play review code is used up', next_step: `All ${maxDevices(env)} review slots for code version ${env.REVIEW_CODE_VERSION} are taken. Rotate: new KMP_PLAY_REVIEW_CODE in the vault, new REVIEW_CODE + REVIEW_CODE_VERSION on the Pages project, then she pastes the new code in Play Console.` }),
      signal: AbortSignal.timeout(8000) });
    if (!r.ok) stop('OPEN_LOOPS_REFUSED');
  } catch { stop('OPEN_LOOPS_UNREACHABLE'); }
}
