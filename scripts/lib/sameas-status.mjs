// What a sameAs profile's HTTP answer means. Only 404/410 (gone) or no answer at all is dead.
// 429 (rate limited), 403 (bot wall) and 5xx say nothing about whether the profile exists:
// 9 Nov 2026 Blogger answered GitHub's runner 429 and the weekly watch went red asking to delete
// a live profile.
export function sameAsVerdict(status) {
  if (status >= 200 && status < 400) return 'ok';
  if (status === 404 || status === 410 || !status) return 'dead';
  return 'unverified';
}
