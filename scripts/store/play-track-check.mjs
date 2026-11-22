// After `eas submit` (Android, profile "internal"): prove the upload really reached Play, read-only.
// Passes only when this versionCode is a DRAFT release on the internal track and on no other track
// (production, closed or open testing). Opens a throwaway edit to read the tracks, then deletes it.
// Usage: node scripts/store/play-track-check.mjs <service-account.json> <package> <versionCode>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gscToken } from '../lib/gsc.mjs';

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

/** Every reason the tracks do not show `versionCode` as an internal draft only. `[]` = it does. */
export function trackProblems(tracks, versionCode) {
  const vc = String(versionCode), out = [];
  const holding = (t) => (t.releases ?? []).filter((r) => (r.versionCodes ?? []).map(String).includes(vc));
  const internal = tracks.find((t) => t.track === 'internal');
  const mine = internal ? holding(internal) : [];
  if (!mine.length) out.push(`versionCode ${vc} is not on the internal track`);
  for (const r of mine) if (r.status !== 'draft') out.push(`internal release ${vc} is ${r.status}, not draft`);
  for (const t of tracks) if (t.track !== 'internal' && holding(t).length) out.push(`versionCode ${vc} is also on the ${t.track} track`);
  return out;
}

async function main([saPath, pkg, versionCode]) {
  if (!saPath || !pkg || !/^\d+$/.test(versionCode ?? '')) throw Error('NAMED STOP [USAGE] play-track-check.mjs <sa.json> <package> <versionCode>');
  const token = await gscToken(JSON.parse(readFileSync(saPath, 'utf8')), 'https://www.googleapis.com/auth/androidpublisher');
  const call = async (method, path) => {
    const r = await fetch(`${API}/${pkg}/edits${path}`, { method, headers: { authorization: `Bearer ${token}` } });
    if (!r.ok) throw Error(`NAMED STOP [PLAY_API] ${method} edits${path} answered HTTP ${r.status}`);
    return method === 'DELETE' ? null : r.json();
  };
  const { id } = await call('POST', '');
  try {
    const { tracks = [] } = await call('GET', `/${id}/tracks`);
    const problems = trackProblems(tracks, versionCode);
    for (const t of tracks) for (const r of t.releases ?? []) console.log(`track ${t.track}: ${r.status} ${(r.versionCodes ?? []).join(',')}`);
    if (problems.length) { for (const p of problems) console.log(`NAMED STOP [NOT_ON_INTERNAL_DRAFT] ${p}`); process.exitCode = 2; return; }
    console.log(`OUTPUT play internal track: ${pkg} versionCode ${versionCode} is a draft release (no other track holds it).`);
  } finally { await call('DELETE', `/${id}`); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e?.message ?? e); process.exitCode = 1; });
