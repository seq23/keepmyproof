# KeepMyProof

Private papers, photos and notes, organized on your phone. No account, ads,
analytics, AI processing, inbox access or automatic sharing. English, US Spanish,
Simplified Chinese and Korean (all written for US residents) follow the phone until
a language is picked on the first screen or in Settings; the pick is kept. All five
launch folders and suggested checklists come from **topics.json**, the single topic
catalog. Spanish, Chinese and Korean are marked for a native reader before launch
(`native_review` in topics.json); `tests/strings.test.ts` fails if any string, folder
name or checklist line is missing in any language, or would overflow a 390pt phone.
Chinese and Korean use the system fonts (no serif headings); Korean wraps by word.

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
To see every screen without a Mac or store account, see [preview](docs/preview.md).
The app has no service backend or database migrations. Its SQLite database holds
only authenticated ciphertext; file bytes and metadata are encrypted together.
The device key lives in the platform secure store. See [architecture](docs/architecture.md).

## Backup, restore and exports

Setup shows a random 12-word recovery phrase once and requires the full phrase
again before finishing. The phrase is never saved or sent. Record it away from
the phone. Losing both the phone and phrase makes the encrypted backup unusable.

Backup creates a new encrypted `.kmp` file. Save it through the system share sheet
to your own iCloud Drive or Google Drive. In Backup, tap **Check the saved backup**,
choose that file, then tap the check button
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

`src/billing/provider.ts` is the only purchases interface. Without a key, the UI
previews normal prices, disables buy buttons, and restore cannot grant Plus.
Keys come from `EXPO_PUBLIC_KMP_REVENUECAT_IOS_KEY` / `..._ANDROID_KEY` (EAS
secrets, never git): `test_` (RevenueCat Test Store) in any build, `appl_` on iOS,
`goog_` on Android. Diagnostics and device identifier collection are off. Annual
packages with trials or intro terms are rejected. No plan is preselected.

**Launch week ($29.99 lifetime, then $39.99).** Stores have no intro offer for a
one-time purchase, so the launch price is a second lifetime store product placed
in a RevenueCat offering made current for launch week, with offering metadata
`launchStartsAt` / `launchEndsAt` (at most 7 days). List prices always come from
the `default` offering. Inside the dates the paywall says "$29.99 for life, launch
week only, then $39.99" and sells the launch product; outside them it shows and
sells the list product even if the launch offering is still current. No clock or
countdown is in the app. USD list prices must equal $19.99 / $39.99.

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

## Website (keepmyproof.com)

`site/` builds the static site with plain Node and no network: `node site/build.mjs`
writes `site/dist/`. Hosting is the Cloudflare Pages git project `keepmyproof`
(root `site`, build `node build.mjs`, output `dist`): every push to main deploys,
www redirects to the apex. Never a bare `wrangler deploy`.

What it publishes, and from where:
- Home, Terms, Privacy, Support (EN `/`, ES `/es/`): `topics.json`, `store/*.md`.
- Five folder hubs with printable checklist PDFs in English, Spanish, Chinese
  (`/zh/`) and Korean (`/ko/`): `site/data/hubs.json`, `site/copy-cjk.mjs`,
  `site/pdf.mjs` (no email gate). Free checklists page: `/checklists`.
- State pages, one per state and subtopic: `site/data/facts/<folder>/*.json`
  (research files) + `site/data/verified/<folder>.json`. A fact is published only if
  `scripts/verify-facts.mjs` found its quote on the official source (plain curl,
  then a browser User-Agent; tags stripped, whitespace normalised). A state page
  publishes only with ≥3 verified facts, ≥2 of them state-specific (a claim no other
  state's page repeats; a state office's name and contact details count once),
  and no banned claim word (`site/lib/gate.mjs`). Spanish twins always; Chinese
  for divorce and Korean for executor once `scripts/translate-facts.mjs` (free
  OpenRouter models only) has translated the facts. Every non-English page is
  flagged for a native reader before the app launches.
- Free tools (`/tools`, `/es/herramientas`; all in the browser, nothing uploaded):
  photo location removal and redaction, photos into one dated PDF, deadline
  calculators built only from verified facts (`site/tools.mjs`,
  `site/data/tool-facts.json`), printable logs.
- KeepMyProof facts page (`/facts`), "alternative to" pages from counted review
  complaints (`scripts/measure-complaints.mjs` -> `site/data/alternatives.json`;
  competitor names on the website only), `llms.txt`, sitemaps split by folder
  (`/sitemap.xml` is the index), robots.
- Search-loop question pages (`site/questions/`, written by the shared engine,
  `search-loop.config.json`): published only if they pass the legal and VA gate
  in `site/build.mjs` (`questionGate`).

The one store switch is `SITE.stores` in `site/config.mjs`: until a URL is set,
every page says "Coming soon to Google Play" and shows no store link, offer or
rating; set it and every page shows the store button and the app schema gains
offers.

Jobs: `facts-refresh.yml` (weekly re-check of every source), `monthly-watch.yml`
(Vaultaire sitemap diff -> search-loop seeds; competitor review counts),
`ping-search.yml` (after a deploy is live: IndexNow, Bing, Search Console sitemap
submission through `scripts/ping-search.mjs`), `search-loop.yml` (daily pages).
`npm run validate` (`verified-facts`) and `tests/facts-gate.test.ts` guard the
gate; `tests/site.test.ts` checks canonicals, hreflang twins, sitemaps, store
switch and prices.

## Named stops

Store builds are refused in code until these clear: `npm run release-gate` (also
run by EAS through `eas-build-pre-install` when the profile is `production`)
prints each `NAMED STOP [CODE]` and exits 2.

- **REVENUECAT_KEY_MISSING**: no `appl_` / `goog_` RevenueCat keys. Needs the
  RevenueCat project and the App Store / Play accounts (the owner's $99 + $25).
- **DEVICE_RELEASE_GATE_PENDING**: `release/device-gate.json` must record every
  device check in `scripts/release-gate.mjs` as passed for the current version.
- **PRICE_RECHECK_PENDING / PRICED_BELOW_INCUMBENT**: `release/price-check.json`
  must hold the incumbent's App Store lifetime price, checked in the last 7 days;
  our list price may never be below it.
- **LEGAL_URLS_UNREACHABLE**: keepmyproof.com/terms and /privacy must answer 200
  (probed live on every run). The website publishes them from `store/`.
- **NATIVE_REVIEW_PENDING**: every language in topics.json `languages` other
  than English needs `native_review` set to "reviewed YYYY-MM-DD by …" after a
  native US reader checks the app strings, checklists and `store/<lang>.md`.
- **SUPPORT_ADDRESS_NOT_ON_DOMAIN**: `site/config.mjs` `supportEmail` must be an
  `@keepmyproof.com` address and the domain must have MX records (live lookup).
  support@keepmyproof.com forwards through Cloudflare Email Routing (set up 2 Nov 2026).

Without a key the app runs on the mock, which throws `REVENUECAT_KEY_MISSING` on
any purchase. Nothing here creates accounts, builds binaries or submits to a store.
