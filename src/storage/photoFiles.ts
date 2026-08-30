import {
  DocumentDirectoryPath,
  copyFile,
  exists,
  mkdir,
  unlink,
} from '@dr.pogodin/react-native-fs';

// Uploaded photos are copied here — inside the app's private Documents
// directory — so they survive the OS purging the picker's temp/cache copy.
const PHOTO_DIR = `${DocumentDirectoryPath}/puzzles`;

function stripScheme(uri: string): string {
  return uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
}

/**
 * Copies a just-picked photo into app-private storage and returns a
 * `file://` URI to the copy. The destination name is derived from the
 * puzzle `id`, so re-adding is idempotent and delete is unambiguous.
 *
 * If the copy fails for any reason, returns `srcUri` unchanged — a photo
 * that might not survive a restart beats losing it outright. See
 * docs/specs/storage/photoFiles.md.
 */
export async function persistPickedPhoto(
  srcUri: string,
  id: string,
): Promise<string> {
  try {
    await mkdir(PHOTO_DIR);
    const destPath = `${PHOTO_DIR}/${id}.jpg`;
    if (await exists(destPath)) {
      await unlink(destPath);
    }
    await copyFile(stripScheme(srcUri), destPath);
    return `file://${destPath}`;
  } catch {
    return srcUri;
  }
}

/**
 * Deletes a persisted photo. Only touches files under our own
 * `puzzles/` directory (never an arbitrary picker URI), and ignores a
 * file that's already gone.
 */
export async function deletePersistedPhoto(uri: string): Promise<void> {
  const path = stripScheme(uri);
  if (!path.startsWith(PHOTO_DIR)) {
    return;
  }
  try {
    if (await exists(path)) {
      await unlink(path);
    }
  } catch {
    // Already gone / not writable — nothing more we can do.
  }
}
