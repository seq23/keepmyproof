// Google Play production release of a bundle that is already on the internal track (android-store-build.yml).
// Three steps, each one Play edit; nothing is published before `send`:
//   status            read-only: every track's releases, which listing texts, phone screenshots and contact email
//                     differ from store/ and site/config.mjs
//   prepare <code>    production DRAFT release of <code> with its release notes (store/play-release-notes.json).
//                     The live release keeps serving; a draft is not sent to Google and is deleted in the Console.
//   send <code>       after the store review's PASS, and only when the release gate clears (the same device, price,
//                     legal-page and support-mailbox stops an iOS store build gets): the listing texts, phone
//                     screenshots and contact email that differ, and the draft becomes the completed production
//                     release (sent to Google review). Everything is read back from a fresh edit afterwards.
// Refuses a code that is not above 5 (vc5 was built 27 Nov at 336557c, never sent, and lacks the Android Recents
// cover of #103), a code that is not on the internal track, and notes that are missing or over Play's 500 characters.
// Any Play error before the commit deletes the edit: nothing is committed, and the message says so.
// Key: the Play upload service account JSON in env GOOGLE_PLAY_UPLOAD_SA_JSON (Boss OS vault, by name), e.g.
//   cd ~/GitHub/boss-os && npm run -s vault:run -- node <repo>/scripts/store/play-release.mjs status
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gscToken } from '../lib/gsc.mjs';
import { stops, knownHere, gateDeps } from '../release-gate.mjs';
import { SITE } from '../../site/config.mjs';

export const PACKAGE = 'com.keepmyproof.app';
/** The highest versionCode ever built for Play (vc5, 27 Nov 2026 at 336557c, never sent). A release must be above it. */
export const HIGHEST_BUILT = 5;
export const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
export const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications';
const root = new URL('../../', import.meta.url);
const LOCALES = { en: 'en-US', es: 'es-US', zh: 'zh-CN', ko: 'ko-KR' };
export const SHOTS = ['store/play/phone-01.png', 'store/play/phone-02.png', 'store/play/phone-03.png'];

/** Every reason <code> may not become the production release. `[]` = it may. */
export function codeProblems(tracks, code) {
  const vc = Number(code), out = [];
  if (!Number.isInteger(vc) || vc <= 0) return [`versionCode "${code}" is not a whole number`];
  if (vc <= HIGHEST_BUILT) out.push(`versionCode ${vc} is not above ${HIGHEST_BUILT}, the highest code already built`);
  const all = tracks.flatMap(t => (t.releases ?? []).flatMap(r => (r.versionCodes ?? []).map(Number)));
  const onInternal = tracks.some(t => t.track === 'internal' && (t.releases ?? []).some(r => (r.versionCodes ?? []).map(Number).includes(vc)));
  if (!onInternal) out.push(`versionCode ${vc} is not on the internal track (build it with android-store-build.yml first)`);
  const prod = tracks.find(t => t.track === 'production');
  const live = (prod?.releases ?? []).filter(r => r.status !== 'draft').flatMap(r => (r.versionCodes ?? []).map(Number));
  if (live.some(v => v >= vc)) out.push(`production already serves versionCode ${Math.max(...live)}, not below ${vc}`);
  if (!all.length) out.push('Play returned no releases at all (a failed read is never a clear)');
  return out;
}

/** Release notes per Play locale from store/play-release-notes.json; refuses a missing locale or one over 500 characters. */
export function releaseNotes(notes) {
  const out = [], bad = [];
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const text = String(notes?.[lang] ?? '').trim();
    if (!text) bad.push(`${lang}: no release notes`);
    else if ([...text].length > 500) bad.push(`${lang}: ${[...text].length} characters, Play allows 500`);
    else out.push({ language: locale, text });
  }
  if (bad.length) throw Error(`NAMED STOP [RELEASE_NOTES] ${bad.join('; ')}`);
  return out;
}

/** The production track after `prepare`: what serves today stays as it is, plus one draft of <code>. */
export function preparedTrack(prod, code, notes) {
  const kept = (prod?.releases ?? []).filter(r => r.status !== 'draft');
  return { track: 'production', releases: [...kept, { name: `1.0 (${code})`, versionCodes: [String(code)], status: 'draft', releaseNotes: notes }] };
}

/** The production track after `send`: the draft of <code> becomes the one completed release. Refuses without that draft. */
export function sentTrack(prod, code) {
  const draft = (prod?.releases ?? []).find(r => r.status === 'draft' && (r.versionCodes ?? []).map(String).includes(String(code)));
  if (!draft) throw Error(`NAMED STOP [NO_PRODUCTION_DRAFT] production holds no draft of versionCode ${code}; run prepare first`);
  return { track: 'production', releases: [{ ...draft, status: 'completed' }] };
}

