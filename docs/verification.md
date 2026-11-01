# Verification evidence

This is source-level evidence, not a store release or native device receipt.

- Node 26 local / Node 24 LTS CI target. Expo's installed SDK 58 compatibility
  table checks stable RN 0.88.1 and all installed native module versions.
- `npm run check`: TypeScript, behavior tests and the three registered safety checks.
- `npm run bundle`: Metro produced iOS and Android Hermes bundles (about 30 seconds
  locally). This compiles JavaScript, not native binaries or platform permissions.
- `node scripts/prove-regressions.mjs`: removed one guard at a time, observed the
  relevant test fail, restored the file. Proved item limit, ciphertext privacy,
  file hash validation, restore idempotency, commit atomicity, free export,
  edit/delete confirmation, passcode verification, recovery reset, biometric
  verification, offer expiration, complete PDF attachment pages, and user-date
  validation, approved list prices, temporary-export cleanup and original ZIP export. During this exercise the corruption test was strengthened to use
  an unrelated target vault, so restore-conflict rejection cannot mask a missing
  hash check. No wording or style tests were added.
- Backup fixtures contain random bytes, a long document payload, odd/non-Latin
  filenames, unknown dates, notes, and real PDF/photo exports. Fresh-key restore
  compares each original byte/hash and restores twice without duplicates.
- Both legal URL probes returned HTTP 000; they have not been confirmed live.
- Xcode is not installed (CommandLineTools only), so the prescribed native device
  release gate has not been performed. No EAS build or store submission ran.

The in-memory disk/interruption injections prove that a rejected AtomicStore
commit leaves live state and prior backup data untouched. Native full-disk,
process-kill and cloud file-provider scenarios still need physical-device tests.
