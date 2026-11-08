// Copy the Blogger and WordPress.com posting secrets from the Boss OS vault into this repo's GitHub
// secrets. Run on the Mac, through the vault, so values travel vault -> env -> stdin only:
//
//   cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/mirror-syndication-secrets.mjs
//
// Each value is piped into `gh secret set NAME` on stdin: never an argument, never printed. A name
// the vault does not hold yet is listed and skipped, so it can run after any part of the setup.
// (scripts/syndication-setup.mjs already mirrors what it saves; this is for a re-mirror.)
import { spawnSync } from 'node:child_process';
import { SECRETS } from './syndicate.mjs';

const REPO = 'seq23/keepmyproof';
const NAMES = [...SECRETS.blogger, ...SECRETS.wordpress, 'BOSS_OPEN_LOOPS_TOKEN'];
const set = [], absent = [], failed = [];
for (const name of NAMES) {
  const value = (process.env[name] ?? '').trim();
  if (!value) { absent.push(name); continue; }
  const r = spawnSync('gh', ['secret', 'set', name, '--repo', REPO], { input: value, encoding: 'utf8', stdio: ['pipe', 'ignore', 'pipe'] });
  (r.status === 0 ? set : failed).push(name);
}
console.log(`mirrored: ${set.join(', ') || 'none'}`);
if (absent.length) console.log(`not in the vault yet: ${absent.join(', ')}`);
if (failed.length) console.log(`NAMED STOP [SECRET_MIRROR_FAILED] gh refused: ${failed.join(', ')}`);
console.log(`OUTPUT mirror-syndication-secrets set=${set.length} absent=${absent.length} failed=${failed.length}`);
process.exit(failed.length || !set.length ? 1 : 0);