/** Listing fields (title, short, full) in store/google-play.json that differ from Play's, per locale. */
export function listingChanges(live, wanted) {
  const changes = [];
  for (const [lang, w] of Object.entries(wanted)) {
    const l = live.find(x => x.language === w.locale) ?? {};
    const fields = [['title', 'title'], ['short', 'shortDescription'], ['full', 'fullDescription']].filter(([a, b]) => (l[b] ?? '') !== w[a]).map(([, b]) => b);
    if (!l.language) fields.unshift('new language');
    if (fields.length) changes.push({ lang, locale: w.locale, fields, body: { language: w.locale, title: w.title, shortDescription: w.short, fullDescription: w.full } });
  }
  return changes;
}

/** True when Play's phone screenshots for a locale are not exactly store/play/phone-0n.png, in order. */
export function shotsDiffer(liveHashes, fileHashes) {
  return liveHashes.length !== fileHashes.length || liveHashes.some((h, i) => h !== fileHashes[i]);
}

/** Where a phone screenshot's bytes go: Google's upload endpoint refuses a request without uploadType. */
export function shotUploadUrl(edit, locale) {
  return `${UPLOAD}/${PACKAGE}/edits/${edit}/listings/${locale}/phoneScreenshots?uploadType=media`;
}

/** The release gate `send` must clear: stops() at the upload stage (device test for this version, price recheck within
 *  7 days, terms and privacy answering 200, a mail-receiving support address, no preview switch, device wording).
 *  The RevenueCat keys are EAS secrets this Mac cannot see; the Android build itself checked the goog_ key (betaStops),
 *  so that stop is the only one left to the build. The TestFlight Buy + Restore is Apple's, judged by submit-gate. */
export async function sendStops(run = () => stops({ env: process.env, ...gateDeps(), stage: 'upload' })) {
  const known = knownHere(false, 'upload');
  return (await run()).filter(s => known.includes(s.code));
}

