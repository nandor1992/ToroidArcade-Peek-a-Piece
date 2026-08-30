---
name: ParentScreen
type: screen
source: src/screens/ParentScreen.tsx
status: draft
last_verified: 2026-08-30
---

# ParentScreen

## Purpose

Where a parent manages what's on `HomeScreen`: add a photo from the device
library, delete a previously-added one, and turn the bundled starter
puzzles on or off. Only reachable after `ParentGateScreen`, so — unlike
every other screen in the app — it doesn't need to be usable (or safe) for
a toddler poking at it; normal buttons, confirmations, and text are fine.

## How it works

`ParentScreen` is a controlled view: it holds no puzzle data itself, only
calling back to whatever owns the list (`App.tsx`):

- **Add Photos** calls `react-native-image-picker`'s `launchImageLibrary`
  with `selectionLimit: 0` — the OS picker lets the parent select any
  number of photos in one go. Each returned asset with a `uri` becomes a
  `Puzzle` (`source: 'user'`, `imageUri` = the asset URI, `title` from the
  asset filename or `"Photo"`), with ids `user-<timestamp>-<i>` so a batch
  doesn't collide; the whole array is passed to `onAddPuzzles`. `App.tsx`
  ([[usePersistentPuzzles]]) then **copies each photo's bytes into
  app-private storage** (rewriting `imageUri` to that durable copy —
  [[photoFiles]]), prepends the batch to `userPuzzles`, and persists.
  A cancelled / errored response (`didCancel` / `errorCode`), or one with
  no usable assets, is a no-op.
- **Delete** — a coral badge with the [[Icon]] `close` glyph in each
  thumbnail's top-right *corner* (`top: 4, right: 4`, white border) —
  shows a native confirmation (`Alert.alert`) before calling
  `onDeletePuzzle(id)`. `App.tsx` removes it from the persisted list *and
  deletes its copied file* ([[photoFiles]]). Deleting is permanent
  (local-only, no undo), so the confirm step is deliberate. The badge sits *inside* the
  corner rather than overhanging it, and the grid has `paddingTop`, so the
  first row's badges aren't clipped by the top of the list.
- **Show starter puzzles** is a `Switch` that directly reports its new
  value via `onToggleDefaultImages`; `ParentScreen` doesn't own that
  state either.
- **Settings** (the [[Icon]] `settings` / cog, top-right) calls
  `onOpenSettings` — `App.tsx` routes it to [[SettingsScreen]]
  (background-music volume/mute, screen-time limit). The back button is
  the `back` chevron icon.

The screen is titled **"Parent Controls"**, not "Parent Settings" — it
*contains* a Settings submenu (the cog above), and two nested levels both
called Settings read as the same destination. [[HomeScreen]]'s corner
button carries the matching `accessibilityLabel` "Parent controls".

Uploaded photos render as a 3-column thumbnail grid (`FlatList`,
`numColumns={3}`); an empty grid shows "No photos uploaded yet." instead.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `userPuzzles` | `Puzzle[]` | Yes | The parent's uploaded puzzles, rendered as the thumbnail grid. |
| `onAddPuzzles` | `(puzzles: Puzzle[]) => void` | Yes | Called with one `Puzzle` per picked photo (the picker allows selecting many). |
| `onDeletePuzzle` | `(id: string) => void` | Yes | Called with a puzzle's `id` after the delete confirmation is accepted. |
| `defaultImagesEnabled` | `boolean` | Yes | Current value of the starter-puzzles toggle. |
| `onToggleDefaultImages` | `(enabled: boolean) => void` | Yes | Called with the switch's new value. |
| `onBack` | `() => void` | No | Called when the back button is pressed. No-op if omitted. |
| `onOpenSettings` | `() => void` | No | Called when the settings (cog) button is pressed. No-op if omitted. |

## Edge cases & expected behavior

- Picker cancelled (`didCancel: true`) or errored (`errorCode` set) →
  `onAddPuzzles` is not called.
- Picker response with no assets that have a `uri` → `onAddPuzzles` is not
  called (an empty batch is dropped rather than passed through).
- Delete confirmation dismissed via "Cancel" → `onDeletePuzzle` is not
  called.
- `userPuzzles` is empty → grid is replaced by an empty-state message, not
  an empty `FlatList`.

## Test scenarios

1. Toggle the "Show starter puzzles" switch → `onToggleDefaultImages` is
   called with the new value.
2. Pick two photos → `onAddPuzzles` is called once with a two-element
   array; each carries its own `imageUri` / `title` / `source: 'user'`
   and a distinct `id`. The picker was invoked with `selectionLimit: 0`.
3. Cancel the picker → `onAddPuzzles` is not called.
4. Tap a photo's delete badge, confirm the alert's "Delete" option →
   `onDeletePuzzle` is called with that photo's id.
5. Tap the settings (cog) button → `onOpenSettings` is called.

## Non-goals / known limitations

- Puzzles added here **are** now persisted — `App.tsx`
  ([[usePersistentPuzzles]]) writes the list to AsyncStorage and copies
  each photo into app storage, so they survive a relaunch. Everything
  `SettingsScreen` controls (volume, mute, timer minutes) is still
  session-only by design.
- `ParentScreen` itself is unchanged by this — it still just builds
  `Puzzle[]` from picker assets and calls `onAddPuzzles`; the copy +
  persist happens above it.
- No editing of a puzzle's title, no reordering, no multi-select delete
  (multi-select *add* is supported).
- Requires `NSPhotoLibraryUsageDescription` (added to
  `ios/PeekaPiece/Info.plist`) for iOS photo library access; nothing
  additional is required for Android with this library.

## Related

- Code: `src/screens/ParentScreen.tsx`
- Tests: `src/screens/ParentScreen.test.tsx`
- Related specs: [[ParentGateScreen]], [[HomeScreen]], [[SettingsScreen]], [[Icon]], [[usePersistentPuzzles]], [[photoFiles]]
