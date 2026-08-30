---
name: HomeScreen
type: screen
source: src/screens/HomeScreen.tsx
status: draft
last_verified: 2026-08-30
---

# HomeScreen

## Purpose

The first thing a toddler (or the parent handing them the phone) sees on
launch. It's a grid of puzzles to tap into — nothing else. Photos the parent
has uploaded always take priority over the bundled starter set, so the app
still nudges parents toward personalizing it, while the starter set means the
app is playable immediately, before any photo has been uploaded.

## How it works

Behind everything sits a full-bleed background: `src/assets/home-bg.jpg`,
a cartoon farm scene, pre-blurred and paled at build time and then drawn
at `opacity: 0.5` over the cream page colour — enough to feel like a
place, not enough to fight the puzzle tiles for attention. It's an
absolutely-positioned `Image` under a transparent `SafeAreaView` (rather
than the deprecated `ImageBackground`), sized explicitly to the full
window (`useWindowDimensions`) with `resizeMode="cover"` so it always
fills the screen, cropping whichever of width/height overflows. The
[[AppHeader]]'s opaque cream
band covers it at the top; the tiles (opaque photos / colours) sit over it;
it shows through the gaps.

Then the slim [[AppHeader]] (logo + "Peek-a-Piece"), then the puzzle grid.

