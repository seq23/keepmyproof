# KeepMyProof

Private papers, photos and notes, organized on your phone. No account, ads,
analytics, AI processing, inbox access or automatic sharing. English and US
Spanish follow the phone. All five launch folders and suggested checklists come
from **topics.json**, the single topic catalog.

Free includes 25 items, app lock, both dates, checklist ticks, full-folder PDF,
original-file export, encrypted backup and restore. The limit stops **adding**.
Your existing papers, exports and backups remain accessible after Plus expires.
Plus adds unlimited items, custom folders, tags and PDFs selected by item or date.
The intended US list prices are $19.99/year and $39.99 lifetime. Nothing here
charges money; purchases use a sandbox provider or the non-purchasing mock.

## Run

Use Node 24 LTS and npm. Expo SDK 58.0.22 uses stable React Native 0.88.1
(the installed Expo compatibility table supplies module versions).

```sh
npm ci --no-audit --no-fund
npm run check
npm run ios       # local development build; requires Xcode
# or: npm run android  # requires Android SDK / emulator or a connected phone
npm start         # offline Metro, after the development build is installed
```

This is a native app; use a development build rather than a browser or Expo Go.
The app has no service backend or database migrations. Its SQLite database holds
only authenticated ciphertext; file bytes and metadata are encrypted together.
The device key lives in the platform secure store. See [architecture](docs/architecture.md).

## Backup, restore and exports

Setup shows a random 12-word recovery phrase once and requires the full phrase
again before finishing. The phrase is never saved or sent. Record it away from
the phone. Losing both the phone and phrase makes the encrypted backup unusable.

Backup creates a new encrypted `.kmp` file. Save it through the system share sheet
to your own iCloud Drive or Google Drive. In Backup, tap **Check the saved backup**,
choose that file, unlock when returning from the picker, then tap the check button
to verify it. Sharing alone never sets “last backup checked.” Every file hash and
the complete current snapshot must match before that date changes.

A fresh install can restore directly from the first screen with just the backup,
its phrase and a new app passcode. An existing installation merges missing items
without duplicates. Conflicting versions stop the entire restore so neither copy
is silently overwritten. Existing installations keep their own confirmed recovery
phrase for future backups. Wrong phrases, corrupt data and failed commits leave
live data untouched. Backups are separate files; a restore never rewrites one.

PDFs contain a cover/index, both dates, notes and earlier note versions, page
numbers, complete PDF attachments and photo pages. Other file formats are listed
and exported in the originals ZIP, whose file bytes are unchanged. Exported PDFs
and originals are readable by their recipients. Sharing requires your action.

V0 keeps a snapshot in memory and rewrites its encrypted blob transactionally.
Each imported file is limited to 25 MB; large total vaults need device memory
profiling before release. This is a source implementation, not a device-certified
or store-ready release.

## EAS build (no store submission)

The development, preview and production profiles in `eas.json` follow the same
profile structure as the reference app, without its server or validator kit.
An authorized operator with an **existing** Expo account and signing credentials
can link the project and run:

```sh
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform ios
# Once release gates below are resolved:
npx eas-cli build --profile production --platform all
```

Production auto-increments build numbers. These commands build binaries; there is
no submission workflow. This job has not created any accounts, uploaded binaries,
registered bundle IDs, configured store products, or invoked EAS. Do not choose
a paid build option. Local native builds avoid hosted build usage.

## Purchases and launch offer

`src/billing/provider.ts` is the only purchases interface. Without a supported key,
the UI previews normal prices, disables buy buttons, and restore cannot grant Plus.
Only `test_` RevenueCat **Test Store** keys are accepted in v0, injected through
`EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY` or `EXPO_PUBLIC_KMP_REVENUECAT_ANDROID_KEY`.
Do not put a key in git. Store-native sandbox keys require a separate release
configuration and device receipt testing before enabling that route.

The anonymous RevenueCat wrapper reads the `plus` entitlement, annual/lifetime
packages from the current offering, localized store prices, expiry and management
URL. Diagnostics and automatic device identifier collection are disabled. Annual
packages with trials or intro terms are rejected. No plan is preselected.

The launch label uses a store-returned, eligible, one-payment lifetime intro plus
RevenueCat offering `launchStartsAt` / `launchEndsAt` metadata. Those dates must
span at most one week. Without that evidence, only normal pricing is shown. There
is no local countdown or clock that invents an offer. The adapter re-reads products
at purchase. USD normal prices must match the approved list prices.

**Platform constraint:** Apple currently documents introductory/promotional offers
for auto-renewable subscriptions; lifetime unlock is a non-consumable. The current
RevenueCat product API does not provide an applicable standard lifetime promo
purchase path. Do not fake a discount or lower the list price to mimic one. The
owner's requested $29.99 lifetime launch promotion remains a named store-setup stop
until a supported store mechanism supplies and redeems that offer. Relevant primary
sources: [RevenueCat offers](https://www.revenuecat.com/docs/subscription-guidance/subscription-offers),
[lifetime products](https://www.revenuecat.com/docs/platform-resources/non-subscriptions).

## Checks and review

`npm run check` batches typecheck, behavior unit tests and the single safety runner.
CI runs it on PRs and main with a five-minute job limit. The restore round-trip test
runs in that suite: encrypted backup → wiped instance → phrase-only restore →
byte-for-byte comparison → restore again. Tests also inject disk failure,
interruption, corrupt/missing bytes and wrong phrases, and upgrade the v0 format.

`node scripts/prove-regressions.mjs` temporarily removes behavioral guards, demands
a failing test, and restores each source file in `finally`. See the recorded local
[verification evidence](docs/verification.md). It is a local proof tool, not another
CI validator. Safety checks live in `scripts/validate.mjs`, registered in
`validators.registry.json`; the central review matrix receives the same entries.
Private identity fingerprints and email/credential checks help prevent accidental
public disclosures. Human review must still reject real people/customer fixtures.

## Named stops

- **REVENUECAT_KEY_MISSING** — no key was available through the permitted environment.
  The mock cannot buy or unlock Plus. No vault, Keychain CLI or account was accessed.
- **LIFETIME_PROMO_STORE_SUPPORT** — lifetime intro/promo support must be verified in
  the stores and SDK before the requested launch offer can actually be sold.
- **DEVICE_RELEASE_GATE_PENDING** — this machine has Command Line Tools, no Xcode
  simulator. No physical device was attached for this job. The specified day-long
  encryption/backup/biometrics/file-provider checks and memory testing remain pending.
- **EAS_STORE_SETUP_MISSING** — no Expo project, signing credentials, store accounts
  or products were configured, and no native binary was built, deployed or submitted.
- **LEGAL_URLS_UNREACHABLE** — Terms and Privacy links are wired to keepmyproof.com;
  both live URL probes returned HTTP 000. Draft EN/ES policies are in `store/` for
  publication in the separately planned website step. Native Spanish review and
  privacy-label/store disclosure review must occur before release.

These release stops are visible limitations, not skipped or failing tests. No
hosted deployment or store launch is part of this repository's main CI.
