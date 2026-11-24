// The "lost data" count on /alternatives counts only reviews that say something a person kept was lost
// (review of #66, 21 Nov 2026: a bare lost|gone match counted "BUGS ARE GONE" and "the price has gone up").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countThemes } from '../scripts/measure-complaints.mjs';

const r = (body: string) => ({ title: '', body });
const NOT_LOSS = [
  'Most recent version solved everything. BUGS ARE GONE…! and it is working better than ever.',
  'The price has gone up 4 times in that period.',
  'Increased price for worse results is a quick way to lose customers.',
  'Gone downhill. This app used to work well.',
  'I am losing time with my children!!',
  'I just lost money for an app that I’m not even using.',
  'Placed into dispute with Apple and have had to report my card lost due to fraud.',
  'The feature where you could see the last time your co-parent signed in seems to be gone.',
  'Basic functionality has been lost.',
  'I thought I lost everything. But all my photos were stored.',
  'The conversations can’t be deleted or edited once they are sent.',
  'Keeps all my precious pics from being deleted',
  'Could you please make sure my videos are not lost?',
  'I erased some videos and photos by accident from my vault.',
  'Lose the videos when you load the app. Unnecessary.',
  'I guess I’ll have to delete it and end up losing all photos.',
];
const FILES = ['Lost all my photos by using this as backup.', 'PHOTOS GONE. This morning half are missing.', 'Sad to say lost over 2,000 photos and videos.', 'Everything is just gone', 'Why my data gone today?'];
const MESSAGES = ['With no explanation my account and all my messages are gone.', 'The amount of crashes and lost messages are incredibly high.', 'All this time and the thread is gone.'];

test('phrases that are not data loss are never counted as lost', () => {
  for (const p of NOT_LOSS) assert.equal(countThemes([r(p)]).lost, 0, p);
});

test('lost photos or files and lost messages are counted, each under what was lost, and once per review', () => {
  for (const p of FILES) { const c = countThemes([r(p)]); assert.equal(c.lost_files, 1, p); assert.equal(c.lost, 1, p); }
  for (const p of MESSAGES) { const c = countThemes([r(p)]); assert.equal(c.lost_messages, 1, p); assert.equal(c.lost, 1, p); }
  assert.equal(countThemes([r('All my photos and messages are gone.')]).lost, 1);
});
