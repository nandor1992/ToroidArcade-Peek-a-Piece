---
name: HomeScreen
type: screen
source: src/screens/HomeScreen.tsx
status: draft
last_verified: 2026-08-29
---

# HomeScreen

## Purpose

The first thing a toddler (or the parent handing them the phone) sees on
launch. It's a grid of puzzles to tap into — nothing else. Photos the parent
has uploaded always take priority over the bundled starter set, so the app
still nudges parents toward personalizing it, while the starter set means the
app is playable immediately, before any photo has been uploaded.

## How it works

`HomeScreen` takes the puzzle lists as props rather than reading storage
itself (storage isn't implemented yet — see Non-goals). It renders one
continuous grid — `[...userPuzzles, ...stockPuzzles]` chunked into rows of
two — rather than two visually separate sections: uploaded photos always
come first, starter puzzles (`stockPuzzles`, defaulting to the hardcoded
seven-puzzle `STARTER_PUZZLES` when no prop is passed) fill in after them,
with no header or divider marking where one group ends and the other
begins. A trailing odd tile does not stretch to fill its row (an invisible
spacer fills the other column).

Each tile renders the puzzle's artwork whenever it has any — resolved via
`puzzleImageSource` (see [[puzzleImage]]), which returns the bundled asset
module for a starter puzzle (`puzzle.imageAsset`) or `{ uri }` for a
parent-uploaded photo (`puzzle.imageUri`). Every `STARTER_PUZZLES` entry
now ships a hand-illustrated cartoon (`src/games/puzzle/assets/starter/`),
so starter tiles show a real picture rather than the old emoji stand-in.
The solid-color square (cycling through the palette's
teal/coral/violet/leaf/tangerine) with a puzzle-piece emoji is now only a
fallback for a puzzle with no artwork at all — which shouldn't occur with
the current data. Tapping a tile calls `onSelectPuzzle(puzzle)`;
`HomeScreen` has no navigation logic of its own — `App.tsx` is what turns
that callback into actually opening `PuzzleScreen`.

`STARTER_PUZZLES` lives here (rather than under `src/games/puzzle/`)
because it's the Home grid's default data; the artwork it points at does
live under the puzzle game's folder. It is exported so `App.tsx` can
combine it with
`userPuzzles` into the single ordered list `PuzzleScreen` browses with its
Next button — both screens need to agree on the same list and ordering.

A small lock button floats over the bottom-right corner of the grid
(`position: absolute`, `bottom: 12`, `right: 12`) and calls
`onOpenParentArea`. `App.tsx` routes it to `ParentGateScreen`, not
directly to `ParentScreen` — see that spec for the math-gate step in
between. Nothing system-drawn sits over that corner because the app runs
full screen with the status/navigation bars hidden (see
[`architecture.md`](../../architecture.md) → "Runs full screen"); an
Android navigation bar there previously covered this button.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `userPuzzles` | `Puzzle[]` | No | Defaults to `[]`. Rendered first in the grid. |
| `stockPuzzles` | `Puzzle[]` | No | Defaults to the bundled seven-puzzle `STARTER_PUZZLES` set. Rendered after `userPuzzles`. |
| `onSelectPuzzle` | `(puzzle: Puzzle) => void` | No | Called with the tapped puzzle. No-op if omitted. |
| `onOpenParentArea` | `() => void` | No | Called when the corner lock button is pressed. No-op if omitted. |

## Toddler UX constraints

- Each tile's touch target is at least 140x140 logical pixels
  (`tile.minHeight`), well above typical minimum tap-target guidance, and is
  the entire tile — no small icon within it needs precise tapping.
- Tapping anywhere on a tile always fires `onSelectPuzzle`; there is no
  mis-tap or invalid-state to report, so there is nothing to silently ignore.
- No text needs to be read to use the screen: each tile is a distinct color
  + glyph, and the puzzle title (`accessibilityLabel`) is exposed for screen
  readers but never required to identify or select a tile visually.
- Visual feedback on press: the tile dims (`opacity: 0.7`) while held. There
  is no audio feedback yet — no sound asset pipeline exists (see Non-goals).
- The parent-area lock button is a deliberate exception to the
  large-touch-target rule: it's small (40x40) and low-contrast
  (`opacity: 0.55` at rest), on purpose, since it's the one control on this
  screen that should *not* be easy for a toddler to find or hit.

## Edge cases & expected behavior

- No `userPuzzles` and no `stockPuzzles` override → grid is populated by
  the default `STARTER_PUZZLES` alone (seven tiles, each with cartoon art).
- `userPuzzles` non-empty → those tiles render first, immediately followed
  by `stockPuzzles` in the same grid (no visual break between them).
- `stockPuzzles={[]}` and `userPuzzles={[]}` → grid renders with zero rows
  (not currently given its own empty-state message — see Non-goals).
- Odd-length puzzle list (e.g. the default seven starter puzzles) → last
  row has one tile plus an invisible spacer, not a stretched double-width
  tile.
- Tapping a tile with no `onSelectPuzzle` passed → no-op, no crash.

## Test scenarios

1. Render with no props → the grid shows exactly the seven
   `STARTER_PUZZLES` (Meadow, Fairground, Climbing, Dinosaur, Tractor,
   Teddies, Christmas), in order.
2. Render with one `userPuzzles` entry → it's the first tile in the grid,
   immediately followed by all of `STARTER_PUZZLES` in order.
3. Tap the first tile → `onSelectPuzzle` is called with that tile's
   `Puzzle` (`id: 'stock-1'`).
4. Tap the corner lock button → `onOpenParentArea` is called.

## Non-goals / known limitations

- The bundled starter artwork under `src/games/puzzle/assets/starter/` is
  currently flat-color placeholder PNGs (a labelled circle per puzzle), to
  be replaced in-place with real cartoon illustrations — same filenames, no
  code change. The emoji + solid-color fallback path still exists for a
  puzzle with no artwork, but nothing in the current data hits it.
- No navigation library: `onSelectPuzzle` is a bare callback; `App.tsx`
  switches between `HomeScreen` and `PuzzleScreen` with a single piece of
  local state rather than a real nav stack (see `PuzzleScreen`'s spec).
- No persisted storage: `userPuzzles` must be passed in by whatever renders
  `HomeScreen`; this screen doesn't read `src/storage/` (not implemented).
- No explicit empty state for "zero puzzles at all" — shouldn't happen in
  practice since `stockPuzzles` always defaults to a non-empty set, but isn't
  guarded against explicitly.
- No audio feedback on tap (no sound asset pipeline in the project yet).

## Related

- Code: `src/screens/HomeScreen.tsx`
- Tests: `src/screens/HomeScreen.test.tsx`
- Types: `src/types/puzzle.ts`
- Palette: `src/theme/colors.ts`
- Starter artwork: `src/games/puzzle/assets/starter/`
- Related specs: [[PuzzleScreen]], [[ParentGateScreen]], [[ParentScreen]], [[SessionLockOverlay]], [[puzzleImage]]
