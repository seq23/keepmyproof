// Android only (Metro bundles *.android.ts for Android alone; iOS and the web never see this file).
// The app's only network call besides RevenueCat, and the only file scripts/validate.mjs lets call fetch (one constant
// URL, keepmyproof.com's /api/review; scripts/prove-safety.mjs proves any other fetch still fails). Google Play's
// reviewer only: ReviewCode.android.tsx reaches it on the Plus screen, while the user is not on Plus. It sends only
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

// The review card's wording, in LANGS order (en, es, zh, ko). Kept here, not in src/strings.ts, so the iOS build has none of it.
export const reviewStrings = {
  reviewLink: [
    "Have a review code?",
    "¿Tiene un código de revisión?",
    "有审核代码？",
    "심사 코드가 있나요?"
  ],
  reviewCode: [
    "App review code",
    "Código de revisión de la app",
    "应用审核代码",
    "앱 심사 코드"
  ],
  reviewWhy: [
    "For Google Play's app review. The check sends only the code and an anonymous purchase ID; your papers never leave this device.",
    "Para la revisión de Google Play. La comprobación envía solo el código y un identificador anónimo de compra; sus papeles nunca salen de este dispositivo.",
    "供 Google Play 应用审核使用。检查时只发送代码和一个匿名购买标识符，您的文件绝不会离开这台设备。",
    "Google Play 앱 심사용이에요. 확인할 때 코드와 익명 구매 식별자만 보내고, 서류는 이 기기를 떠나지 않아요."
  ],
  reviewUse: [
    "Use this code",
    "Usar este código",
    "使用此代码",
    "이 코드 사용"
  ],
  reviewWrong: [
    "That code didn't work. Check the 10 digits and try again.",
    "Ese código no funcionó. Revise los 10 dígitos e inténtelo de nuevo.",
    "这个代码无效。请核对 10 位数字后重试。",
    "코드가 맞지 않아요. 10자리를 확인하고 다시 시도하세요."
  ],
  reviewUsedUp: [
    "This review code has been used up.",
    "Este código de revisión ya se agotó.",
    "这个审核代码已用完。",
    "이 심사 코드는 모두 사용되었어요."
  ],
  reviewSlow: [
    "Too many tries. Please wait and try again later.",
    "Demasiados intentos. Espere e inténtelo más tarde.",
    "尝试次数过多。请稍后再试。",
    "시도가 너무 많아요. 잠시 후 다시 시도하세요."
  ],
  reviewTryAgain: [
    "Couldn't check the code right now. Please try again.",
    "No se pudo comprobar el código ahora. Inténtelo de nuevo.",
    "现在无法检查代码。请重试。",
    "지금은 코드를 확인할 수 없어요. 다시 시도하세요."
  ],
} as const satisfies Record<string, readonly [en: string, es: string, zh: string, ko: string]>;
