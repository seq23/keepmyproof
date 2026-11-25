# App Review notes (App Store Connect › App Review Information › Notes)

Paste the block below as it stands. It describes the build submitted, which is the build everyone gets.
`tests/store-build.test.ts` checks it exists and stays in the shipped build's terms; nothing here is sent by an agent.

---

KeepMyProof keeps copies of a person's own papers (photos, files, notes) on the device, encrypted, in folders with suggested checklists. There is no account, no sign-in and no server for papers.

Getting in: on first launch choose a language, then any 6-digit passcode (for example 135790), write down the 12 recovery words, and type them back. Home shows seven folders.

Free features: open a folder, + Add something (Take a photo, Choose photos, Choose a file, or a note), with the date it happened; Make a PDF of this folder, and Also save the original files; Backup › Back up now, then Check the saved backup; Restore a backup; Settings (Also open with Face ID, Change passcode, Make new recovery words, Hide folder, Erase everything on this device). Free covers 25 items.

Plus (in-app purchase, tested with a Sandbox Apple Account): Settings › See Plus › Subscribe for $19.99 a year, or Buy lifetime for $39.99. Restore purchases is on the same screen and in Settings; after subscribing, Settings also shows Manage or cancel subscription. Plus adds unlimited items, your own folders (Settings › + Create your own folder), Tags on the add screen, and a PDF of chosen items or dates with a cover page (in a folder: Make a PDF of this folder › Choose dates and a cover page).

Screenshots and screen recording work on every screen. When the app leaves the foreground it locks, and the App Switcher shows a blurred snapshot instead of the papers; nothing else changes.

This is the same build that goes to customers. There is no review mode, no test account, no review code and no hidden feature: everything above is in the app as submitted, and no server turns any of it on or off. Prices come from the App Store through RevenueCat; for one launch week the lifetime purchase may show a launch price ($29.99, with the normal $39.99 beside it), which is its own in-app purchase and unlocks the same Plus. The app's only network connections are RevenueCat and the App Store, for Plus.
