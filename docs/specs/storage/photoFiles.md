---
name: photoFiles
type: service
source: src/storage/photoFiles.ts
status: draft
last_verified: 2026-08-30
---

# photoFiles

## Purpose

Uploaded family photos have to survive an app relaunch. The picker
(`react-native-image-picker`) hands back a URI to a copy it made in a
temp / cache directory the OS is free to purge. This module copies the
bytes somewhere durable — the app's private Documents directory — and
manages that copy's lifecycle.

## How it works

Uses `@dr.pogodin/react-native-fs`. All copies live under a single
directory: `` `${DocumentDirectoryPath}/puzzles` `` (`PHOTO_DIR`).

- **`persistPickedPhoto(srcUri, id)`** →
  1. `mkdir(PHOTO_DIR)` (idempotent).
  2. destination is `` `${PHOTO_DIR}/${id}.jpg` `` — named by the puzzle id,
     so re-adding the same id overwrites rather than piling up, and delete
     is unambiguous. If it already exists, `unlink` it first.
  3. `copyFile(stripScheme(srcUri), destPath)` — the `file://` prefix is
     stripped because RNFS wants filesystem paths.
  4. returns `` `file://${destPath}` ``.
  - **On any thrown error, returns `srcUri` unchanged.** A photo that might
    not survive a restart is still better than dropping the upload.
- **`deletePersistedPhoto(uri)`** — strips the scheme, and **only acts if
  the path is inside `PHOTO_DIR`** (never touches an arbitrary picker URI
  that was kept as-is by the fallback above). `unlink`s the file; a
  missing file is ignored.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `persistPickedPhoto` | `(srcUri: string, id: string) => Promise<string>` | Returns the new `file://` URI, or `srcUri` on failure. |
| `deletePersistedPhoto` | `(uri: string) => Promise<void>` | No-op unless `uri` is under `puzzles/`. |

## Toddler UX constraints

Not user-facing. Indirect: the child's photos don't silently disappear
between sessions.

## Edge cases & expected behavior

- `copyFile` throws (permissions, disk full) → `persistPickedPhoto` returns
  the original `srcUri`; the puzzle is still added, just not on a durable
  path.
- Same `id` persisted twice → the second copy replaces the first (old file
  unlinked).
- `deletePersistedPhoto` on a URI outside `PHOTO_DIR` → does nothing (no
  `unlink` call).
- `deletePersistedPhoto` on a file that's already gone → resolves, no throw.

## Test scenarios

`src/storage/photoFiles.test.ts` against the in-memory RNFS mock:
1. Persist a pick → `copyFile` called with the scheme-stripped source and
   the `puzzles/<id>.jpg` destination; returned URI is `file://…<id>.jpg`.
2. Persist over an existing id → old file `unlink`ed first.
3. `copyFile` rejects → the original URI comes back.
4. Delete a file inside `puzzles/` → `unlink`ed and gone.
5. Delete a URI outside `puzzles/` → `unlink` never called.
6. Delete an already-missing file → resolves cleanly.

## Non-goals / known limitations

- No image resizing / re-encoding — the picked file is copied byte-for-byte
  (and always named `.jpg` regardless of the real format; fine for
  `<Image>` / Skia which sniff content, not extension).
- No dedupe across different ids pointing at the same source photo.
- No orphan sweep — a file is only removed when its puzzle is explicitly
  deleted. A corrupted `userPuzzles` entry dropped by [[puzzleStore]]'s
  shape-guard would leave its file behind.

## Related

- Code: `src/storage/photoFiles.ts`
- Tests: `src/storage/photoFiles.test.ts`
- Mock: `__mocks__/@dr.pogodin/react-native-fs.js` (in-memory file set)
- Related specs: [[usePersistentPuzzles]], [[puzzleStore]], [[ParentScreen]]
