// The app's only network call besides RevenueCat, and the only file scripts/validate.mjs lets call fetch (one constant
// URL, keepmyproof.com's /api/review; scripts/prove-safety.mjs proves any other fetch still fails). Google Play's
// reviewer only: app/index.tsx reaches it on Android, on the Plus screen, while the user is not on Plus. It sends only
// the typed code and RevenueCat's anonymous purchase ID, never papers. The server (site/server/review.mjs) checks the
// code and asks RevenueCat for a 7-day Plus grant; the app then re-reads RevenueCat. Nothing here decides Plus.
export const REVIEW_URL = 'https://keepmyproof.com/api/review';
export type ReviewResult = 'unlocked' | 'wrong' | 'usedUp' | 'slow' | 'tryAgain';
const ANON_ID = /^\$RCAnonymousID:[0-9a-f]{32}$/;

async function call(unlock: boolean, body?: string): Promise<Response> {
  const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 10_000);
  try {
    return unlock
      ? await fetch(`${REVIEW_URL}/unlock`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: abort.signal })
      : await fetch(REVIEW_URL, { signal: abort.signal });
  } finally { clearTimeout(timer); }
}

/** True only when the server answers 200: a closed window, an error or no network all hide the code link. */
export async function reviewWindowOpen(): Promise<boolean> {
  try { return (await call(false)).status === 200; } catch { return false; }
}

/** One redeem. Never throws: no network, a timeout or any odd answer is "try again", never Plus. */
export async function redeemReviewCode(code: string, appUserId: string | null): Promise<ReviewResult> {
  if (!/^\d{10}$/.test(code)) return 'wrong';
  if (!appUserId || !ANON_ID.test(appUserId)) return 'tryAgain';
  try {
    const res = await call(true, JSON.stringify({ code, app_user_id: appUserId }));
    const error = res.status === 200 ? null : ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
    if (res.status === 200) return 'unlocked';
    if (res.status === 403) return error === 'USED_UP' ? 'usedUp' : 'wrong';
    if (res.status === 429) return 'slow';
    return 'tryAgain';
  } catch { return 'tryAgain'; }
}
