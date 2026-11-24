# App Store privacy label (App Privacy): what we declared and why

Published in App Store Connect on 16 Nov 2026 (app 6834891698). Every answer comes from the code on `main` at that date. The label is a legal statement to Apple, so when the app starts collecting something new, or stops, update this file and the label together.

Privacy policy URL on the label: `https://keepmyproof.com/privacy/`.

## Declared: Data Not Linked to You (none of it is used for tracking)

| Apple data type | Purpose | Where it comes from in the code |
|---|---|---|
| Purchase History | App Functionality, Analytics | RevenueCat (`src/billing/revenuecat.ts`) |
| User ID | App Functionality | RevenueCat's anonymous app purchase identifier. The policy names it. |

## Not declared, and why

- **Papers, photos, notes and dates stay encrypted on the phone.** The app's only network calls are RevenueCat and, on Android when a Google Play review code is typed, the review-code check (`src/billing/review.ts`, the one file `scripts/validate.mjs` lets call `fetch`, to `keepmyproof.com/api/review` only), which sends the code and the anonymous purchase ID, never papers. The iOS app never makes that call, so this App Store label is unchanged by it. The viewer WebView loads only local `file://` content with JavaScript off (`src/viewer.tsx`). Fonts are bundled.
- **Exports and encrypted backups go where the user chooses, through the share sheet.** We never receive them.
- RevenueCat runs with `diagnosticsEnabled: false` and `automaticDeviceIdentifierCollectionEnabled: false`. There is no analytics, crash or ad SDK, and no account.
- Tracking: none.

## Policy vs code

These match.
