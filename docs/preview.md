# Seeing the app before the store accounts

Every change to the app on `main` builds the iPhone app for the simulator (no Apple account, no
signing, nothing paid) in the **Simulator preview** workflow (`.github/workflows/preview.yml`).

## Tap through it in a browser

The build is put on Appetize, at one link that stays the same on every run. The link is printed in
the run's summary (Actions → Simulator preview → newest run). If the summary says
`NAMED STOP [APPETIZE_TOKEN_MISSING]`, the repo secret `APPETIZE_API_TOKEN` is not set; add it and
rerun. Set the repo variable `APPETIZE_PUBLIC_KEY` to pin the app (the summary shows the value);
without it the script finds the Appetize app whose note is `keepmyproof-preview`.

## Screenshots of every screen

The run walks every screen in English on an iPhone simulator with invented sample papers
(`.maestro/preview.yaml`, manual runs with screens=true only) and attaches **keepmyproof-preview-screens**: one PNG per screen,
numbered in order (`01-first.png` … `15-reset.png`). The summary lists them. The run fails if any
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

The preview build sets `EXPO_PUBLIC_KMP_PREVIEW=1`, which turns screenshot protection off so the
screenshots are not black. The release gate refuses a store build with it set (`PREVIEW_BUILD`).

## Appetize's 3-minute sessions

Appetize's free plan ends each session after about 3 minutes and starts the app fresh every time, which
is too short to set a passcode and confirm 12 words by hand. The preview build's first screen has
**"Preview only: skip to a sample vault ›"**: it sets up a vault (passcode 123456) with a few invented
papers and opens on My folders. It exists only when `EXPO_PUBLIC_KMP_PREVIEW=1`; the release gate
refuses a store build with that set (NAMED STOP `PREVIEW_BUILD`). Guard: `tests/preview-sample.test.ts`.
