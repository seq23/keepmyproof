import { test } from 'node:test';
import assert from 'node:assert/strict';
import topics from '../topics.json';

test('the App Store keyword field fits the 100-character limit and carries the lead and vault terms', () => {
  const field = topics.store_keyword_field.en;
  assert.ok(field.length <= 100, `${field.length} characters`);
  assert.doesNotMatch(field, /\s/, 'Apple counts spaces; commas only');
  const words = field.split(',');
  assert.equal(new Set(words).size, words.length, 'no repeated word');
  assert.ok(words.every(Boolean), 'no empty entry');
  for (const w of ['divorce', 'custody', 'log', 'iep', 'binder', 'executor', 'papers', 'vault', 'hide', 'private']) assert.ok(words.includes(w), w);
  // Competitor names are never in store metadata (topics.json store_keyword_note).
  assert.doesNotMatch(field, /keepsafe|vaultaire|ourfamilywizard|appclose|talkingparents|alimentor/i);
});
