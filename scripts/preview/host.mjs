// THE FREE WEB PREVIEW (docs/preview.md): publishes the Expo web export (dist/) to a Cloudflare Pages
// project and proves the published address serves this build. Same shape as the sibling apps'
// scripts/preview/host.mjs (dream-wedding-builder, approvalprep). Free; no Appetize minutes.
//   node scripts/preview/host.mjs <pages-project>     env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, PREVIEW_BRANCH
import { spawnSync } from 'node:child_process';
import { writeFileSync, appendFileSync, existsSync, renameSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const stop = (code, detail) => { throw new Error(`NAMED STOP [${code}] ${detail}`); };

// Cloudflare Pages never uploads a folder named node_modules, and Expo's web export puts every
// bundled font and picture under assets/node_modules/ (a sibling preview was a blank page for this
// reason on 10 Nov 2026). Move the folder to assets/nm and point the bundles at it.
export function moveBundledAssets(directory) {
  const from = resolve(directory, 'assets', 'node_modules');
  if (!existsSync(from)) return 0;
  renameSync(from, resolve(directory, 'assets', 'nm'));
  let changed = 0;
  const walk = (dir) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (/\.(js|html|json|map)$/.test(name)) { const text = readFileSync(path, 'utf8'); if (text.includes('/assets/node_modules/')) { writeFileSync(path, text.replaceAll('/assets/node_modules/', '/assets/nm/')); changed++; } } } };
  walk(resolve(directory));
  return changed;
}

/** The app bundles the exported first page loads. Zero = the export built no app (hard stop). */
export function exportedBundles(directory) {
  const page = resolve(directory, 'index.html');
  const html = existsSync(page) ? readFileSync(page, 'utf8') : '';
  const bundles = [...html.matchAll(/<script[^>]+src="(\/_expo\/static\/js\/web\/[^"]+\.js)"/g)].map(m => m[1])
    .filter(src => { const file = resolve(directory, '.' + src); return existsSync(file) && statSync(file).size > 0; });
  if (!bundles.length) stop('PREVIEW_EXPORT_EMPTY', `${directory}/index.html loads no app bundle`);
  return bundles;
}

/** The published address must answer with this build's first page and its app bundle. */
// A brand-new pages.dev name can take a couple of minutes to resolve (first run: 80s was not enough).
export async function served(url, bundles, { get = globalThis.fetch, tries = 36, wait = 5000 } = {}) {
  let seen = 'no answer';
  for (let n = 0; n < tries; n++) {
    try {
      const page = await get(url, { redirect: 'follow', cache: 'no-store' });
      const html = page.ok ? await page.text() : '';
      if (page.ok && bundles.every(src => html.includes(src))) {
        const js = await get(new URL(bundles[0], url), { cache: 'no-store' });
        if (js.ok && /javascript/.test(js.headers.get('content-type') ?? '')) return true;
        seen = `bundle answered ${js.status} ${js.headers.get('content-type')}`;
      } else seen = page.ok ? 'an older or different page' : `HTTP ${page.status}`;
    } catch (e) { seen = e.message; }
    if (n < tries - 1) await new Promise(done => setTimeout(done, wait));
  }
  stop('PREVIEW_NOT_SERVED', `${url} does not serve this build (${seen})`);
}

export function publish({ project, branch, directory = 'dist', env = process.env, run = spawnSync }) {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) stop('PREVIEW_HOST_FAILED', 'repo secret CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID is not set');
  if (!project || !branch) stop('PREVIEW_HOST_FAILED', 'no Pages project or branch given');
  moveBundledAssets(directory);
  writeFileSync(resolve(directory, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n');
  writeFileSync(resolve(directory, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  const invoke = (args) => run('npx', ['--yes', 'wrangler@4.110.0', 'pages', ...args], { env: { ...env, NO_COLOR: '1' }, encoding: 'utf8', timeout: 120000 });
  const list = invoke(['project', 'list', '--json']);
  if (list.status !== 0) stop('PREVIEW_HOST_FAILED', 'could not list Pages projects');
  let projects;
  try { projects = JSON.parse(list.stdout); } catch { stop('PREVIEW_HOST_FAILED', 'unreadable Pages project list'); }
  if (!Array.isArray(projects)) stop('PREVIEW_HOST_FAILED', 'unreadable Pages project list');
  if (!projects.some(p => p.name === project || p['Project Name'] === project)) {
    if (invoke(['project', 'create', project, '--production-branch', 'main']).status !== 0) stop('PREVIEW_HOST_FAILED', `could not create Pages project ${project}`);
  }
  const deployed = invoke(['deploy', directory, '--project-name', project, '--branch', branch]);
  if (deployed.status !== 0) stop('PREVIEW_HOST_FAILED', 'the Pages upload was refused');
  // Wrangler 4.110 can exit zero with an unconfirmed status and a URL; only its confirmed-success
  // branch prints this line.
  const out = deployed.stdout ?? '', mine = url => !!url && new URL(url).hostname.endsWith(`.${project}.pages.dev`);
  const upload = out.match(/Deployment complete! Take a peek over at (https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev)\b/)?.[1];
  if (!mine(upload)) stop('PREVIEW_HOST_FAILED', 'the Pages upload was not confirmed');
  // The address that stays the same from build to build: the project root for main, and for any
  // other branch the alias Wrangler prints (this upload's own address when it prints none).
  const alias = out.match(/alias URL: (https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev)\b/)?.[1];
  return { upload, stable: branch === 'main' ? `https://${project}.pages.dev` : mine(alias) ? alias : upload };
}

/** Nothing private in what gets published: no store or API key, no private key (app-security). */
export function refuseSecrets(directory) {
  const walk = dir => readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
  const leak = walk(resolve(directory)).filter(f => /\.(js|html|json|map|txt)$/.test(f))
    .find(f => /\b(?:appl|goog|test|sk_live|sk_test|ghp|github_pat)_[A-Za-z0-9]{16,}|\bAKIA[A-Z0-9]{16}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(readFileSync(f, 'utf8')));
  if (leak) stop('PREVIEW_HAS_SECRET', `${leak} carries what looks like a key; nothing was published`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try {
    const project = process.argv[2], branch = process.env.PREVIEW_BRANCH, env = process.env;
    const bundles = exportedBundles('dist');
    refuseSecrets('dist');
    const { upload, stable } = publish({ project, branch });
    await served(upload, bundles);
    if (stable !== upload) await served(stable, bundles);
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `url=${stable}\n`);
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `[Open the phone app preview](${stable})\n\nFree web preview with sample papers only. No Appetize minutes.\n`);
    console.log(`OUTPUT preview published: ${stable} (${bundles.length} app bundle, this upload ${upload})`);
  } catch (e) { console.error(String(e.message).startsWith('NAMED STOP') ? e.message : `NAMED STOP [PREVIEW_HOST_FAILED] ${e.message}`); process.exitCode = 1; }
}
