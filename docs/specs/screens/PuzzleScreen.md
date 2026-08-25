---
name: PuzzleScreen
type: screen
source: src/screens/PuzzleScreen.tsx
status: draft
last_verified: 2026-08-25
---

# PuzzleScreen

## Purpose

The screen a child lands on after tapping a tile on `HomeScreen`. For now it
just opens the chosen puzzle's photo full-size with a back button and a next
button — the actual jigsaw interaction (cutting the photo into draggable
pieces) is a later step, documented separately once it exists. This screen's
job today is the frame around that: getting in, browsing to another puzzle,
and getting back out.

## How it works

`App.tsx` holds a small discriminated-union `screen` state (`'home' |
'puzzle' | 'parentGate' | 'parent'`) and swaps which screen it renders based
on it, rather than pulling in a navigation library. `HomeScreen`'s
`onSelectPuzzle` sets `screen` to `{ name: 'puzzle', puzzleId }`;
`PuzzleScreen`'s `onBack` sets it back to `{ name: 'home' }`. There's no
back-stack or deep-linking; see Non-goals for when that'd need revisiting.

`PuzzleScreen` receives the full puzzle list (`puzzles`, same
user-photos-then-starter-puzzles order as the `HomeScreen` grid) plus which
one to open (`initialPuzzleId`), and tracks its own `index` into that list.
The back button calls `onBack` (returns to `HomeScreen`); the next button
advances `index`, wrapping from the last puzzle back to the first rather
than disabling itself at the end.

`puzzles` is built by `App.tsx` as `[...userPuzzles, ...stockPuzzles]`,
where `stockPuzzles` is `STARTER_PUZZLES` or `[]` depending on the parent's
"Show starter puzzles" toggle (see `ParentScreen`) — so Next only cycles
through whatever's currently visible on `HomeScreen`, never a hidden set.

The whole screen's background is one of a handful of solid-color
placeholders (`BACKGROUND_PLACEHOLDERS`, standing in for real background art
— see Non-goals), chosen at random once per puzzle shown. The choice
re-rolls when `index` changes (`useMemo` keyed on the current puzzle's id),
not on every re-render.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `puzzles` | `Puzzle[]` | Yes | The full browsable list; `Next` cycles through it. |
| `initialPuzzleId` | `string` | Yes | Which puzzle to open first. Falls back to index 0 if not found in `puzzles`. |
| `onBack` | `() => void` | No | Called when the back button is pressed. No-op if omitted. |

## Toddler UX constraints

- Back and next buttons are each a 56x56 circular tap target — the whole
  circle is tappable, not just the glyph inside it.
- Both buttons use arrow glyphs (←/→), not text labels, so nothing needs to
  be read to browse puzzles or leave the screen; `accessibilityLabel`
  ("Back" / "Next puzzle") is present for screen readers only.
- Next always succeeds and wraps around — there's no dead-end state a
  toddler's repeated tapping could get stuck against.
- Visual feedback on press: both buttons dim (`opacity: 0.7`) while held.
  Same known gap as `HomeScreen`: no audio feedback yet (no sound asset
  pipeline in the project).

## Edge cases & expected behavior

- `initialPuzzleId` not present in `puzzles` → opens the first puzzle
  (index 0) instead of crashing.
- Pressing Next on the last puzzle in the list → wraps to the first puzzle.
- `puzzles` is empty → renders nothing (`null`); shouldn't happen in
  practice since `App.tsx` always passes at least `STARTER_PUZZLES`, but
  isn't guarded against with a message.
- Switching puzzles via Next re-picks the random background; re-rendering
  the same puzzle (e.g. parent re-render) does not.

## Test scenarios

1. Open with a given puzzle, press Back → `onBack` is called.
2. Open on the last puzzle in the list, press Next → the first puzzle in
   the list is now showing.
3. Open with an `initialPuzzleId` not present in `puzzles` → the first
   puzzle in the list is showing.

## Non-goals / known limitations

- No real puzzle interaction yet — the image area shows the puzzle's photo
  (or, for starter puzzles with no `imageUri` yet, a fixed glyph) full-size,
  not cut into pieces. That becomes a `src/games/puzzle/` component per the
  self-contained-game-plugin convention once it exists.
- No real background art — `BACKGROUND_PLACEHOLDERS` is four solid palette
  colors standing in for a bundled set of background images (same
  redistribution-rights caveat as `HomeScreen`'s starter photos).
- Navigation is a small hand-rolled `screen` union in `App.tsx`, not a real
  navigation stack — no back-stack, no Android hardware-back-button
  handling beyond whatever the OS gives for free. Fine at four screens;
  would need revisiting (likely adding a navigation library) if it grows
  much further.
- `puzzles` and `initialPuzzleId` are passed in by the caller; this screen
  doesn't read `src/storage/` itself (not implemented).

## Related

- Code: `src/screens/PuzzleScreen.tsx`
- Tests: `src/screens/PuzzleScreen.test.tsx`
- Related specs: [[HomeScreen]]
