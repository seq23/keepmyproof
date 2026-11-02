# Working rules

This repository is public. Use invented fixtures only. Never commit credentials,
personal contacts, customer records or private business data.
Read README.md and docs/architecture.md before changing data or billing paths.
Keep approved EN/ES/ZH/KO copy in src/strings.ts and topic definitions in topics.json.
Run `npm run check` once for typecheck, behavior tests and the safety runner.
For behavior fixes, demonstrate the regression by breaking the fix, seeing the
relevant test fail, and restoring it. Never pin prose in tests.
No analytics, accounts, automatic sharing, store submission or paid operations.
Only RevenueCat may use the app's network; backup uses the system picker/share.
Keep one safety runner; register every check in validators.registry.json.
