---
name: AppHeader
type: component
source: src/components/AppHeader.tsx
status: draft
last_verified: 2026-08-30
---

# AppHeader

## Purpose

A slim app-identity bar at the top of every child-facing screen (Home,
Puzzle): the Peek-a-Piece mark and wordmark, so the app always says what
it is. Nothing interactive lives here — screen controls (back / next) sit
below it.

## How it works

A single row: `require('../assets/logo.png')` (a small render of the app
icon, `@1x/@2x/@3x`) at 28x28 next to a bold "Peek-a-Piece" `Text`. The
row has an opaque `colors.cream` background so it reads as a header band
on `PuzzleScreen`'s coloured backgrounds; on `HomeScreen` (also cream) the
band is invisible and it just looks like a heading. Padding is small
(`paddingVertical: 8`) — this is meant to be unobtrusive.

Rendered by `HomeScreen` and `PuzzleScreen` as the first child inside
their `SafeAreaView`.

## Interface

No props.

## Toddler UX constraints

- Non-interactive and visually quiet, so it doesn't invite taps or
  compete with the puzzle tiles / board for attention.
- Text is decorative here (the child isn't expected to read it); it's a
  normal `Text` node, exposed to screen readers but not required for any
  task.

## Edge cases & expected behavior

- Renders identically regardless of screen; the host screen supplies the
  surrounding background.

## Test scenarios

Covered indirectly through `HomeScreen` / `PuzzleScreen` render tests
(the screens mount without error with the header present). No dedicated
test — it has no logic.

## Non-goals / known limitations

- Not a navigation bar — no back button, no title-per-screen. Each screen
  keeps its own controls below the header.
- The logo is a rasterised copy of `resources/peekapiece-icon.png`; if the
  brand mark changes, re-export `src/assets/logo*.png` (there's no SVG
  rendering in the app).

## Related

- Code: `src/components/AppHeader.tsx`
- Asset: `src/assets/logo.png` (`@2x`, `@3x`)
- Related specs: [[HomeScreen]], [[PuzzleScreen]], [[Icon]]
