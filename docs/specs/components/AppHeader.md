---
name: AppHeader
type: component
source: src/components/AppHeader.tsx
status: draft
last_verified: 2026-09-22
---

# AppHeader

## Purpose

A slim identity-and-title bar at the top of every child-facing screen
(Game select, Home, Puzzle, Memory): the Peek-a-Piece mark next to either
the app name or the current section's title, plus — on any screen below
the main one — the back button out of that section. Screen-specific
controls (next / reset) still sit below it.

## How it works

A single row: an optional back chevron, then
`require('../assets/logo.png')` (a small render of the app icon,
`@1x/@2x/@3x`) at 28x28, then a bold `Text` showing `title` — or
"Peek-a-Piece" when no title is given. The row has an opaque
`colors.cream` background so it reads as a header band on `PuzzleScreen`'s
coloured backgrounds; on `HomeScreen` (also cream) the band is invisible
and it just looks like a heading. Padding is small (`paddingVertical: 8`)
— this is meant to be unobtrusive.

The back button renders only when `onBack` is supplied, so the main screen
(which has nowhere to go back to) shows none rather than a dead control.
It is a 48x48 `Pressable` around a 32dp chevron, nudged 12dp left so the
glyph — not its padding — lines up with the content below, and labelled
"Back" for screen readers.

Rendered by `GameSelectScreen` (no title, no back), `HomeScreen` (title
"Family Puzzle", back to the game picker), `MemoryScreen` (title "Family
Memory", back to the game picker) and `PuzzleScreen` (no title, no back —
it keeps its own floating Home button over the board) as the first child
inside their `SafeAreaView`.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `title` | `string` | no | Section name shown in place of the "Peek-a-Piece" wordmark. |
| `onBack` | `() => void` | no | Supplied → a back chevron renders at the left of the bar. Omitted → no back button. |

## Toddler UX constraints

- Visually quiet, so it doesn't compete with the puzzle tiles / board for
  attention. The back button is the only thing here that can be tapped,
  and it is 48x48 — comfortably past the minimum target — with the
  chevron itself drawn small.
- Text is decorative here (the child isn't expected to read it); it's a
  normal `Text` node, exposed to screen readers but not required for any
  task.

## Edge cases & expected behavior

- No `title` → the bar reads "Peek-a-Piece".
- No `onBack` → no back button renders, and the logo sits flush at the
  left.
- Otherwise renders identically regardless of screen; the host screen
  supplies the surrounding background.

## Test scenarios

Covered indirectly through `HomeScreen` / `PuzzleScreen` render tests
(the screens mount without error with the header present). No dedicated
test — it has no logic.

## Non-goals / known limitations

- Not a full navigation bar — it knows nothing about a stack, and there is
  no forward/overflow affordance. Everything past "go back one level" stays
  with the host screen (e.g. `PuzzleScreen`'s floating Home / next / reset
  buttons).
- The logo is a rasterised copy of `resources/peekapiece-icon.png`; if the
  brand mark changes, re-export `src/assets/logo*.png` (there's no SVG
  rendering in the app).

## Related

- Code: `src/components/AppHeader.tsx`
- Asset: `src/assets/logo.png` (`@2x`, `@3x`)
- Related specs: [[GameSelectScreen]], [[HomeScreen]], [[MemoryScreen]], [[PuzzleScreen]], [[Icon]]
