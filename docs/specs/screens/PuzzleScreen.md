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

**Controls.** A *home* button (top-left, `home` [[Icon]]) calls `onBack`
to return to `HomeScreen` — a house, not a chevron, so it's clearly "leave
the game" rather than "previous picture". *Previous* and *Next* buttons
(`previous` / `next` chevron icons) sit vertically centred on the left and
right edges of the board area, one each side, and step `index` by ±1,
wrapping around both ends (last→first, first→last) rather than
disabling at the ends.

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
`puzzleSkiaSource(puzzle)` returns non-null, which it now does for both
parent-uploaded photos (`imageUri`) and every `STARTER_PUZZLES` entry
(`imageAsset`, bundled cartoon art) — the board area renders
`<PuzzleBoard key={`${puzzle.id}-${columns}x${rows}`} imageSource={...}
rows={rows} columns={columns} onSolved={...} />`. The `key` includes the
grid size as well as the puzzle id, so it fully remounts (and re-scrambles)
on either change rather than reusing one instance. A puzzle with no artwork
at all falls back to the emoji placeholder — there's nothing to cut into
pieces without a source image — but nothing in the current data hits that
path. See [[puzzleImage]] for how the source is resolved.

A local `solved` boolean (reset via `useEffect` whenever `puzzle?.id`
changes) tracks whether the current puzzle's `onSolved` has fired; while
true, a small "🎉 Great job!" banner overlays the board
(`pointerEvents="none"`, so it never blocks interaction). Solving a puzzle
doesn't auto-advance to the next one or navigate anywhere — the banner is
the only feedback.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `puzzles` | `Puzzle[]` | Yes | The full browsable list; Previous/Next cycle through it. |
| `initialPuzzleId` | `string` | Yes | Which puzzle to open first. Falls back to index 0 if not found in `puzzles`. |
| `rows` | `number` | No | Piece rows. Default 2. |
| `columns` | `number` | No | Piece columns. Default 2. |
| `onBack` | `() => void` | No | Called when the home button is pressed. No-op if omitted. |

## Toddler UX constraints

- Home, Previous and Next buttons are each a 56x56 circular tap target —
  the whole circle is tappable, not just the glyph inside it.
- The buttons use [[Icon]]s (`home` / `previous` / `next`), not text
  labels, so nothing needs to be read to browse puzzles or leave the
  screen; `accessibilityLabel` ("Home" / "Previous puzzle" / "Next
  puzzle") is on the `Pressable` for screen readers, and the icon itself
  is hidden from them.
- Previous and Next always succeed and wrap around — there's no dead-end
  state a toddler's repeated tapping could get stuck against.
- The Previous/Next buttons sit *beside* the board, never over it, so a
  mis-tap toward the puzzle doesn't hit a nav button and vice versa.
- Visual feedback on press: both buttons dim (`opacity: 0.7`) while held.
  Same known gap as `HomeScreen`: no audio feedback yet (no sound asset
  pipeline in the project).

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
- Switching puzzles also resets `solved` back to `false` and remounts a
  fresh, re-scrambled `PuzzleBoard` (via its `key`) — solving one puzzle
  doesn't leave the banner showing (or the board pre-solved) on the next.
- Changing the `rows`/`columns` (a new Puzzle Size chosen in Settings)
  while this screen is mounted → `PuzzleBoard` remounts at the new grid
  (its `key` includes the size). In practice you can't reach Settings
  without leaving this screen, so it's only ever different on the next
  open.

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
5. Solving the board (dragging all its pieces into place) shows the
   "🎉 Great job!" banner.

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
