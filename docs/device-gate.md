# The device gate (Simulator)

The release gate (`scripts/release-gate.mjs`) refuses a store build until `release/device-gate.json` records the
11 Simulator checks (`SIMULATOR_CHECKS`) as passed for the version. They run free on GitHub's iOS Simulator:
`.github/workflows/device-gate.yml` (a push to a `device-gate/*` branch, or a manual run). The twelfth check, the
store purchase and restore, is her TestFlight Buy + Restore on a real iPhone (`record.mjs --purchase`).

## Two builds of one commit

| Build | What it is | Proven by |
|---|---|---|
| store | Release, no `EXPO_PUBLIC_KMP_` switch: what ships | `store-build-smoke`: installed over a vault, adds a PDF through the real file picker, backs up through the real share sheet, restores that file through the picker on a new install, every file byte checked |
| gate | the same app with `EXPO_PUBLIC_KMP_GATE=1`, which bundles `src/gate.ts` | the 11 checks |

Why the gate build: the app reads files only through the system document picker, hands backups only to the share
sheet, and keeps its keys in the Keychain. There is no way to give the store build a file without the picker (it
registers no document types, and adding one would change which files it accepts), and the picker ignored taps at
random in the old gate (runs 46158994320, 46163383574). `src/gate.ts` talks to the host through
`Documents/kmp-gate/` (see its header). It is compiled only into the gate build: `npm run bundle-scan` fails a store
bundle that carries it, the workflow greps both built apps, and the release gate refuses a store build with the
switch set.

## The checks (`scripts/device-gate/checks.ts`)

Every check starts from its own clean app state: app deleted, the Simulator's Keychain emptied, the build installed,
a known vault put in place (`vault-fixture.ts`: made with the app's own core code, 2 notes and 2 files, invented).
`old-data-upgraded` uses the committed fixture `scripts/device-gate/fixtures/old-b0531f3/`, made once with the core
code of b0531f3 (1.0 build 7, the build App Review last saw), Keychain entries included.

| Check | What it does |
|---|---|
| old-data-upgraded | b0531f3's vault opened by this build with its passcode; its backup holds every item and file hash |
| passcode-reset-face-id-and-phrase | Face ID enrolled and read by the app as enrolled (else not-run); reset with the 12 words, then with a Face ID match; each time the old passcode is refused and the new one opens the same 4 items |
| full-test-vault-backed-up | Back up now holds all 4 items, every file hash as saved; Check the saved backup says ✓ |
| fresh-install-restore-with-phrase-only | app deleted, Keychain emptied: Restore with the file, the 12 words and a new passcode gives back the 4 items |
| every-file-hash-matches | after that restore, a new backup equals the one before it byte for byte, and each file hashes to the file first saved |
| restore-twice-no-duplicates | the vault's own backup restored into it twice: 4 items both times |
| corrupt-or-missing-file-rejected | a file's bytes removed, altered under its hash, one ciphertext byte flipped, cut in half: each refused into the vault and on a new install |
| wrong-phrase-changes-nothing | a different valid phrase: refused into the vault and on a new install |
| full-disk-changes-nothing | the vault folder on a disk image filled with the vault open: ticking a line is refused on screen and nothing changes |
| interrupted-restore-changes-nothing | a 60 MB restore killed at each of its vault writes (written, not committed; the seam stops the app there): the vault is untouched every time, and the restore then runs to the end |
| app-switcher-preview-hidden | a folder open (OCR reads its titles on screen), the app sent to the background: OCR reads no title in any snapshot iOS keeps |

Results are `pass`, `fail` or `not-run`. A tap is made only where it reaches its target (`ui.ts` `clear()`: never
under the keyboard, the Save bar or the tab bar); a target that cannot be made clear, a Simulator that does not
answer, a picker that ignores three fresh tries are `not-run` (a test error), never a pass and never an app failure.
A failure is tried again on a clean state: failing twice is a SUSPECTED APP BUG (`gate.ts` `decide()`). Every try
keeps `screen.mp4`, `final.png`, `final-tree.json` and its Maestro steps under `evidence/<check>/try-<n>/` in the
group's artifact.

## Mutation proof

`scripts/device-gate/mutations/<check>.patch` breaks the app for one check (header: `# check:`, `# build:`,
`# breaks:`). A manual run with `mutate=<name|all>`, or a push to a `device-gate/mutate*` branch, builds one broken
app per patch and passes only when each broken app makes its check fail. A patch that no longer applies stops the
run (`GATE_MUTATION_STALE`).

## Recording a pass

`node scripts/device-gate/record.mjs <result.json> <run url>` writes `release/device-gate.json` only when all 11
checks and `store-build-smoke` passed.
