#!/usr/bin/env bash
# THE DEVICE GATE on a Simulator (.github/workflows/device-gate.yml): the 12 release checks of
# scripts/release-gate.mjs DEVICE_CHECKS, run on the iOS Simulator with Maestro flows (.maestro/gate/) and host
# steps (install, uninstall, Face ID match, a full disk, a killed restore) that no flow can do. Invented papers only.
# Usage: run.sh <udid> <new.app> <old.app> <out dir>. Writes <out>/result.json: every check "pass" or "fail" with
# its evidence. A check this script did not reach stays "not-run", and not-run is never a pass.
set -uo pipefail
U="$1"; NEW="$2"; OLD="$3"; OUT="$4"; BID=com.keepmyproof.app
mkdir -p "$OUT/logs" "$OUT/shots" "$OUT/work"; W="$OUT/work"; RES="$OUT/checks.tsv"; : > "$RES"
CODE1=135790; CODE2=246802
record() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$RES"; echo "CHECK $1: $2 — $3"; }
flow() { # flow <name> [K=V ...] ; sets LAST_LOG; returns maestro's status
  local name="$1"; shift; n=$(( $(cat "$OUT/.n" 2>/dev/null || echo 0) + 1 )); echo $n > "$OUT/.n"; local args=(); for kv in "$@"; do args+=(-e "$kv"); done
  LAST_LOG="$OUT/logs/$(printf %02d $n)-$name.log"; echo "FLOW=$n" >> "$OUT/said.txt"
  ( cd "$OUT/shots" && maestro --device "$U" test "${args[@]}" --debug-output "$OUT/logs/dbg-$n" "$GITHUB_WORKSPACE/.maestro/gate/$name.yaml" ) > "$LAST_LOG" 2>&1
  local s=$?; echo "flow $n $name: exit $s"; [ $s = 0 ] || tail -25 "$LAST_LOG"; return $s
}
# What the last flow said (scripts/device-gate/said.py): only lines after that flow's own FLOW= marker, so a value
# from an earlier flow is never read as this one's.
said() { awk -v k="$1=" '/^FLOW=/{v=""} index($0,k)==1{v=substr($0,length(k)+1)} END{print v}' "$OUT/said.txt"; }
count() { said GATE_COUNT; }
tool() { (cd "$GITHUB_WORKSPACE" && npx tsx scripts/device-gate/backup-tool.ts "$@"); }
data() { xcrun simctl get_app_container "$U" "$BID" data 2>/dev/null; }
match_face() { sleep 3; xcrun simctl spawn "$U" notifyutil -p com.apple.BiometricKit_Sim.pearl.match; sleep 2; }
grab() { # grab <dest>: copies the newest backup file the app writes for its share sheet while flow backup runs
  local dest="$1"; rm -f "$dest"
  ( while true; do d=$(data); [ -n "$d" ] && f=$(find "$d" -name 'KeepMyProof-backup-*.kmp' -size +0 2>/dev/null | head -1) && [ -n "$f" ] && cp "$f" "$dest.part" && mv "$dest.part" "$dest"; sleep 0.3; done ) & GRAB=$!
}
grab_stop() { kill $GRAB 2>/dev/null; wait $GRAB 2>/dev/null; }

: > "$OUT/said.txt"; python3 "$GITHUB_WORKSPACE/scripts/device-gate/said.py" "$OUT/said.txt" & SAID=$!; trap 'kill $SAID 2>/dev/null' EXIT

# Files › On My iPhone: where the person keeps a backup; the document picker reads it from here.
xcrun simctl launch "$U" com.apple.DocumentsApp >/dev/null 2>&1; sleep 6; xcrun simctl terminate "$U" com.apple.DocumentsApp >/dev/null 2>&1
FILES="$(xcrun simctl get_app_container "$U" com.apple.DocumentsApp groups | awk '/FileProvider.LocalStorage/{ $1=""; sub(/^ /,""); print }')/File Provider Storage"
mkdir -p "$FILES" || { echo "NAMED STOP [GATE_NO_FILES] no Files storage on this Simulator"; exit 2; }
python3 "$GITHUB_WORKSPACE/scripts/device-gate/fixtures.py" "$FILES"
xcrun simctl spawn "$U" notifyutil -s com.apple.BiometricKit.enrollmentChanged 1
xcrun simctl spawn "$U" notifyutil -p com.apple.BiometricKit.enrollmentChanged

