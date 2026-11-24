# Google Play Console answers: KeepMyProof (com.keepmyproof.app)

Paste-ready answers for the Play Console "App content" forms, read from the code on `main` (19 Nov 2026).
Each answer names the file and line it comes from. They match the App Store privacy label in
`docs/app-privacy.md`; when the app starts or stops collecting something, change this file, that one and
both store forms together. Nothing here has been entered in Play Console yet.

Privacy policy URL: `https://keepmyproof.com/privacy` (opened from the app, `app/index.tsx:253`).

## Data safety

**Does the app collect or share any of the required user data types?** Yes (purchases only).

| Play data type | Collected | Shared | Purpose | Required? | Source |
|---|---|---|---|---|---|
| Financial info → Purchase history | Yes, by RevenueCat (our service provider) and Google Play Billing | No | App functionality (unlock and restore Plus), Analytics (purchase counts) | Required to buy or restore Plus | `src/billing/revenuecat.ts:12,19-25`; policy `store/en.md:24-27` |
| Device or other IDs | Yes: RevenueCat's anonymous app user ID only (no advertising ID; automatic device identifier collection is off). On Android, when a Google Play review code is typed, the same ID and the code go to keepmyproof.com/api/review, which stores only a keyed hash of the ID, deleted 7 days after the grant ends | No | App functionality | Required while the store key is set | `src/billing/revenuecat.ts:12` (`automaticDeviceIdentifierCollectionEnabled: false`, `diagnosticsEnabled: false`); `src/billing/review.ts`, `site/server/review.mjs` |

**Not collected (answer "No" for every other type), and why:**

- **Photos, files and docs, notes, dates, checklists:** encrypted on the phone and never sent to us. The app's only network calls are RevenueCat and, on Android when a review code is typed, the review-code check, which sends the code and the anonymous purchase ID, never papers (`src/billing/review.ts`; `scripts/validate.mjs` refuses `fetch`, XMLHttpRequest or WebSocket in every other file of `app/` and `src/`, proved by `scripts/prove-safety.mjs`). The viewer loads only local `file://` content with JavaScript off (`src/viewer.tsx:16`).
- **Exports and encrypted backups** leave the phone only when the user sends them through the system share sheet to an app or drive they choose (`app/index.tsx`, `Share`). Play does not count a user-initiated transfer to another app as collection by us.
- **"How did you hear about us"** stays on the phone unless the user emails it from their own mail app (`src/core/heard.ts:28`, a `mailto:` link).
- **App activity, app info and performance, crash logs, diagnostics, location, contacts, messages, audio, health, personal info:** none. No analytics, crash, ad or attribution SDK in `package.json:22-53`. Location, contacts, microphone and media permissions are blocked (`app.config.ts:13-16`).

**Is all user data collected by your app encrypted in transit?** Yes. RevenueCat and Google Play Billing use HTTPS only.

**Do you provide a way for users to request that their data be deleted?** Yes.
- On the phone: Settings › "Erase everything on this phone" (`app/index.tsx:460,474-479`, `src/native/storage.ts:131`); deleting an item removes it and its earlier versions (`store/en.md:28-32`). Uninstalling removes the local vault (`allowBackup: false`, `app.config.ts:8`).
- Off the phone (the purchase record): email support@keepmyproof.com with the Google Play order number (GPA.…) from the receipt; we delete the matching RevenueCat customer record. Google keeps its own order history under the user's Google account.
- Deletion URL (Play asks for one only when the app has accounts; KeepMyProof has none, `store/en.md:30`): `https://keepmyproof.com/support`.

**Account creation:** none. **Independent security review:** no. **Families policy:** not in the Families program.

## Content rating (IARC questionnaire)

