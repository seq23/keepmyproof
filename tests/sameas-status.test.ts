import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-ignore plain .mjs helper
import { sameAsVerdict } from "../scripts/lib/sameas-status.mjs";

test("a rate-limited or walled profile is not called dead (9 Nov 2026: Blogger 429)", () => {
  for (const s of [429, 403, 500, 503]) assert.equal(sameAsVerdict(s), "unverified", String(s));
});
test("a gone profile or no answer is dead", () => {
  for (const s of [404, 410, 0]) assert.equal(sameAsVerdict(s), "dead", String(s));
});
test("2xx and redirects are fine", () => {
  for (const s of [200, 301, 302]) assert.equal(sameAsVerdict(s), "ok", String(s));
});
