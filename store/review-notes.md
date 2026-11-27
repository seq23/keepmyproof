# App Review notes (App Store Connect › App Review Information › Notes)

Paste the block below as it stands. It describes the build submitted, which is the build everyone gets.
`tests/store-build.test.ts` checks it exists and stays in the shipped build's terms; `tests/store-truth.test.ts`
counts Home's folders from `src/core/model.ts` (`appFolders`) and checks the products and prices it names.
Nothing here is sent by an agent.

Before pasting (App Store Connect, done by the owner or coordinator, never an agent):
- In-app purchases on version 1.0: attach `kmp_plus_annual` and `kmp_plus_lifetime` (the two the block names).
  Leave `kmp_plus_lifetime_launch` off this submission: App Review would not find it in the app (the RevenueCat
  `launch` offering is not current), which reads as an unfindable purchase. Submit it on its own after 1.0 is approved.
- RevenueCat: keep `default` the current offering while 1.0 is in review (read 24 Nov 2026: `default` current,
  `launch` not current, no launch dates), so the Plus screen shows exactly the prices below.

---

Build 1.0 (8).

KeepMyProof keeps copies of a person's own papers (photos, files, notes) on the device, encrypted, in folders with suggested checklists. There is no account, no sign-in and no server for papers.

Getting in: on first launch choose a language, then any 6-digit passcode (for example 135790), write down the 12 recovery words, and type them back. Home shows eight folders: seven with suggested checklists, and Private.

Free features: open a folder, + Add something (Take a photo, Choose photos, Choose a file, or a note), with the date it happened; Make a PDF of this folder, and Also save the original files; Backup › Back up now, then Check the saved backup; Restore a backup; Settings (Also open with Face ID, Change passcode, Make new recovery words, Hide folder, Erase everything on this device). Free covers 25 items.

Plus (in-app purchase, tested with a Sandbox Apple Account): Settings › See Plus › Subscribe for $19.99 a year, or Buy lifetime for $39.99. Restore purchases is on the same screen and in Settings; after subscribing, Settings also shows Manage or cancel subscription. Plus adds unlimited items, your own folders (Settings › + Create your own folder), Tags on the add screen, and a PDF of a date range with a cover page (in a folder: Make a PDF of this folder › Choose dates and a cover page).

Screenshots and screen recording work on every screen. When the app leaves the foreground it locks, and the App Switcher shows a blurred snapshot instead of the papers; nothing else changes.

This is the same build that goes to customers. There is no review mode, no test account, no review code and no hidden feature: everything above is in the app as submitted. We do not hide or unlock any feature remotely: Plus comes only from an App Store purchase, checked through RevenueCat. Apart from that purchase check, the one thing set from a server is which App Store prices RevenueCat offers: a one-week launch price for the lifetime purchase appears only if we make a launch offering live in RevenueCat and the App Store returns that product. No launch offering is live, and that purchase is not part of this submission, so the Plus screen shows only the two prices above. Plus is the two in-app purchases above, the yearly subscription (kmp_plus_annual) and the lifetime purchase (kmp_plus_lifetime); their prices come from the App Store through RevenueCat. The app's only network connections are RevenueCat and the App Store, for Plus.