/** One Play API caller: `call(method, path, body, { url, type })`. Any answer that is not 2xx throws a NAMED STOP. */
/** @param {string} token @param {typeof fetch} [fetchImpl] */
export function playCaller(token, fetchImpl = fetch) {
  /** @param {string} method @param {string} path @param {any} [body] @param {{ url?: string, type?: string }} [opt] */
  return async (method, path, body, { url, type = 'application/json' } = {}) => {
    const r = await fetchImpl(url ?? `${API}/${PACKAGE}/edits${path}`, { method, headers: { authorization: `Bearer ${token}`, ...(body != null ? { 'content-type': type } : {}) },
      body: body == null ? undefined : type === 'application/json' ? JSON.stringify(body) : body });
    if (!r.ok) throw Error(`NAMED STOP [PLAY_API] ${method} edits${(path || '').replace(/\/\d{6,}/, '/<edit>')} answered HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return method === 'DELETE' || r.status === 204 ? null : r.json();
  };
}

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const repoFile = (p) => readFileSync(new URL(p, root));

async function read(call, id, files) {
  const { tracks = [] } = await call('GET', `/${id}/tracks`);
  const { listings = [] } = await call('GET', `/${id}/listings`);
  const details = await call('GET', `/${id}/details`);
  const shots = {};
  // Only languages Play already lists have their own screenshots; a new language shows the default one's.
  for (const locale of Object.values(LOCALES).filter(l => listings.some(x => x.language === l))) {
    const { images = [] } = await call('GET', `/${id}/listings/${locale}/phoneScreenshots`);
    shots[locale] = shotsDiffer(images.map(i => i.sha256), files.shotHashes);
  }
  return { tracks, listings, details, shots };
}

/** The release itself, with every outside thing passed in (tests run it on a fake Play). Returns the exit code. */
export async function run(mode, code, { call, gate = sendStops, files, log = console.log }) {
  if (!['status', 'prepare', 'send'].includes(mode) || (mode !== 'status' && !code)) throw Error('NAMED STOP [USAGE] play-release.mjs status | prepare <versionCode> | send <versionCode>');
  // The gate comes before Play is touched at all: a send it refuses opens no edit.
  if (mode === 'send') {
    const found = await gate();
    if (found.length) { for (const s of found) log(`NAMED STOP [${s.code}] ${s.why}`); log('send refused by the release gate: nothing was sent to Play.'); return 2; }
  }
  let id, committed = false;
  try {
    ({ id } = await call('POST', ''));
    const { tracks, listings, details, shots } = await read(call, id, files);
    for (const t of tracks) for (const r of t.releases ?? []) log(`track ${t.track}: ${r.status} ${(r.versionCodes ?? []).join(',')} ${r.name ?? ''}`);
    const changes = listingChanges(listings, files.wanted);
    for (const c of changes) log(`listing ${c.locale}: differs in ${c.fields.join(', ')}`);
    for (const [locale, differ] of Object.entries(shots)) log(`phone screenshots ${locale}: ${differ ? 'differ from store/play' : 'same as store/play'}`);
    const emailDiffers = details?.contactEmail !== files.contactEmail;
    log(`contact email: ${emailDiffers ? `${details?.contactEmail ?? 'unset'} on Play, ${files.contactEmail} wanted` : `${files.contactEmail} (same)`}`);
    if (mode === 'status') return 0;
    const why = codeProblems(tracks, code);
    if (why.length) { for (const w of why) log(`NAMED STOP [CODE_REFUSED] ${w}`); return 2; }
    const prod = tracks.find(t => t.track === 'production');
    if (mode === 'prepare') {
      await call('PUT', `/${id}/tracks/production`, preparedTrack(prod, code, releaseNotes(files.notes)));
    } else {
      const track = sentTrack(prod, code);
      for (const c of changes) await call('PUT', `/${id}/listings/${c.locale}`, c.body);
      // The support address is set only here, after the gate's SUPPORT_ADDRESS_NOT_ON_DOMAIN stop cleared (live MX).
      if (emailDiffers) await call('PATCH', `/${id}/details`, { contactEmail: files.contactEmail });
      // A language added now gets the same set, so every listed language reads back as store/play.
      for (const c of changes) if (c.fields.includes('new language')) shots[c.locale] = true;
      for (const [locale, differ] of Object.entries(shots)) {
        if (!differ) continue;
        await call('DELETE', `/${id}/listings/${locale}/phoneScreenshots`);
        for (const bytes of files.shotBytes) await call('POST', '', bytes, { url: shotUploadUrl(id, locale), type: 'image/png' });
      }
      await call('PUT', `/${id}/tracks/production`, track);
    }
    await call('POST', `/${id}:commit`); committed = true;
    return await readBack(call, mode, code, files, log);
  } catch (e) {
    if (!committed) throw Error(`${e?.message ?? e} | nothing was committed to Play (the edit is deleted)`);
    throw Error(`${e?.message ?? e} | Play accepted the commit, but the read-back failed: run status to see what Play shows`);
  } finally { if (!committed && id) await call('DELETE', `/${id}`).catch(() => {}); }
}

/** After a commit, a fresh edit must show it: the release's status and, for send, every listing field, the contact
 *  email and each locale's screenshot hashes. Anything short of that is a NAMED STOP, never "done". */
async function readBack(call, mode, code, files, log) {
  const { id } = await call('POST', '');
  try {
    const after = await read(call, id, files);
    const want = mode === 'prepare' ? 'draft' : 'completed';
    const got = (after.tracks.find(t => t.track === 'production')?.releases ?? []).find(r => (r.versionCodes ?? []).map(String).includes(String(code)));
    const bad = [];
    if (got?.status !== want) bad.push(`versionCode ${code} reads back as ${got?.status ?? 'absent'}, not ${want}`);
    if (mode === 'send') {
      for (const c of listingChanges(after.listings, files.wanted)) bad.push(`listing ${c.locale} still differs in ${c.fields.join(', ')}`);
      for (const [locale, differ] of Object.entries(after.shots)) if (differ) bad.push(`phone screenshots ${locale} still differ from store/play`);
      if (after.details?.contactEmail !== files.contactEmail) bad.push(`contact email reads back as ${after.details?.contactEmail ?? 'unset'}`);
    }
    if (bad.length) { for (const b of bad) log(`NAMED STOP [NOT_ON_PLAY] ${b}`); return 2; }
    log(`OUTPUT play production: ${PACKAGE} versionCode ${code} is ${want === 'draft' ? 'a production DRAFT (not sent to Google)' : 'the completed production release (sent to Google review); listing, screenshots and contact email read back as store/'}.`);
    return 0;
  } finally { await call('DELETE', `/${id}`).catch(() => {}); }
}

/** The repo files a run compares Play with. */
export function repoFiles() {
  const shotBytes = SHOTS.map(repoFile);
  return {
    wanted: JSON.parse(repoFile('store/google-play.json').toString('utf8')).listings,
    notes: JSON.parse(repoFile('store/play-release-notes.json').toString('utf8')),
    shotBytes, shotHashes: shotBytes.map(hash), contactEmail: SITE.supportEmail,
  };
}

async function main(argv) {
  const raw = process.env.GOOGLE_PLAY_UPLOAD_SA_JSON;
  if (!raw) throw Error('NAMED STOP [SECRET_MISSING] GOOGLE_PLAY_UPLOAD_SA_JSON is not in the environment (run through vault:run)');
  const token = await gscToken(JSON.parse(raw), 'https://www.googleapis.com/auth/androidpublisher');
  process.exitCode = await run(argv[0], argv[1], { call: playCaller(token), files: repoFiles() });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(e => { console.error(e?.message ?? e); process.exitCode = 1; });