# 1. old-data-upgraded: a vault made by the build App Review last saw (21 Nov, b0531f3), opened by this build.
xcrun simctl install "$U" "$OLD"
if flow setup CODE=$CODE1 && WORDS="$(said GATE_WORDS)" && [ "$(wc -w <<<"$WORDS")" -eq 12 ] && flow add; then
  xcrun simctl install "$U" "$NEW"
  if flow unlock CODE=$CODE1 && [ "$(count)" = 4 ]; then record old-data-upgraded pass "vault of 4 items (2 notes, 2 files) made by b0531f3's build opened by this build with its passcode: Home counts 4"
  else record old-data-upgraded fail "after the upgrade Home counted '$(count)', not 4 ($LAST_LOG)"; fi
else record old-data-upgraded fail "setup or adding papers on the old build failed ($LAST_LOG)"; xcrun simctl install "$U" "$NEW"; fi
WORDS="${WORDS:-}"

# 2. passcode-reset-face-id-and-phrase
ok=1
flow reset-phrase NEWCODE=$CODE2 WORDS="$WORDS" SHOT=reset1 || ok=0
[ $ok = 1 ] && { flow unlock CODE=$CODE2 && [ "$(count)" = 4 ] || ok=0; }
# Each Face ID prompt is left open by its flow; the host then matches the enrolled face.
[ $ok = 1 ] && { flow faceid-on || ok=0; match_face; flow home SHOT=faceid-on || ok=0; }
[ $ok = 1 ] && { flow reset-faceid NEWCODE=$CODE1 || ok=0; match_face; flow home SHOT=faceid && [ "$(count)" = 4 ] || ok=0; }
[ $ok = 1 ] && { flow unlock CODE=$CODE1 && [ "$(count)" = 4 ] || ok=0; }
[ $ok = 1 ] && record passcode-reset-face-id-and-phrase pass "new passcode set with the 12 words, then with a Face ID match; each new passcode opens the same 4 items" \
  || record passcode-reset-face-id-and-phrase fail "see $LAST_LOG"

# 3. full-test-vault-backed-up (+ the file the person saved holds every item)
grab "$W/good.kmp"; flow backup SHOT=b1; grab_stop
if [ -s "$W/good.kmp" ] && cp "$W/good.kmp" "$FILES/gate-good.kmp" && S=$(tool summary "$W/good.kmp" "$WORDS") && flow check-backup FILE=gate-good.kmp SHOT=b1; then
  record full-test-vault-backed-up pass "Back up now made an encrypted file the 12 words open ($S); Check the saved backup on that file: ✓ Backup checked."
else record full-test-vault-backed-up fail "no backup file, or the check did not pass ($LAST_LOG)"; fi

# 4. corrupt-or-missing-file-rejected and 5. wrong-phrase-changes-nothing
ok=1; why=""
for how in missing changed flipped truncated; do
  tool corrupt "$W/good.kmp" "$FILES/gate-bad-$how.kmp" "$how" "$WORDS" || { ok=0; why="$why $how:not-made"; continue; }
  flow restore FILE="gate-bad-$how.kmp" WORDS="$WORDS" EXPECT="That did not finish.*|Those words did not match.*|This backup has a different.*" SHOT="bad-$how" FRESH=0 FAST=0 || { ok=0; why="$why $how:not-refused"; }
  flow home-count; [ "$(count)" = 4 ] || { ok=0; why="$why $how:count=$(count)"; }
done
[ $ok = 1 ] && record corrupt-or-missing-file-rejected pass "a file with one item's bytes removed, one with an item's bytes altered under its old hash, one flipped ciphertext byte and one cut in half: each refused, Home still 4" \
  || record corrupt-or-missing-file-rejected fail "$why"
