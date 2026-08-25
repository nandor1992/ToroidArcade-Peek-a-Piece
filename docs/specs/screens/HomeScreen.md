---
name: HomeScreen
type: screen
source: src/screens/HomeScreen.tsx
status: draft
last_verified: 2026-08-25
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
itself (storage isn't implemented yet — see Non-goals). It builds up to two
sections:

1. **Your Photos** — `userPuzzles`, only rendered if non-empty.
2. **Starter Puzzles** — `stockPuzzles`, defaults to a hardcoded set of six
   placeholder puzzles (`STARTER_PUZZLES`) when no prop is passed.

Each section's puzzle list is chunked into rows of two and rendered via
`SectionList`, so the grid is two tiles wide per row, "Your Photos" above
"Starter Puzzles" whenever both are present. A trailing odd tile does not
stretch to fill its row (an invisible spacer fills the other column).

Each tile renders the puzzle's real photo (`Image`, `puzzle.imageUri`) when
one is set — true for anything added via `ParentScreen` — and otherwise
falls back to a solid-color square (cycling through the palette's
teal/coral/violet/leaf/tangerine) with a puzzle-piece emoji; that's still
what every `STARTER_PUZZLES` entry uses, since there's no real starter photo
set yet. Tapping a tile calls `onSelectPuzzle(puzzle)`; `HomeScreen` has no
navigation logic of its own — `App.tsx` is what turns that callback into
actually opening `PuzzleScreen`.

`STARTER_PUZZLES` is exported so `App.tsx` can combine it with
`userPuzzles` into the single ordered list `PuzzleScreen` browses with its
Next button — both screens need to agree on the same list and ordering.

A small lock button floats over the bottom-right corner of the grid and
calls `onOpenParentArea`. `App.tsx` routes it to `ParentGateScreen`, not
directly to `ParentScreen` — see that spec for the math-gate step in
between.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `userPuzzles` | `Puzzle[]` | No | Defaults to `[]`. Rendered first, section hidden when empty. |
| `stockPuzzles` | `Puzzle[]` | No | Defaults to the bundled `STARTER_PUZZLES` placeholder set. |
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

- No `userPuzzles` and no `stockPuzzles` override → only "Starter Puzzles"
  renders, populated by the default `STARTER_PUZZLES`.
- `userPuzzles` non-empty → "Your Photos" renders above "Starter Puzzles".
- `stockPuzzles={[]}` and `userPuzzles={[]}` → both sections are omitted;
  screen renders an empty list (not currently given its own empty-state
  message — see Non-goals).
- Odd-length puzzle list (e.g. 5 items) → last row has one tile plus an
  invisible spacer, not a stretched double-width tile.
- Tapping a tile with no `onSelectPuzzle` passed → no-op, no crash.

## Test scenarios

1. Render with no props → only the "Starter Puzzles" header is present, not
   "Your Photos".
2. Render with one `userPuzzles` entry → both headers present, "Your Photos"
   before "Starter Puzzles".
3. Tap the first tile → `onSelectPuzzle` is called with that tile's
   `Puzzle`.
4. Tap the corner lock button → `onOpenParentArea` is called.

## Non-goals / known limitations

- Starter puzzles still have no real photos — those tiles are solid-color
  placeholders with a fixed emoji, pending a bundled starter-photo set with
  confirmed redistribution rights. User-uploaded tiles do show the real
  photo now (see `ParentScreen`).
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
- Related specs: [[PuzzleScreen]], [[ParentGateScreen]], [[ParentScreen]]
