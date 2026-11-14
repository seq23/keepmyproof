# Data and trust boundaries

The app is native Expo + TypeScript. Topic IDs, names and checklists in all four languages
come from topics.json. UI copy is in src/strings.ts. No backend exists.

## Vault

The core Vault receives an AtomicStore, a random source and a 256-bit device key.
The native adapter stores one AES-256-GCM authenticated envelope in a SQLite row
using an exclusive transaction, FULL synchronous commits and WAL. SQLite only sees
ciphertext, including in journals. Metadata, original base64 file bytes, hashes,
manual ticks, custom folders, custom checklist lines, hidden state and note revisions are inside the
ciphertext. Keys and passcode state are in the platform secure store with
WHEN_UNLOCKED_THIS_DEVICE_ONLY accessibility. Android automatic backup is disabled.

A six-digit app passcode gates access to the device key. It does not derive the
vault key. PBKDF2-SHA256 with a random salt and 600,000 iterations (OWASP Password Storage
Cheat Sheet) checks the code; records made before 6 Nov 2026 used 210,000 and are re-made at
600,000 on the next correct unlock. The derivation runs in the phone's crypto library
(`modules/kmp-kdf`: CommonCrypto / javax.crypto) off the UI thread; in Hermes JS it took ~25 s.
Failed guesses persist exponential delay up to one hour, never deletion. Biometric
unlock is opt-in and disables fallback to the phone's passcode. The biometric key
copy also requires platform authentication. A verified biometric or the confirmed
recovery phrase can reset the app code without reencrypting or erasing papers.

AppState inactive/background locks and destroys the active Vault, while native
screen-capture protection and iOS app-switcher blur hide the preview. The editor
and pending picker result resume behind a new unlock. Export operations already
requested by the user finish through the system share sheet. Plaintext temporary
PDFs/originals are deleted in finally. Cold startup also clears the SDK Print,
ImageManipulator, ImagePicker and DocumentPicker cache directories plus outgoing files.
A process kill can leave a plaintext temporary export until next startup; the OS
sandbox protects it, but this remains a device-review item. Exported copies at the
user's selected destination are intentionally outside this app's control.

## Recovery and backup

A cryptographically random 128-bit BIP39 mnemonic yields 12 checksum words. HKDF
SHA256 derives a dedicated 256-bit backup key from the mnemonic entropy, separate
from the random device key. Only the derived key is kept in secure store; the
phrase is displayed once and confirmed, then discarded from app state. English
recovery words are interoperable in both UI languages; interface instructions are
translated. Never translate or alter a user's recovery words.

Backups use a fresh random 96-bit nonce and authenticated purpose `backup-v1`.
Vault envelopes use a separate `vault-v1` purpose. Wrong keys, cross-purpose use,
modified ciphertext and invalid schemas fail closed. All original hashes are
verified before any transaction. Missing IDs merge, identical IDs deduplicate,
conflicting versions fail the entire restore. AtomicStore failure leaves both the
in-memory snapshot and persistent ciphertext unchanged. Backup read/check and
restore use the same schema/hash validation. A copied version-0 portable snapshot
upgrades tags/history to version 1; unknown future versions stop.

The phrase is never uploaded by the app. A backup shares only encrypted bytes.
The system picker/share, rather than a Drive/iCloud API or OAuth, controls cloud
access. A backup-check timestamp is written only after reading the saved copy and
matching its complete content digest. A stale copy never gets a fresh check date.
No restore path rewrites the prior backup. Each new backup gets a distinct filename.

## Billing and data rights

Entitlements are independent of the vault and never restored from backup. Plus
checks gate adding above 25, creating custom folders/tags/checklist lines, or requesting a selected
PDF. Full-folder PDF, file reads, originals, viewing and backup/restore never need
Plus. Existing custom-folder contents remain readable without Plus.

RevenueCat config is anonymous, Test Store only, without diagnostics or automatic
identifier collection. The mock never grants entitlements. There is no web checkout,
trial, preselected package, network client for records or automatic share. Terms,
Privacy and the VA accredited-help link open only on a user's tap. Store management
URLs come from RevenueCat; no content is sent with those links.

## Release scope

No binary deployment is automatic. Main's fast checks validate the source; the
release gates and missing configuration are named in README.md. A native device
walkthrough must test every permission, background/foreground transition, share
cancellation, full disk, interrupted restore, biometric enrollment change, loss
of secure-store state, large vault memory and a fresh-install cloud round-trip.
The simulated disk/interruption tests establish core atomicity, not OS certification.
