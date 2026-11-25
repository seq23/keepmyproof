# Seeing the app before the store accounts

## The free web preview (the everyday look)

**https://keepmyproof-app-preview.pages.dev** always shows the newest build of `main`, in any
browser, on a phone or a laptop. Tap **"Preview only: skip to a sample vault ›"** to open a vault of
invented papers (passcode 123456), or go through the real first-run steps. A PR that changes the app
gets its own link, commented on the PR. Workflow: **App preview** (`.github/workflows/app-preview.yml`);
publisher and guard: `scripts/preview/host.mjs`. It costs nothing and uses no Appetize minutes;
Appetize (below) is only for the final look before a store submission.

What is different in a browser (stand-ins, in `src/native/*.web.ts` and `src/billing/revenuecat.web.ts`;
the phone builds never load them):

- **Nothing is kept.** The vault lives in the page's memory; a reload starts again at the first screen.
- **Choose a photo / file** adds sample pictures (two for photos, to show adding several) instead of opening the photo library or files.
- **Save the PDF, save originals, back up** say what the phone does; no file is made or downloaded.
- **Check / restore a backup** uses the backup made in the same visit.
- **Face ID** always says yes. **Purchases** are off and the Plus page says so, so the Plus-only
  screens (your own folder, your own checklist line, PDF of chosen items) cannot be opened.

The run fails with a NAMED STOP if the export has no app bundle (`PREVIEW_EXPORT_EMPTY`), if the
published address does not serve this build (`PREVIEW_NOT_SERVED`), if a bundle carries something
shaped like a key (`PREVIEW_HAS_SECRET`), or if Cloudflare refuses (`PREVIEW_HOST_FAILED`; the repo
secrets are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).

## The tap-through (every PR that changes the app)

After the preview is up, the **tap-through** job (boss-os `tap-through.yml`, driven by
`tap-through.json` here) taps through it like a person at 390 px in light and dark: first open,
restore a backup, the sample vault, a PDF, Settings, the Plus page and Restore purchases, the Plus
screens (`?plus=1` on the preview's address shows the app as a Plus member; web only) and Erase
everything. Its artifact `tap-through-<run id>` holds a video per journey and a screenshot per step.
It goes red on a dead button, a console error, an error screen, a step it cannot reach, or a line on
the Plus page with no screen behind it. A PR that adds a screen, button or Plus line adds it to
`tap-through.json`. Every request that is not a read is blocked, so nothing real is touched.

## The simulator build

Every change to the app on `main` builds the iPhone app for the simulator (no Apple account, no
signing, nothing paid) in the **Simulator preview** workflow (`.github/workflows/preview.yml`).

## Tap through it in a browser

The build is put on Appetize only when the workflow is started by hand with `appetize` ticked, at one link that stays the same on every run. The link is printed in
the run's summary (Actions → Simulator preview → newest run). If the summary says
`NAMED STOP [APPETIZE_TOKEN_MISSING]`, the repo secret `APPETIZE_API_TOKEN` is not set; add it and
rerun. Set the repo variable `APPETIZE_PUBLIC_KEY` to pin the app (the summary shows the value);
without it the script finds the Appetize app whose note is `keepmyproof-preview`.

## Screenshots of every screen

The run walks every screen in English on an iPhone simulator with invented sample papers
(`.maestro/preview.yaml`, manual runs with screens=true only) and attaches **keepmyproof-preview-screens**: one PNG per screen,
numbered in order (`01-first.png` … `16-reset.png`). The summary lists them. The run fails if any
screenshot is missing or blank (`scripts/preview/shots.mjs`). The zipped simulator build is
attached as **keepmyproof-simulator-build** (drag the unzipped `.app` onto a simulator to run it).

Download the newest screenshots:

```sh
gh run download -R seq23/keepmyproof -n keepmyproof-preview-screens -D ./shots \
  $(gh run list -R seq23/keepmyproof -w preview.yml -b main --status success -L 1 --json databaseId -q '.[0].databaseId')
```

## Rerun

Actions → Simulator preview → **Run workflow**, or `gh workflow run preview.yml -R seq23/keepmyproof`.
It also runs on PRs that change the preview itself.

## Adding a screen

A new value in `type Screen` (`app/index.tsx`) needs a `takeScreenshot: NN-<screen>` step in
`.maestro/preview.yaml`, or a `# not-shown: <screen> — <reason>` line. `npm run check` fails
otherwise (validator `preview-screens`).

The preview build sets `EXPO_PUBLIC_KMP_PREVIEW=1`. Its only effect is the sample-vault button below;
the app never blocks screenshots in any build. The release gate refuses a store build with it (or any
`EXPO_PUBLIC_KMP_` variable other than the two RevenueCat keys) set (`PREVIEW_BUILD`).

## Appetize's 3-minute sessions

Appetize's free plan ends each session after about 3 minutes and starts the app fresh every time, which
is too short to set a passcode and confirm 12 words by hand. The preview build's first screen has
**"Preview only: skip to a sample vault ›"**: it sets up a vault (passcode 123456) with a few invented
papers and opens on My folders. It exists only when `EXPO_PUBLIC_KMP_PREVIEW=1`: `app/index.tsx`
requires `src/preview.ts` only then, so no other build bundles its wording or sample data
(`npm run bundle-scan` checks the exported iOS and Android bundles), and the release gate refuses a store
build with that set (NAMED STOP `PREVIEW_BUILD`). Guards: `tests/preview-sample.test.ts`,
`tests/store-build.test.ts`.

## Google Play art and listing

`store/google-play.json` holds the Play title, short description (80) and full description (4000) in
en, es, zh and ko: the App Store listing in `store/<lang>.md`, word for word, plus the Play renewal line
and the terms and privacy links (`tests/play-listing.test.ts` holds it to that). `store/play/` holds the
512 icon, the 1024 x 500 feature graphic and three 1080 x 1920 phone screenshots; the Android adaptive
icon is `assets/app/adaptive-icon.png` on the brand green. Re-make them all on a Mac with
`node scripts/store/play-assets.mjs <dir with the App Store iPhone screenshots 01.png 02.png 03.png>`.
Nothing is sent to Google: the Play account (Redwood Reserve Holdings LLC) is not open yet.
