import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runLane, SECRETS, WPCOM_SITE, type Page } from '../scripts/syndicate.mjs';

const page = (n: number): Page => ({ url: `https://keepmyproof.com/divorce/x/state-${n}`, path: `/divorce/x/state-${n}`, title: `Guide ${n}`,
  answer: 'Invented answer for a test page.', bullets: ['One', 'Two', 'Three'], sources: [], checked: null, kind: 'state', folder: 'divorce' });
const pages = [page(1), page(2), page(3)];

function fakeHttp(status = 200) {
  const calls: { url: string; body?: string; auth?: string }[] = [];
  const http = async (url: string, init: { body?: string; headers?: Record<string, string> }) => {
    calls.push({ url, body: init.body, auth: init.headers?.authorization });
    const out = /token/.test(url) ? { access_token: 'access' } : { id: `post-${calls.length}`, URL: `https://example.invalid/${calls.length}` };
    return { ok: status < 400, status, text: async () => JSON.stringify(out) };
  };
  return { http, posts: () => calls.filter(c => !/token/.test(c.url)), calls };
}

for (const lane of ['blogger', 'wordpress'] as const) {
  test(`${lane}: missing secret is a named stop with no network; then 1 a day, never the same page twice`, async () => {
    const env = Object.fromEntries(SECRETS[lane].map(k => [k, 'set']));
    const day1 = new Date('2026-11-09T15:00:00Z'), day1late = new Date('2026-11-10T04:00:00Z'), day2 = new Date('2026-11-10T15:00:00Z');

    const none = fakeHttp(), ledger: any[] = [];
    const stop = await runLane(lane, { pages, ledger, env: { ...env, [SECRETS[lane][0]!]: '' }, http: none.http as any, now: day1, dry: false });
    assert.equal(stop.stop?.code, lane === 'blogger' ? 'KMP_BLOGGER_NOT_SET_UP' : 'KMP_WORDPRESS_NOT_SET_UP');
    assert.equal(none.calls.length, 0);
    assert.equal(ledger.length, 0);

    const f = fakeHttp();
    const first = await runLane(lane, { pages, ledger, env, http: f.http as any, now: day1, dry: false });
    assert.equal(first.posted, 1);
    // Same Central day (23:00 CT): the cap holds, nothing is sent.
    const again = await runLane(lane, { pages, ledger, env, http: f.http as any, now: day1late, dry: false });
    assert.equal(again.posted, 0);
    assert.equal(f.posts().length, 1);
    // Next day: the next page, never page 1 again.
    await runLane(lane, { pages, ledger, env, http: f.http as any, now: day2, dry: false });
    assert.equal(f.posts().length, 2);
    assert.deepEqual(ledger.map(e => e.url), [pages[0]!.url, pages[1]!.url]);
    const sent = f.posts().map(p => JSON.parse(p.body!).content as string);
    assert.ok(sent[0]!.includes(`href="${pages[0]!.url}"`) && sent[1]!.includes(`href="${pages[1]!.url}"`));
  });
}

test('wordpress: one stored bearer token, no token call, posts only to keepmyproof.wordpress.com', async () => {
  assert.deepEqual(SECRETS.wordpress, ['KMP_WPCOM_ACCESS_TOKEN']);
  const f = fakeHttp(), ledger: any[] = [];
  const r = await runLane('wordpress', { pages, ledger, env: { KMP_WPCOM_ACCESS_TOKEN: 'stored-token' }, http: f.http as any, now: new Date('2026-11-09T15:00:00Z'), dry: false });
  assert.equal(r.posted, 1);
  assert.equal(f.calls.length, 1);
  assert.equal(WPCOM_SITE, 'keepmyproof.wordpress.com');
  assert.equal(f.calls[0]!.url, 'https://public-api.wordpress.com/rest/v1.1/sites/keepmyproof.wordpress.com/posts/new');
  assert.equal(f.calls[0]!.auth, 'Bearer stored-token');
  assert.ok(!f.calls.some(c => /oauth2\/token|grant_type|password/.test(c.url + (c.body ?? ''))));
});

for (const status of [401, 403]) {
  test(`wordpress: a ${status} on the stored token is the named stop WPCOM_TOKEN_REFUSED, nothing logged as posted`, async () => {
    const f = fakeHttp(status), ledger: any[] = [];
    const r = await runLane('wordpress', { pages, ledger, env: { KMP_WPCOM_ACCESS_TOKEN: 'revoked' }, http: f.http as any, now: new Date('2026-11-09T15:00:00Z'), dry: false });
    assert.equal(r.stop?.code, 'WPCOM_TOKEN_REFUSED');
    assert.equal(r.posted, 0);
    assert.equal(ledger.length, 0);
  });
}

test('wordpress: a 500 is still a refused post (red run), not a token stop', async () => {
  const f = fakeHttp(500), ledger: any[] = [];
  const r = await runLane('wordpress', { pages, ledger, env: { KMP_WPCOM_ACCESS_TOKEN: 't' }, http: f.http as any, now: new Date('2026-11-09T15:00:00Z'), dry: false });
  assert.equal(r.state, 'post_refused');
  assert.equal(r.stop, undefined);
});
