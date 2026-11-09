// Weekly entity watch (search-readiness k6): every sameAs profile in site/data/entity.json must still
// resolve, and the live homepage must carry the same sameAs and the Spry Labs parent. A dead profile
// (404/410 or no answer) is NAMED STOP [SAMEAS_DEAD]: remove it from entity.json (the only place sameAs
// is written) and land. Read-only, no credentials.
import { readFileSync } from 'node:fs';
import { sameAsVerdict } from './lib/sameas-status.mjs';
const entity = JSON.parse(readFileSync(new URL('../site/data/entity.json', import.meta.url), 'utf8'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const stops = [];
if (!entity.sameAs?.length) stops.push('NAMED STOP [SAMEAS_EMPTY] entity.json lists no external profile');
for (const u of entity.sameAs || []) {
  const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }).catch((e) => ({ status: 0, statusText: e.message }));
  console.log(`sameAs ${u} -> ${r.status}`);
  const v = sameAsVerdict(r.status);
  if (v === 'dead') stops.push(`NAMED STOP [SAMEAS_DEAD] ${u} answers ${r.status || r.statusText}: remove it from site/data/entity.json`);
  else if (v === 'unverified') console.log(`note: ${u} answered ${r.status}; not proof it is gone, next week's run checks again`);
}
const html = await (await fetch(entity.url, { signal: AbortSignal.timeout(20000) })).text();
const graph = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] || '{"@graph":[]}')['@graph'];
const org = graph.find((n) => n['@id'] === entity['@id']);
if (!org) stops.push(`NAMED STOP [ENTITY_NOT_LIVE] ${entity.url} has no Organization ${entity['@id']}`);
else {
  if (JSON.stringify(org.sameAs || []) !== JSON.stringify(entity.sameAs || [])) stops.push(`NAMED STOP [SAMEAS_DRIFT] live sameAs ${JSON.stringify(org.sameAs)} differs from entity.json (deploy main)`);
  if (org.parentOrganization?.['@id'] !== entity.parentOrganization['@id']) stops.push('NAMED STOP [PARENT_MISSING] the live Organization does not name Spry Labs as parentOrganization');
}
console.log(`OUTPUT entity-watch profiles=${(entity.sameAs || []).length} pending=${(entity.profiles_pending || []).length} stops=${stops.length}`);
for (const s of stops) console.error(s);
process.exit(stops.length ? 1 : 0);
