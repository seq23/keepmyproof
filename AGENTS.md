# Working rules

This repository is public. Use invented fixtures only. Never commit credentials,
personal contacts, customer records or private business data.
Read README.md and docs/architecture.md before changing data or billing paths.
Keep approved EN/ES/ZH/KO copy in src/strings.ts and topic definitions in topics.json.
Run `npm run check` once for typecheck, behavior tests and the safety runner.
For behavior fixes, demonstrate the regression by breaking the fix, seeing the
relevant test fail, and restoring it. Never pin prose in tests.
No analytics, accounts, automatic sharing, store submission or paid operations.
Only RevenueCat may use the app's network, plus the one Android review-code check in
src/billing/review.android.ts (Google Play's reviewer; Android bundle only); backup uses the system picker/share.
Every build behaves the same: no screenshot block, no review-only or remote-switched feature on iOS. The one
server-set thing is which store prices RevenueCat offers (the launch-week lifetime card, store/review-notes.md).
Keep one safety runner; register every check in validators.registry.json.
