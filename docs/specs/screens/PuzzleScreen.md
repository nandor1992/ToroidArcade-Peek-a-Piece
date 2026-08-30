---
name: PuzzleScreen
type: screen
source: src/screens/PuzzleScreen.tsx
status: draft
last_verified: 2026-08-30
---

# PuzzleScreen

## Purpose

The screen a child lands on after tapping a tile on `HomeScreen`. It's the
frame around the actual game: the slim [[AppHeader]], a back button, a
next button, a random background, and — for any puzzle with a real photo —
the interactive jigsaw itself ([[PuzzleBoard]]).

## How it works

`App.tsx` holds a small discriminated-union `screen` state (`'home' |
'puzzle' | 'parentGate' | 'parent' | 'settings'`) and swaps which screen it
renders based on it, rather than pulling in a navigation library.
`HomeScreen`'s `onSelectPuzzle` sets `screen` to `{ name: 'puzzle',
puzzleId }`; `PuzzleScreen`'s `onBack` sets it back to `{ name: 'home' }`.
There's no back-stack or deep-linking; see Non-goals for when that'd need
revisiting.

This screen counts as a "child-facing screen" for two other pieces of
`App.tsx` state it doesn't otherwise know about: background music
(`useBackgroundMusic`) plays while it's showing, and the session timer (see
[[SessionLockOverlay]]) keeps counting down while it's showing, same as
`HomeScreen`.

`PuzzleScreen` receives the full puzzle list (`puzzles`, same
user-photos-then-starter-puzzles order as the `HomeScreen` grid), which one
to open (`initialPuzzleId`), and the piece-grid `rows`/`columns` (from the
Settings "Puzzle Size" chooser — see [[puzzleSizes]]; defaults to 2x2).
It tracks its own `index` into the list.

**Layout.** Below [[AppHeader]] a single `playArea` (`flex: 1`) fills the
rest of the screen. The `PuzzleBoard` (or the emoji fallback) is an
absolutely-positioned layer filling it; the controls float on top as
absolute overlays. There is **no boxed "photo frame"** any more — pieces
are visible across the whole area below the header.

**Controls.** A *home* button and a *reset* button sit in a top row
(`box-none` container, so taps between them still reach the pieces). Home
(`home` [[Icon]], top-left) calls `onBack` — a house, not a chevron, so
it's clearly "leave the game" not "previous picture". Reset (`reset` /
restart icon, top-right) bumps a `resetCount` that's part of the
`PuzzleBoard` `key`, remounting it → the pieces re-scatter (and `solved`
clears). *Previous* and *Next* (`previous` / `next` chevrons) are
absolute, vertically centred on the left / right edges, and step `index`
by ±1, wrapping both ways.

`puzzles` is built by `App.tsx` as `[...userPuzzles, ...stockPuzzles]`,
where `stockPuzzles` is `STARTER_PUZZLES` (eight bundled puzzles) or `[]`
depending on the parent's "Show starter puzzles" toggle (see
`ParentScreen`) — so Next only cycles through whatever's currently visible
on `HomeScreen`, never a hidden set.

The whole screen's background is one of a handful of solid-color
placeholders (`BACKGROUND_PLACEHOLDERS`, standing in for real background art
— see Non-goals), chosen at random once per puzzle shown. The choice
re-rolls when `index` changes (`useMemo` keyed on the current puzzle's id),
not on every re-render.

**The game itself.** When the current puzzle has artwork —
`puzzleSkiaSource(puzzle)` returns non-null, which it does for both
parent-uploaded photos (`imageUri`) and every `STARTER_PUZZLES` entry
(`imageAsset`) — the play area renders `<PuzzleBoard
key={`${puzzle.id}-${columns}x${rows}-${resetCount}`} imageSource={...}
rows={rows} columns={columns} onSolved={...} />`. The `key` folds in the
puzzle id, the grid size *and* `resetCount`, so any of the three remounts
`PuzzleBoard` — which is how a new puzzle, a size change, and the Reset
button all re-scatter the pieces. A puzzle with no artwork falls back to a
centred emoji; nothing in the current data hits that. See [[puzzleImage]].

A local `solved` boolean (cleared whenever `puzzle?.id` changes and on
Reset) tracks whether the current puzzle's `onSolved` has fired; while
true, a small "🎉 Great job!" banner overlays the play area
(`pointerEvents="none"`). Solving doesn't auto-advance or navigate — the
banner is the only feedback.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `puzzles` | `Puzzle[]` | Yes | The full browsable list; Previous/Next cycle through it. |
| `initialPuzzleId` | `string` | Yes | Which puzzle to open first. Falls back to index 0 if not found in `puzzles`. |
| `rows` | `number` | No | Piece rows. Default 2. |
| `columns` | `number` | No | Piece columns. Default 2. |
| `onBack` | `() => void` | No | Called when the home button is pressed. No-op if omitted. |

## Toddler UX constraints

- Home, Reset, Previous and Next buttons are each a 56x56 circular tap
  target — the whole circle is tappable.
- The buttons use [[Icon]]s (`home` / `reset` / `previous` / `next`), not
  text labels; `accessibilityLabel` ("Home" / "Reset puzzle" / "Previous
  puzzle" / "Next puzzle") is on the `Pressable` for screen readers and
  the glyph is hidden from them.
- Previous and Next always succeed and wrap — no dead-end for repeated
  tapping. Reset is always safe (it just re-scatters).
- The buttons are semi-transparent (`opacity` 0.85–0.9) and float over
  the play area; the between-buttons gaps pass touches through to the
  pieces. A piece scattered fully under a button can't be grabbed there —
  Reset re-scatters if that happens.
- Visual feedback on press: buttons dim (`opacity: 0.6`) while held. No
  audio feedback (no sound-effect pipeline).

## Edge cases & expected behavior

- `initialPuzzleId` not present in `puzzles` → opens the first puzzle
  (index 0) instead of crashing.
- Pressing Next on the last puzzle → wraps to the first; pressing Previous
  on the first → wraps to the last.
- `puzzles` is empty → renders nothing (`null`); shouldn't happen in
  practice since `App.tsx` always passes at least `STARTER_PUZZLES`, but
  isn't guarded against with a message.
- Switching puzzles re-picks the random background; re-rendering the same
  puzzle (e.g. parent re-render) does not.
- Switching puzzles also clears `solved` and remounts a fresh
  `PuzzleBoard` (via its `key`) — no leftover banner / pre-solved board.
- Pressing Reset → the board remounts (pieces re-scatter) and the banner
  clears; the puzzle id and grid size are unchanged.
- `rows`/`columns` change (a new Puzzle Size) → `PuzzleBoard` remounts at
  the new grid. In practice you can't reach Settings without leaving this
  screen, so it only differs on the next open.

## Test scenarios

1. Open with a given puzzle, press Home → `onBack` is called.
2. Open on the last puzzle, press Next → the first puzzle is now showing.
   Open on the first puzzle, press Previous → the last puzzle is showing.
3. Open with an `initialPuzzleId` not present in `puzzles` → the first
   puzzle in the list is showing.
4. A puzzle with artwork (`imageUri` or `imageAsset`) renders the
   interactive board (detected by the presence of its Responder System
   props), not the emoji fallback; a puzzle with neither renders the
   fallback, not a board.
5. Solving the board (dragging all its pieces together) shows the
   "🎉 Great job!" banner; pressing Reset then clears it.

The end-to-end claim that Next respects the "Show starter puzzles" toggle
is covered at the `App.tsx` level (`App.test.tsx`), not here, since it
depends on how `App.tsx` builds `puzzles` — this screen itself has no
awareness of the toggle at all, only of whatever list it's handed.

## Non-goals / known limitations

- Starter puzzles now *can* be played as a real jigsaw — each carries
  bundled cartoon art (`imageAsset`, a hand-illustrated JPEG — see
  [[HomeScreen]]).
- Piece count comes from the global Settings choice (`rows`/`columns`
  props); there's no per-puzzle or in-game size control here.
- No real background art — `BACKGROUND_PLACEHOLDERS` is four solid palette
  colors standing in for a bundled set of background images. (The starter
  *puzzle* art is now bundled — see [[HomeScreen]] — but the screen
  background behind it still isn't.)
- Navigation is a small hand-rolled `screen` union in `App.tsx`, not a real
  navigation stack — no back-stack, no Android hardware-back-button
  handling beyond whatever the OS gives for free. Fine at five screens;
  would need revisiting (likely adding a navigation library) if it grows
  much further.
- `puzzles` and `initialPuzzleId` are passed in by the caller; this screen
  doesn't read `src/storage/` itself (not implemented).

## Related

- Code: `src/screens/PuzzleScreen.tsx`
- Tests: `src/screens/PuzzleScreen.test.tsx`
- Related specs: [[HomeScreen]], [[SessionLockOverlay]], [[PuzzleBoard]], [[puzzleImage]], [[puzzleSizes]], [[AppHeader]], [[Icon]]
