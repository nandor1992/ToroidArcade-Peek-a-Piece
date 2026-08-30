/**
 * Web stand-in for the native `photoFiles` module.
 *
 * The web build is a demo: only the bundled starter puzzles, no parent area
 * and no photo upload (see docs/specs/app/DemoApp.md). Nothing here is ever
 * called at runtime — this file exists because `usePersistentPuzzles`
 * imports `photoFiles`, and the native implementation pulls in
 * `@dr.pogodin/react-native-fs`, which has no web build and would break the
 * bundle.
 *
 * This is also the seam a future full-parity web build would replace: store
 * the picked file's bytes as a Blob in IndexedDB and hand back an object URL
 * rehydrated on load (a plain object URL would not survive a reload).
 */

/** No-op: returns the picked URI unchanged. */
export async function persistPickedPhoto(
  srcUri: string,
  _id: string,
): Promise<string> {
  return srcUri;
}

/** No-op: there is no app-private file to delete on the web. */
export async function deletePersistedPhoto(_uri: string): Promise<void> {
  // Intentionally empty — see the module comment.
}