WRONG=$(cd "$GITHUB_WORKSPACE" && npx tsx -e "import { phrase } from './src/core/crypto'; import { randomBytes } from 'node:crypto'; console.log(phrase(n => new Uint8Array(randomBytes(n))))")
if flow restore FILE=gate-good.kmp WORDS="$WRONG" EXPECT="That did not finish.*|Those words did not match.*" SHOT=wrong FRESH=0 FAST=0 && flow home-count && [ "$(count)" = 4 ]; then
  record wrong-phrase-changes-nothing pass "a valid but different 12-word phrase on the real backup: refused, Home still 4"
else record wrong-phrase-changes-nothing fail "not refused, or count '$(count)' ($LAST_LOG)"; fi

# 6. restore-twice-no-duplicates
ok=1
for k in 1 2; do flow restore FILE=gate-good.kmp WORDS="$WORDS" EXPECT="✓ Your backup was restored.*" SHOT="twice$k" FRESH=0 FAST=0 && [ "$(count)" = 4 ] || ok=0; done
[ $ok = 1 ] && record restore-twice-no-duplicates pass "the same backup restored twice into the vault that holds it: ✓ restored both times, Home 4 both times" || record restore-twice-no-duplicates fail "count '$(count)' ($LAST_LOG)"

# 7. full-disk-changes-nothing: the vault folder on a nearly full disk image while a save is tried.
xcrun simctl terminate "$U" "$BID" >/dev/null 2>&1; V="$(data)/Documents/vault"; cp -R "$V" "$W/vault-before"
KB=$(( $(du -sk "$V" | cut -f1) + 2048 ))
if hdiutil create -size ${KB}k -fs HFS+ -volname gatefull -layout NONE "$W/full.dmg" >/dev/null && hdiutil attach -nobrowse -mountpoint "$V" "$W/full.dmg" >/dev/null; then
  cp -R "$W/vault-before/." "$V/"
  # Leave 64 KB: enough to open the database, too little to write the vault's next copy.
  AV=$(df -k "$V" | awk 'NR==2{print $4}'); dd if=/dev/zero of="$V/.filler" bs=1k count=$(( AV > 64 ? AV - 64 : 0 )) 2>/dev/null; FREE=$(df -k "$V" | awk 'NR==2{print $4}'); echo "full disk: ${FREE} KB free"
  flow unlock CODE=$CODE1; before=$(count)
  flow add-one-note TITLE="Gate full disk note" SHOT=full; refused=$(said GATE_SAVE)
  xcrun simctl terminate "$U" "$BID" >/dev/null 2>&1; rm -f "$V/.filler"; mkdir -p "$W/vault-after"; cp -R "$V/." "$W/vault-after/"
  hdiutil detach "$V" >/dev/null || hdiutil detach -force "$V" >/dev/null
  rm -rf "$V"; mkdir -p "$V"; cp -R "$W/vault-after/." "$V/"
  if flow unlock CODE=$CODE1 && [ "$(count)" = 4 ] && [ "$before" = 4 ]; then
    record full-disk-changes-nothing pass "vault folder on a disk image with ${FREE} KB free: saving a note was tried (error shown: $refused), and after the disk was freed the vault opens with the same 4 items"
  else record full-disk-changes-nothing fail "before '$before', after '$(count)' ($LAST_LOG)"; fi
else record full-disk-changes-nothing fail "could not put the vault folder on a small disk image"; fi

# 8. interrupted-restore-changes-nothing: the app is killed the moment the Restore tap is done, on a 60 MB backup.
BIG=30; BIGN=$((4+BIG)); tool bigger "$W/good.kmp" "$FILES/gate-big.kmp" $BIG "$WORDS"; seen=""; cut=0; ok=1
for d in 0 0.5 1.5; do
  flow restore FILE=gate-big.kmp WORDS="$WORDS" EXPECT=x SHOT=cut FRESH=0 FAST=1 || { ok=0; seen="$seen restore-flow-failed"; break; }
  sleep $d; xcrun simctl terminate "$U" "$BID"
  flow unlock CODE=$CODE1 || { ok=0; seen="$seen unlock-failed"; break; }; c=$(count); seen="$seen ${d}s→$c"
  if [ "$c" = 4 ]; then cut=$((cut+1)); elif [ "$c" != "$BIGN" ]; then ok=0; fi
