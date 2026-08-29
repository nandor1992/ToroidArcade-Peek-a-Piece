---
name: PuzzleScreen
type: screen
source: src/screens/PuzzleScreen.tsx
status: draft
last_verified: 2026-08-29
---

# PuzzleScreen

## Purpose

The screen a child lands on after tapping a tile on `HomeScreen`. It's the
frame around the actual game: a back button, a next button, a random
background, and — for any puzzle with a real photo — the interactive
jigsaw itself ([[PuzzleBoard]]).

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
user-photos-then-starter-puzzles order as the `HomeScreen` grid) plus which
one to open (`initialPuzzleId`), and tracks its own `index` into that list.
The back button calls `onBack` (returns to `HomeScreen`); the next button
advances `index`, wrapping from the last puzzle back to the first rather
than disabling itself at the end.

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
(`imageAsset`, bundled cartoon art) — the image area renders
`<PuzzleBoard key={puzzle.id} imageSource={...} onSolved={...} />` instead
of a static photo. The `key` matters: it forces Skia to fully remount (and
therefore re-scramble) `PuzzleBoard` on every puzzle change, rather than
reusing one instance across different images. A puzzle with no artwork at
all falls back to the emoji placeholder — there's nothing to cut into
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
- Switching puzzles via Next also resets `solved` back to `false` and
  remounts a fresh, re-scrambled `PuzzleBoard` (via its `key`) — solving
  one puzzle doesn't leave the banner showing (or the board pre-solved) on
  the next one.

## Test scenarios

1. Open with a given puzzle, press Back → `onBack` is called.
2. Open on the last puzzle in the list, press Next → the first puzzle in
   the list is now showing.
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
- No difficulty selection — `PuzzleBoard` is always opened at its default
  2x2 grid; this screen has no UI to change piece count.
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
- Related specs: [[HomeScreen]], [[SessionLockOverlay]], [[PuzzleBoard]], [[puzzleImage]]