`HomeScreen` takes the puzzle lists as props rather than reading storage
itself (storage isn't implemented yet — see Non-goals). It renders
uploaded photos first, then the bundled starter set (`stockPuzzles`,
defaulting to the hardcoded eight-puzzle `STARTER_PUZZLES` when no prop is
passed). `buildGrid` turns the two lists into a single `FlatList` `data`
of `{ kind: 'row', puzzles, colorBase }` and `{ kind: 'divider' }` items:
each group is chunked into its own rows (the two groups never share a
row), and a thin `divider` rule is inserted between them **only when
there's an uploaded group *and* a starter group** — no uploads, or
starters toggled off, means no divider.

**Responsive column count.** `columnsForViewport(width, height)` (both
from `useWindowDimensions()`) picks the grid width. `columnsForWidth`
gives the landscape baseline: **4 columns at >= 700dp** (a typical tablet
— so the eight starter puzzles form a tidy 4x2), 3 at >= 520dp, 2 below
that (a phone). Then, **when the viewport is portrait** (`height > width`),
that count is halved and floored at 2 (`max(2, round(columns / 2))`) — so
rotating a tablet upright "rotates" the grid: a 4-wide 4x2 becomes a
2-wide 2x4, a phone stays at 2. It all recomputes on rotation / window
resize. The `FlatList` is keyed `cols-{columns}` so it rebuilds cleanly
when that changes. A short last row is padded with `columns - row.length`
invisible spacer views so its tiles keep their natural size instead of
stretching to fill the width.
Tile background colours cycle continuously through the palette by absolute
grid position (`colorBase + colIndex`), carrying across the divider.

**Completion badge.** `completedPuzzleIds` (from `App.tsx` via
[[usePersistentPuzzles]]) is turned into a `Set`; any tile whose
`puzzle.id` is in it renders a small green circular check badge
(`colors.leaf`, white border, `Icon name="check"`) pinned to its
top-right corner, and sets `accessibilityState={{ selected: true }}`. The
badge has no `onPress` and `pointerEvents="none"`, so it doesn't affect
tapping. It covers starter and uploaded puzzles alike. A puzzle's badge is
cleared by pressing Reset on its [[PuzzleScreen]].

Each tile renders the puzzle's artwork whenever it has any — resolved via
`puzzleImageSource` (see [[puzzleImage]]), which returns the bundled asset
module for a starter puzzle (`puzzle.imageAsset`) or `{ uri }` for a
parent-uploaded photo (`puzzle.imageUri`). Every `STARTER_PUZZLES` entry
now ships a hand-illustrated cartoon JPEG
(`src/games/puzzle/assets/starter/`), so starter tiles show a real picture
rather than the old emoji stand-in. The solid-color square (cycling
through the palette's teal/coral/violet/leaf/tangerine) with a
puzzle-piece emoji is now only a fallback for a puzzle with no artwork at
all — which shouldn't occur with the current data. Tapping a tile calls `onSelectPuzzle(puzzle)`;
`HomeScreen` has no navigation logic of its own — `App.tsx` is what turns
that callback into actually opening `PuzzleScreen`.

`STARTER_PUZZLES` lives here (rather than under `src/games/puzzle/`)
because it's the Home grid's default data; the artwork it points at does
live under the puzzle game's folder. It is exported so `App.tsx` can
combine it with
`userPuzzles` into the single ordered list `PuzzleScreen` browses with its
Next button — both screens need to agree on the same list and ordering.

A button floats over the bottom-right corner of the grid
(`position: absolute`, `bottom: 12`, `right: 12`, 64x64) and calls
`onOpenParentArea`. It shows the [[Icon]] `parents` glyph
(`account-supervisor` — an adult-and-child figure, sized 50), not a
padlock. It stays low-contrast (`opacity: 0.55` at rest) so it doesn't
draw a toddler's eye, but the icon itself is now large enough to read
clearly. `App.tsx` routes it to `ParentGateScreen`, not directly to
`ParentScreen` — see that spec for the math-gate step in between. Nothing
system-drawn sits over that corner because the app runs full screen with
the status/navigation bars hidden (see
[`architecture.md`](../../architecture.md) → "Runs full screen"); an
Android navigation bar there previously covered this button.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `userPuzzles` | `Puzzle[]` | No | Defaults to `[]`. Rendered first in the grid. |
| `stockPuzzles` | `Puzzle[]` | No | Defaults to the bundled eight-puzzle `STARTER_PUZZLES` set. Rendered after `userPuzzles`. |
| `completedPuzzleIds` | `string[]` | No | Defaults to `[]`. Each id gets a green check badge on its tile. |
| `onSelectPuzzle` | `(puzzle: Puzzle) => void` | No | Called with the tapped puzzle. No-op if omitted. |
| `onOpenParentArea` | `() => void` | No | Called when the corner parent-area button is pressed. No-op if omitted. |

## Toddler UX constraints

- Each tile's touch target is at least 140x140 logical pixels
  (`tile.minHeight`), well above typical minimum tap-target guidance, and is
  the entire tile — no small icon within it needs precise tapping. The
  responsive column count is capped at 4 and the breakpoints are chosen so
  tiles stay comfortably above that floor on real phones and tablets.
- Tapping anywhere on a tile always fires `onSelectPuzzle`; there is no
  mis-tap or invalid-state to report, so there is nothing to silently ignore.
- No text needs to be read to use the screen: each tile shows its
  picture, and the puzzle title (`accessibilityLabel`) is exposed for
  screen readers but never required to identify or select a tile visually.
- "Done" is shown as a green check badge, not a word — a toddler can see
  which pictures they've finished without reading.
- Visual feedback on press: the tile dims (`opacity: 0.7`) while held.
  Background music plays (see [[useBackgroundMusic]]); no per-tap sound.
- The parent-area button is low-contrast (`opacity: 0.55` at rest) on
  purpose — it's the one control on this screen that should *not* draw a
  toddler's eye — but it's a full 64x64 target with a clear
  adult-and-child glyph, so a parent can find it easily.

## Edge cases & expected behavior

- No `userPuzzles` and no `stockPuzzles` override → grid is populated by
  the default `STARTER_PUZZLES` alone (eight tiles, each with cartoon art;
  4x2 on a tablet in landscape, 2x4 on a phone or a tablet in portrait).
- `userPuzzles` non-empty *and* `stockPuzzles` non-empty → uploaded tiles
  first, a `divider` rule, then the starter tiles. The two groups never
  share a row.
- `userPuzzles` non-empty but `stockPuzzles={[]}` (starters toggled off) →
  no divider.
- `userPuzzles={[]}` → no divider regardless of `stockPuzzles`.
- `stockPuzzles={[]}` and `userPuzzles={[]}` → grid renders empty (no
  empty-state message — see Non-goals).
- A group's size isn't a multiple of the column count → that group's last
  row is padded with invisible spacers so its tiles aren't stretched.
- `completedPuzzleIds` contains an id not on the grid → harmless no-op.
- `completedPuzzleIds` empty / omitted → no badges, no check glyph rendered.
- Window width crosses a breakpoint (split-view resized) → the grid
  re-chunks to the new column count.
- Tablet rotated landscape ↔ portrait → the column count halves / doubles
  (min 2) and the grid re-chunks, so the same tiles run taller in portrait
  instead of wider.
- Tapping a tile with no `onSelectPuzzle` passed → no-op, no crash.

## Test scenarios

1. Render with no props → the grid shows exactly the eight
   `STARTER_PUZZLES` (Meadow, Fairground, Climbing, Tractor, Sandpit,
   Train, Theatre, Teddies), in order.
2. Render with one `userPuzzles` entry → it's the first tile, then all of
   `STARTER_PUZZLES` in order.
3. In landscape, at width 400 the eight starter puzzles chunk into rows of
   2; at width 900 into rows of 4; at width 600 into rows of 3. In
   portrait (height > width), a 1100-wide tablet's 4 columns drop to 2
   (rows of 2), and a 400-wide phone stays at 2.
4. No `userPuzzles` → the grid model contains no `divider` item. Two
   `userPuzzles` at width 900 → model is `row, divider, row, row` (2
   uploaded, then 4 + 4 starters); one `userPuzzles` with `stockPuzzles={[]}`
   → no divider.
5. Tap the first tile → `onSelectPuzzle` is called with that tile's
   `Puzzle` (`id: 'stock-1'`).
6. Tap the corner parent-area button → `onOpenParentArea` is called.
7. `completedPuzzleIds={['stock-2', 'stock-5']}` → exactly the Fairground
   and Sandpit tiles carry the check badge (`accessibilityState.selected`);
   with it empty, no tile does and no check glyph is in the tree.

## Non-goals / known limitations

- The bundled starter artwork under `src/games/puzzle/assets/starter/` is
  eight hand-illustrated cartoon JPEGs (~250 KB each, ~1280px long edge).
  Replacing one is just overwriting the file with the same name; adding or
  removing a puzzle also means editing `STARTER_PUZZLES`. The emoji +
  solid-color fallback path still exists for a puzzle with no artwork, but
  nothing in the current data hits it. See that folder's `README.md`.
- No navigation library: `onSelectPuzzle` is a bare callback; `App.tsx`
  switches between `HomeScreen` and `PuzzleScreen` with a single piece of
  local state rather than a real nav stack (see `PuzzleScreen`'s spec).
- This screen still reads nothing from storage itself — `userPuzzles` and
  `completedPuzzleIds` are passed in by `App.tsx`, which owns the
  persistence via [[usePersistentPuzzles]].
- No explicit empty state for "zero puzzles at all" — shouldn't happen in
  practice since `stockPuzzles` always defaults to a non-empty set, but isn't
  guarded against explicitly.
- No per-tap sound effect (only background music).
- The divider is a plain thin rule, not a labelled section header — the
  design deliberately avoids text the child would need to read.

## Related

- Code: `src/screens/HomeScreen.tsx`
- Tests: `src/screens/HomeScreen.test.tsx`
- Types: `src/types/puzzle.ts`
- Palette: `src/theme/colors.ts`
- Starter artwork: `src/games/puzzle/assets/starter/`
- Background: `src/assets/home-bg.jpg` (pre-blurred farm scene)
- Related specs: [[AppHeader]], [[Icon]], [[PuzzleScreen]], [[ParentGateScreen]], [[ParentScreen]], [[SessionLockOverlay]], [[puzzleImage]], [[usePersistentPuzzles]]
