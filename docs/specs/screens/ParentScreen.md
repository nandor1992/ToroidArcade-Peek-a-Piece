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

- **Add Photo** calls `react-native-image-picker`'s `launchImageLibrary`.
  On a successful pick, it builds a new `Puzzle` (`source: 'user'`,
  `imageUri` set to the picked asset's URI, `title` from the asset's
  filename or `"Photo"` if none) and calls `onAddPuzzle`. A cancelled
  picker or an error response (`didCancel` / `errorCode` set) is a no-op.
- **Delete** — a coral badge with the [[Icon]] `close` glyph in each
  thumbnail's top-right *corner* (`top: 4, right: 4`, white border) —
  shows a native confirmation (`Alert.alert`) before calling
  `onDeletePuzzle(id)`. Deleting is permanent (local-only storage, no
  undo), so the confirm step is deliberate. The badge sits *inside* the
  corner rather than overhanging it, and the grid has `paddingTop`, so the
  first row's badges aren't clipped by the top of the list.
- **Show starter puzzles** is a `Switch` that directly reports its new
  value via `onToggleDefaultImages`; `ParentScreen` doesn't own that
  state either.
- **Settings** (the [[Icon]] `settings` / cog, top-right) calls
  `onOpenSettings` — `App.tsx` routes it to [[SettingsScreen]]
  (background-music volume/mute, screen-time limit). The back button is
  the `back` chevron icon.

Uploaded photos render as a 3-column thumbnail grid (`FlatList`,
`numColumns={3}`); an empty grid shows "No photos uploaded yet." instead.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `userPuzzles` | `Puzzle[]` | Yes | The parent's uploaded puzzles, rendered as the thumbnail grid. |
| `onAddPuzzle` | `(puzzle: Puzzle) => void` | Yes | Called with a new `Puzzle` after a successful photo pick. |
| `onDeletePuzzle` | `(id: string) => void` | Yes | Called with a puzzle's `id` after the delete confirmation is accepted. |
| `defaultImagesEnabled` | `boolean` | Yes | Current value of the starter-puzzles toggle. |
| `onToggleDefaultImages` | `(enabled: boolean) => void` | Yes | Called with the switch's new value. |
| `onBack` | `() => void` | No | Called when the back button is pressed. No-op if omitted. |
| `onOpenSettings` | `() => void` | No | Called when the settings (cog) button is pressed. No-op if omitted. |

## Edge cases & expected behavior

- Picker cancelled (`didCancel: true`) or errored (`errorCode` set) →
  `onAddPuzzle` is not called.
- Picker response has no `assets[0].uri` → `onAddPuzzle` is not called
  (defensive — shouldn't happen on a successful, non-cancelled pick).
- Delete confirmation dismissed via "Cancel" → `onDeletePuzzle` is not
  called.
- `userPuzzles` is empty → grid is replaced by an empty-state message, not
  an empty `FlatList`.

## Test scenarios

1. Toggle the "Show starter puzzles" switch → `onToggleDefaultImages` is
   called with the new value.
2. Pick a photo successfully → `onAddPuzzle` is called with a `Puzzle`
   carrying the picked `imageUri`, `title`, and `source: 'user'`.
3. Cancel the picker → `onAddPuzzle` is not called.
4. Tap a photo's delete badge, confirm the alert's "Delete" option →
   `onDeletePuzzle` is called with that photo's id.
5. Tap the settings (cog) button → `onOpenSettings` is called.

## Non-goals / known limitations

- No persisted storage: puzzles added here live only in `App.tsx`'s
  in-memory state and are lost on app restart, same limitation as
  `HomeScreen`/`PuzzleScreen`. The same is true of everything
  `SettingsScreen` controls (volume, mute, timer minutes).
- No editing of a puzzle's title, no reordering, no multi-select delete.
- `launchImageLibrary` is called with `selectionLimit: 1` — one photo per
  tap, not a batch upload flow.
- Requires `NSPhotoLibraryUsageDescription` (added to
  `ios/PeekaPiece/Info.plist`) for iOS photo library access; nothing
  additional is required for Android with this library.

## Related

- Code: `src/screens/ParentScreen.tsx`
- Tests: `src/screens/ParentScreen.test.tsx`
- Related specs: [[ParentGateScreen]], [[HomeScreen]], [[SettingsScreen]], [[Icon]]