Category: **Utility, Productivity, Communication or other** (a private vault for the user's own papers).

| Question | Answer | Why |
|---|---|---|
| Violence, blood, sexual content, nudity, profanity, crude humour | No | No content of our own beyond folder names and checklists (`src/strings.ts`) |
| Drugs, alcohol, tobacco, gambling, simulated gambling | No | None in the app |
| Users can interact or exchange content with each other | No | No accounts, no chat (the only server route is the Play review-code check); sharing is the system share sheet to the user's own apps |
| Shares the user's current physical location with other users | No | Location permission blocked (`app.config.ts:13`) |
| Allows purchases of digital goods | Yes | KeepMyProof Plus, annual or lifetime (`src/billing/provider.ts:45`) |
| Unrestricted internet access (e.g. a browser) | No | The viewer is local-files-only with JavaScript off (`src/viewer.tsx:16`); fixed links (terms, privacy, va.gov, state rules) open the phone's own browser (`app/index.tsx:252-253,353,367`) |
| Content is user-generated and shown to other users | No | Papers stay on the user's phone |

Expected rating: Everyone / PEGI 3 / USK 0.

## Target audience and content

- **Target age:** 18 and over only. The folders are adult papers (VA disability, workplace, divorce, executor, IEP for parents; `src/strings.ts`), the terms speak to the adult owner of the papers (`store/en.md:34-50`), and there is no child-directed content or age gate in `app/` or `src/`.
- **Appeals to children:** No. **Store listing could unintentionally appeal to children:** No.

## Ads

**Does your app contain ads?** No. No ad SDK in `package.json:22-53`; the Play listing says "No ads" (`store/google-play.json`, `en.full`).

## App access (notes for the reviewer)

Choose **"All or some functionality is restricted"**, then Sign in details: Username `No account needed`, Password = the review code (vault `KMP_PLAY_REVIEW_CODE`; the owner pastes it, agents never type it), tick full access including paid content, and paste in "Any other instructions" (must stay at most 500 characters; `tests/review-unlock.test.ts` checks it):

> No account. On first launch choose any 6-digit passcode (e.g. 135790), write down the 12-word recovery phrase, type it back. Free: seven folders, 25 items, PDFs, backup. To open Plus free: Settings > See Plus > Have a review code? (foot of the screen), type the 10-digit code from the password field, tap Use this code. Plus opens for 7 days. The code check sends only the code and an anonymous purchase ID; your papers never leave the phone.

(The code is checked on keepmyproof.com, `site/server/review.mjs`: Android only, 7 days of Plus per phone, at most 10 phones per code version, switched off by unsetting `REVIEW_UNTIL` on the Pages project. The passcode and phrase flow: `app/index.tsx`, screens `setup`, `phrase`, `confirmPhrase`.)

## Other declarations

| Form | Answer | Why |
|---|---|---|
| Financial features | None | Stores papers; no banking, loans, payments between people, crypto or trading |
| Health apps | No / none | No health features; the app gives no medical advice (`site/disclaimer.mjs:55`) |
| Government apps | No | Not made by or for a government; not affiliated with the VA (`store/google-play.json`, `en.full`) |
| News apps | No | No news content |
| COVID-19 contact tracing or status | No | |
| Data safety: advertising ID | Does not use the advertising ID | No ad or attribution SDK; RevenueCat device identifier collection off (`src/billing/revenuecat.ts:12`) |
| AI-generated content | No generative AI in the app | No model call exists (the app's only network calls are RevenueCat and the Android review-code check, `src/billing/review.ts`); `store/en.md:20` "We never send your papers to a model" |
| Photo and video permissions declaration | Not needed | `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` blocked (`app.config.ts:14`); the system photo picker needs no permission |

## Android permissions in the built manifest

Read from the APK of the free EAS Android build of `main` 96bc011 (build 2c2fcde4, 19 Nov 2026), binary manifest parsed:
`INTERNET`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, `VIBRATE`, `DETECT_SCREEN_CAPTURE`, `ACCESS_NETWORK_STATE`,
`com.android.vending.BILLING`, and the app's own `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. None needs a Play
declaration form. From 21 Nov 2026 the build also carries `CAMERA` for "Take a photo" (asked only when tapped; the photo goes
straight into the app, never to the gallery; re-read from the next APK). Camera needs no Play declaration form. Every permission in `blockedPermissions` (`app.config.ts:13-16`) is absent.
