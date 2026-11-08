// ONE-TIME SETUP for scripts/syndicate.mjs, run on the owner's Mac through the Boss OS vault:
//
//   cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/syndication-setup.mjs blogger
//   cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/syndication-setup.mjs wordpress
//
// Nothing here waits on a terminal prompt (it is often run with no terminal input at all):
//   blogger    reuses the owner's own Desktop OAuth client (KMP_BLOGGER_CLIENT_ID, else the rclone
//              Mac-backup client RCLONE_MAC_BACKUP_OAUTH_CLIENT_ID, never a West Peek client), opens
//              Google's consent page in the browser, catches the answer on 127.0.0.1, proves the
//              token can read keepmyproof.blogspot.com, then saves the four KMP_BLOGGER_* values.
//   wordpress  asks for the four values in macOS pop-ups (secrets hidden and asked twice), proves
//              them with one password-grant sign-in that finds keepmyproof.wordpress.com, then saves
//              the four KMP_WPCOM_* values.
// Saving = piped on stdin into `npm run -s vault:set NAME` (Boss OS vault) and `gh secret set NAME`
// (this repo). No value is ever an argument, printed or written to a file.
import { createServer } from 'node:http';
import { spawnSync, execFileSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REPO = 'seq23/keepmyproof';
const BLOG_URL = 'https://keepmyproof.blogspot.com/';
const WPCOM_SITE = 'keepmyproof.wordpress.com';
const BOSS = join(homedir(), 'GitHub/boss-os');

const fail = (msg) => { console.log(`Not saved: ${msg}`); process.exit(1); };

function save(name, value) {
  const v = spawnSync('npm', ['run', '-s', 'vault:set', name], { cwd: BOSS, input: value, encoding: 'utf8', stdio: ['pipe', 'ignore', 'pipe'] });
  if (v.status !== 0) fail(`the vault refused ${name}.`);
  const g = spawnSync('gh', ['secret', 'set', name, '--repo', REPO], { input: value, encoding: 'utf8', stdio: ['pipe', 'ignore', 'pipe'] });
  if (g.status !== 0) fail(`${name} is in the vault, but GitHub refused it (gh auth status?). Re-run: cd ~/GitHub/boss-os && npm run -s vault:run -- node ~/GitHub/keepmyproof/scripts/mirror-syndication-secrets.mjs`);
}

function dialog(prompt, hidden) {
  const script = `text returned of (display dialog ${JSON.stringify(prompt)} default answer "" ${hidden ? 'with hidden answer ' : ''}with title "KeepMyProof setup (saved privately, never shown)")`;
  try { return execFileSync('osascript', ['-e', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).replace(/\n$/, ''); }
  catch { fail('the pop-up was cancelled.'); }
}

function ask(prompt, hidden) {
  const a = dialog(prompt, hidden).trim();
  if (!a) fail(`"${prompt}" was empty.`);
  if (hidden && dialog(`${prompt} (paste it again)`, true).trim() !== a) fail(`the two "${prompt}" entries did not match.`);
  return a;
}

async function json(url, init) {
  const r = await fetch(url, init);
  const body = await r.text();
  let data = {}; try { data = JSON.parse(body); } catch {}
  return { ok: r.ok, status: r.status, data, body };
}

async function blogger() {
  const clientId = process.env.KMP_BLOGGER_CLIENT_ID || process.env.RCLONE_MAC_BACKUP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.KMP_BLOGGER_CLIENT_SECRET || process.env.RCLONE_MAC_BACKUP_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) fail('no Google OAuth client in the vault. Run this through vault:run (see the top of this file).');
  const verifier = randomBytes(32).toString('base64url'), state = randomBytes(16).toString('hex');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const { code, redirect } = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname !== '/') { res.writeHead(404).end(); return; }
      const ok = u.searchParams.get('state') === state && u.searchParams.get('code');
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(ok ? 'KeepMyProof Blogger: done. You can close this tab.' : 'That did not work. Close this tab; the Terminal says why.');
      clearTimeout(timer); server.close();
      ok ? resolve({ code: u.searchParams.get('code'), redirect: `http://127.0.0.1:${server.address()?.port ?? port}` }) : reject(new Error(u.searchParams.get('error') || 'no code came back'));
    });
    let port;
    const timer = setTimeout(() => { server.close(); reject(new Error('no answer from the browser within 5 minutes')); }, 300_000);
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      Object.entries({ client_id: clientId, redirect_uri: `http://127.0.0.1:${port}`, response_type: 'code', scope: 'https://www.googleapis.com/auth/blogger',
        access_type: 'offline', prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256' }).forEach(([k, v]) => auth.searchParams.set(k, v));
      console.log('Opening Google in your browser. Sign in as the account that owns keepmyproof.blogspot.com.');
      spawnSync('open', [auth.toString()]);
    });
  }).catch(e => fail(`Google sign-in: ${e.message}.`));
  const tok = await json('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: 'authorization_code', code_verifier: verifier }) });
  if (!tok.ok || !tok.data.refresh_token) fail(`Google did not return a lasting sign-in (${tok.status} ${tok.data.error ?? ''}).`);
  const blog = await json(`https://www.googleapis.com/blogger/v3/blogs/byurl?url=${encodeURIComponent(BLOG_URL)}`, { headers: { authorization: `Bearer ${tok.data.access_token}` } });
  if (!blog.ok) {
    if (/accessNotConfigured|SERVICE_DISABLED|has not been used/i.test(blog.body)) fail('the Blogger API is not enabled in that Google Cloud project yet (APIs & Services > Library > Blogger API v3 > Enable), then run this again.');
    fail(`Blogger would not show keepmyproof.blogspot.com to this account (${blog.status}). Sign in with the account that owns the blog.`);
  }
  save('KMP_BLOGGER_CLIENT_ID', clientId);
  save('KMP_BLOGGER_CLIENT_SECRET', clientSecret);
  save('KMP_BLOGGER_REFRESH_TOKEN', tok.data.refresh_token);
  save('KMP_BLOGGER_BLOG_ID', String(blog.data.id));
  console.log('Saved: KeepMyProof Blogger is connected. It posts by itself from tomorrow morning.');
}

