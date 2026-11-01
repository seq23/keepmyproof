// These are the SDK-owned cache directories used by our pickers and PDF renderer.
// Clear them at cold start, before showing a vault; never clear Documents or the live vault.
export async function clearTemporary(remove: (directory: string) => Promise<void>) {
  for (const directory of ['outgoing','Print','ImageManipulator','ImagePicker','DocumentPicker']) await remove(directory);
}
