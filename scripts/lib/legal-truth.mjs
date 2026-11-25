// What the published Privacy page says about the Android access code (Apple 5.6 follow-up, 24 Nov 2026).
// App Review is sent to /privacy. The page must describe the code as what it is, an Android-only access
// code given to Google Play for its review process, say the iPhone and iPad app has none, and never describe
// it as a feature used only by reviewers. Used by tests/store-truth.test.ts on store/<lang>.md (the source the
// site publishes) and by scripts/live-check.mjs on what keepmyproof.com really serves. Plain Node.

export const ACCESS_CODE = {
  en: { androidOnly: /Android-only access code/, iosNone: /iPhone and iPad app has no access code/, reviewers: /reviewers?\b|used only by/i },
  es: { androidOnly: /código de acceso exclusivo de Android/, iosNone: /app de iPhone y iPad no tiene código de acceso/, reviewers: /revisor(es)?\b|usan solo/i },
  zh: { androidOnly: /仅限 ?Android 的 ?访问代码/, iosNone: /iPhone 和 iPad 版没有访问代码/, reviewers: /审核人员|只供/ },
  ko: { androidOnly: /Android 전용 ?접근 ?코드/, iosNone: /iPhone과 iPad 앱에는 접근 코드가 없습니다/, reviewers: /심사 ?담당자|담당자만/ },
};

/** Every way this privacy text misdescribes the access code. `[]` = true as written. */
export function accessCodeProblems(lang, text) {
  const w = ACCESS_CODE[lang];
  if (!w) return [`${lang}: no access-code wording is known for this language`];
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (flat.length < 400) return [`${lang}: privacy text is ${flat.length} characters, so it was not read`];
  const out = [];
  if (w.reviewers.test(flat)) out.push(`${lang}: describes the access code as used by reviewers ("${w.reviewers.exec(flat)[0]}")`);
  if (!w.androidOnly.test(flat)) out.push(`${lang}: does not say the access code is Android-only`);
  if (!w.iosNone.test(flat)) out.push(`${lang}: does not say the iPhone and iPad app has no access code`);
  return out;
}

const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export const LIVE_PRIVACY = [['/privacy', 'en'], ['/es/privacidad', 'es']];
/** The live Privacy pages, read through `get(path)` → { status, text(), error? }. A page that cannot be
 *  reached is "couldn't check", never a pass. */
export async function livePrivacyProblems(get, pages = LIVE_PRIVACY) {
  const out = [];
  for (const [path, lang] of pages) {
    let r;
    try { r = await get(path); } catch (e) { r = { status: 0, error: e?.message ?? String(e) }; }
    if (!r || !r.status) { out.push(`${path}: couldn't check (${r?.error ?? 'no connection'})`); continue; }
    if (r.status !== 200) { out.push(`${path}: answers ${r.status}, not 200`); continue; }
    let body;
    try { body = await r.text(); } catch (e) { out.push(`${path}: couldn't check (body not read: ${e?.message ?? e})`); continue; }
    out.push(...accessCodeProblems(lang, text(body)).map((p) => `${path} ${p}`));
  }
  return out;
}