async function wordpress() {
  const v = {
    KMP_WPCOM_CLIENT_ID: ask('WordPress.com app: Client ID', false),
    KMP_WPCOM_CLIENT_SECRET: ask('WordPress.com app: Client Secret', true),
    KMP_WPCOM_USERNAME: ask('WordPress.com username (or email) of the KeepMyProof account', false),
    KMP_WPCOM_APP_PASSWORD: ask('WordPress.com application password', true),
  };
  const tok = await json('https://public-api.wordpress.com/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: v.KMP_WPCOM_CLIENT_ID, client_secret: v.KMP_WPCOM_CLIENT_SECRET, grant_type: 'password', username: v.KMP_WPCOM_USERNAME, password: v.KMP_WPCOM_APP_PASSWORD }) });
  if (!tok.ok || !tok.data.access_token) fail(`WordPress.com refused the sign-in (${tok.status} ${tok.data.error ?? ''}). Check the four values and run this again.`);
  const site = await json(`https://public-api.wordpress.com/rest/v1.1/sites/${WPCOM_SITE}?fields=ID,capabilities`, { headers: { authorization: `Bearer ${tok.data.access_token}` } });
  if (!site.ok || site.data.capabilities?.publish_posts === false) fail(`this account cannot post on ${WPCOM_SITE} (${site.status}). Use the account that owns that site.`);
  for (const [k, val] of Object.entries(v)) save(k, val);
  console.log('Saved: KeepMyProof WordPress is connected. It posts by itself from tomorrow morning.');
}

const mode = process.argv[2];
if (mode === 'blogger') await blogger();
else if (mode === 'wordpress') await wordpress();
else fail('say which: blogger or wordpress.');
