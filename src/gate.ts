// THE DEVICE GATE's seam (scripts/device-gate/, docs/device-gate.md). Bundled ONLY into the gate build: Metro builds it
// with EXPO_PUBLIC_KMP_GATE=1, and every other build folds `process.env.EXPO_PUBLIC_KMP_GATE === '1'` to false, so this
// file is not in the store bundle at all (scripts/bundle-scan.ts proves it; the release gate refuses a store build with
// the switch set). The store binary itself is proven end to end by the gate's store-build smoke check, which uses the
// real document picker and share sheet.
//
// Why it exists: the app reads a file only through the system document picker and hands a backup only to the share
// sheet, and its keys live in the Keychain. Those system screens are what made the old Simulator gate fail on test
// flakiness (picker ignoring taps, gate runs 46158994320 and 46163383574). The host talks to this seam through files in
// the app's own Documents/kmp-gate/ folder, which `xcrun simctl get_app_container` reaches:
//   keychain.json   written by the host before launch: Keychain entries this install is to hold (an old build's vault
//                   fixture, or a vault the host made with the app's own core code); written once at start, then deleted
//   status.json     written by the app at every start: Face ID hardware and enrollment as the app itself reads them, so a Face ID check never starts on a Simulator the app sees unenrolled
//   pick            one line, a file name in inbox/: the next "choose a file" returns that file's text (no picker);
//                   no pick file = the person cancelled
//   outbox/<name>   what the share sheet would have been handed (a backup file), byte for byte
//   arm             "<point> <n> <tag>": the n-th time the app reaches <point> after this arm, it writes at-<tag> and stops
//                   there for good, so the host can kill it at that exact place (interrupted restore)
import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuth from 'expo-local-authentication';

const dir = (...sub: string[]) => { const d = new Directory(Paths.document, 'kmp-gate', ...sub); d.create({ intermediates: true, idempotent: true }); return d; };
const file = (name: string, ...sub: string[]) => new File(dir(...sub), name);

/** Before the app's launch check: puts the host's Keychain entries in place, then reports Face ID as the app sees it. */
export async function beforeStart(options: SecureStore.SecureStoreOptions): Promise<void> {
  const k = file('keychain.json');
  if (k.exists) {
    const entries = JSON.parse(await k.text()) as Record<string, string>;
    for (const [key, value] of Object.entries(entries)) await SecureStore.setItemAsync(key, value, options);
    k.delete();
    await file('keychain-done').write(String(Object.keys(entries).length));
  }
  await writeStatus();
}

export async function writeStatus(): Promise<void> {
  const [hardware, enrolled, types] = await Promise.all([LocalAuth.hasHardwareAsync(), LocalAuth.isEnrolledAsync(), LocalAuth.supportedAuthenticationTypesAsync()]);
  await file('status.json').write(JSON.stringify({ hardware, enrolled, types, at: Date.now() }));
}

/** "Choose a file": the text of the file the host named in `pick`, or null (cancelled) when it named none. */
export async function pickText(): Promise<string | null> {
  const p = file('pick');
  if (!p.exists) return null;
  const name = (await p.text()).trim(); p.delete();
  const f = file(name, 'inbox');
  if (!name || !f.exists) throw Error('GATE_PICK_MISSING');
  return f.text();
}

/** The share sheet's file, kept in outbox/ for the host. */
export async function share(bytes: Uint8Array | string, filename: string): Promise<void> {
  const f = file(filename, 'outbox'); if (f.exists) f.delete();
  await f.write(bytes);
}

let armed = '', reached = 0;
/** A place the host may stop the app at (see `arm` above). Not armed: returns at once. */
export async function at(point: string): Promise<void> {
  const a = file('arm');
  if (!a.exists) return;
  const line = (await a.text()).trim(), [name, nth, tag] = line.split(' ');
  if (name !== point) return;
  if (line !== armed) { armed = line; reached = 0; }
  reached += 1;
  if (reached !== Number(nth)) return;
  await file(`at-${tag}`).write(String(Date.now()));
  await new Promise<never>(() => {});
}