done
[ $ok = 1 ] && [ $cut -ge 1 ] && record interrupted-restore-changes-nothing pass "killed right after the Restore tap, plus a wait of${seen} (4 = untouched, $BIGN = finished): never a part-restored vault, and at least one kill left it untouched" \
  || record interrupted-restore-changes-nothing fail "counts:$seen (anything but 4 or $BIGN is a part restore; no 4 means no kill landed mid-restore)"

# 9. fresh-install-restore-with-phrase-only and 10. every-file-hash-matches
xcrun simctl uninstall "$U" "$BID"; xcrun simctl keychain "$U" reset; xcrun simctl install "$U" "$NEW"
if flow restore FILE=gate-good.kmp WORDS="$WORDS" NEWCODE=$CODE2 EXPECT="✓ Your backup was restored.*" SHOT=fresh FRESH=1 FAST=0 && [ "$(count)" = 4 ]; then
  record fresh-install-restore-with-phrase-only pass "app deleted, Keychain reset, installed again: Restore a backup with only the file and the 12 words (and a new passcode) gives back the 4 items"
  grab "$W/after.kmp"; flow backup SHOT=b2; grab_stop
  if [ -s "$W/after.kmp" ] && R=$(tool compare "$W/good.kmp" "$W/after.kmp" "$WORDS"); then record every-file-hash-matches pass "$R (backup before the reinstall vs a backup made after the restore, both opened with the 12 words)"
  else record every-file-hash-matches fail "${R:-no second backup}"; fi
else record fresh-install-restore-with-phrase-only fail "count '$(count)' ($LAST_LOG)"; record every-file-hash-matches fail "no restored vault to compare"; fi

# 11. app-switcher-preview-hidden: the snapshot iOS keeps for the app switcher, after leaving the app on a folder.
flow switcher SHOT=switch; xcrun simctl launch "$U" com.apple.Preferences >/dev/null; sleep 4
D="$(data)"; k=0; while IFS= read -r f; do k=$((k+1)); sips -s format png "$f" --out "$OUT/shots/switcher-snapshot-$k.png" >/dev/null 2>&1 || cp "$f" "$OUT/shots/"; done < <(find "$D/Library" -path '*Snapshots*' -type f -newer "$W/good.kmp" 2>/dev/null)
xcrun simctl io "$U" screenshot "$OUT/shots/gate-switch-home.png" >/dev/null 2>&1
record app-switcher-preview-hidden "look" "snapshots kept by iOS: $k (shots/switcher-snapshot-*.png); a person must see that no paper title is readable in them"

# 12. store-sandbox-purchase-and-restore (RevenueCat Test Store on the Simulator)
xcrun simctl launch "$U" "$BID" >/dev/null; flow unlock CODE=$CODE2
if flow purchase SHOT=buy; then record store-sandbox-purchase-and-restore pass "RevenueCat Test Store: Subscribe → test purchase → ✓ Plus is on → Restore purchases → ✓ Purchases checked"
else record store-sandbox-purchase-and-restore fail "see $LAST_LOG"; fi

# Maestro writes takeScreenshot files beside the flow, not in the working directory.
find "$GITHUB_WORKSPACE/.maestro" "$OUT/shots" -name 'gate-*.png' -newer "$OUT/said.txt" -exec cp {} "$OUT/shots/" \; 2>/dev/null
node -e '
  const fs = require("fs"); const [res, out, sha] = process.argv.slice(1);
  const DEVICE_CHECKS = JSON.parse(process.env.CHECKS);
  const rows = Object.fromEntries(fs.readFileSync(res, "utf8").trim().split("\n").filter(Boolean).map(l => { const [c, v, e] = l.split("\t"); return [c, { result: v, evidence: e }]; }));
  const checks = Object.fromEntries(DEVICE_CHECKS.map(c => [c, rows[c] ?? { result: "not-run", evidence: "the run never reached it" }]));
  fs.writeFileSync(out, JSON.stringify({ commit: sha, device: process.env.GATE_DEVICE, checks }, null, 2));
  for (const [c, r] of Object.entries(checks)) console.log(`${r.result.padEnd(7)} ${c}: ${r.evidence}`);
' "$RES" "$OUT/result.json" "${GITHUB_SHA:-local}"
