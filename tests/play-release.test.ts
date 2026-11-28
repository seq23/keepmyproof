import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { codeProblems, releaseNotes, preparedTrack, sentTrack, listingChanges, shotsDiffer, HIGHEST_BUILT } from '../scripts/store/play-release.mjs';
import play from '../store/google-play.json';

// Play as it stood on 27 Nov 2026 (status read): production serves 4, internal holds 4 and a draft of 5.
const live = (extra: object[] = []) => [
  { track: 'production', releases: [{ name: '1.0', versionCodes: ['4'], status: 'completed' }] },
  { track: 'internal', releases: [{ versionCodes: ['5'], status: 'draft' }, { versionCodes: ['4'], status: 'completed' }, ...extra] },
];
const withSix = live([{ versionCodes: ['6'], status: 'draft' }]);

test('only a code above 5 that is on the internal track and above what production serves may be released', () => {
  assert.deepEqual(codeProblems(withSix, '6'), []);
  assert.equal(HIGHEST_BUILT, 5);
  // vc5 was built 27 Nov and never sent: it may not be used again, even though it sits on internal.
  assert.match(codeProblems(live(), '5').join(), /not above 5/);
  assert.match(codeProblems(live(), '4').join(), /not above 5.*production already serves/);
  assert.match(codeProblems(live(), '6').join(), /not on the internal track/);
  assert.match(codeProblems(withSix, 'six').join(), /not a whole number/);
  assert.match(codeProblems(withSix, '').join(), /not a whole number/);
  // Production already serving a higher code refuses a lower one.
  const ahead = [{ track: 'production', releases: [{ versionCodes: ['9'], status: 'completed' }] }, ...withSix.slice(1)];
  assert.match(codeProblems(ahead, '6').join(), /production already serves versionCode 9/);
  // A failed read (no tracks) is never a clear.
  assert.match(codeProblems([], '6').join(), /no releases at all/);
});

test('release notes: every language present, none over Play\'s 500 characters, and the repo file passes', () => {
  const notes = JSON.parse(readFileSync(new URL('../store/play-release-notes.json', import.meta.url), 'utf8'));
  const out = releaseNotes(notes);
  assert.deepEqual(out.map(n => n.language), ['en-US', 'es-US', 'zh-CN', 'ko-KR']);
  assert.throws(() => releaseNotes({ ...notes, ko: '' }), /ko: no release notes/);
  assert.throws(() => releaseNotes({ ...notes, es: 'x'.repeat(501) }), /es: 501 characters/);
  assert.equal(releaseNotes({ ...notes, es: 'é'.repeat(500) })[1].text.length, 500);
});

test('prepare keeps what production serves and adds one draft; send needs that draft and makes it the one completed release', () => {
  const prod = live()[0];
  const notes = [{ language: 'en-US', text: 'x' }];
  const prepared = preparedTrack(prod, '6', notes);
  assert.deepEqual(prepared.releases.map(r => [r.versionCodes, r.status]), [[['4'], 'completed'], [['6'], 'draft']]);
  assert.equal(prepared.releases[1].name, '1.0 (6)');
  // An older draft is replaced, never kept beside the new one.
  const stale = { ...prod, releases: [...prod.releases, { versionCodes: ['5'], status: 'draft' }] };
  assert.deepEqual(preparedTrack(stale, '6', notes).releases.map(r => r.status), ['completed', 'draft']);
  const sent = sentTrack(prepared, '6');
  assert.deepEqual(sent.releases.map(r => [r.versionCodes, r.status]), [[['6'], 'completed']]);
  assert.deepEqual(sent.releases[0].releaseNotes, notes);
  assert.throws(() => sentTrack(prod, '6'), /NO_PRODUCTION_DRAFT/);
  assert.throws(() => sentTrack(prepared, '7'), /NO_PRODUCTION_DRAFT/);
  // Already completed (sent once) is not a draft: send refuses to resend it.
  assert.throws(() => sentTrack({ releases: [{ versionCodes: ['6'], status: 'completed' }] }, '6'), /NO_PRODUCTION_DRAFT/);
});

test('listing changes: only fields that differ, and a language Play does not list yet is added whole', () => {
  const wanted = play.listings;
  const same = Object.values(wanted).map(w => ({ language: w.locale, title: w.title, shortDescription: w.short, fullDescription: w.full }));
  assert.deepEqual(listingChanges(same, wanted), []);
  const changed = listingChanges(same.map(l => l.language === 'en-US' ? { ...l, fullDescription: 'old' } : l).filter(l => l.language !== 'ko-KR'), wanted);
  assert.deepEqual(changed.map(c => [c.locale, c.fields]), [['en-US', ['fullDescription']], ['ko-KR', ['new language', 'title', 'shortDescription', 'fullDescription']]]);
  assert.equal(changed[0].body.fullDescription, wanted.en.full);
});

test('screenshots differ unless Play holds exactly the repo images in order', () => {
  assert.equal(shotsDiffer(['a', 'b', 'c'], ['a', 'b', 'c']), false);
  assert.equal(shotsDiffer(['b', 'a', 'c'], ['a', 'b', 'c']), true);
  assert.equal(shotsDiffer(['a', 'b'], ['a', 'b', 'c']), true);
  assert.equal(shotsDiffer([], ['a', 'b', 'c']), true);
});
