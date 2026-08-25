---
name: coverRect
type: service
source: src/games/puzzle/logic/coverRect.ts
status: draft
last_verified: 2026-08-25
---

# coverRect

## Purpose

Figures out where a photo of arbitrary aspect ratio should be drawn,
undistorted, to fully cover the puzzle board — the same idea as CSS
`object-fit: cover` or RN's `resizeMode="cover"`, reimplemented here
because [[PuzzleBoard]] needs the actual drawn rectangle's coordinates
(to work out which slice of the photo belongs to which piece), not just a
visual effect Skia applies opaquely.

## How it works

`computeCoverRect(imageWidth, imageHeight, boardWidth, boardHeight)`
computes `scale = max(boardWidth / imageWidth, boardHeight / imageHeight)`
— the smaller dimension's ratio would leave a gap, so cover always uses
the larger one — then returns the scaled image's `width`/`height` and the
`x`/`y` offset that centers it over the board (negative on whichever axis
overflows).

`PuzzleBoard` uses the result as the position/size to draw the *entire*
board image at, for every piece — each piece's `Group` then offsets that
by its own `-targetX`/`-targetY` (see `PuzzleBoard`'s spec) so the visible
slice within its clip lines up with the right part of the photo.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `computeCoverRect(imageWidth, imageHeight, boardWidth, boardHeight)` | `(...) => Rect` | `Rect = { x, y, width, height }`. |

## Edge cases & expected behavior

- Any dimension `<= 0` (image not loaded yet, board not laid out yet) →
  returns `{ x: 0, y: 0, width: boardWidth, height: boardHeight }` rather
  than dividing by zero or returning `NaN`/`Infinity`.
- Image aspect ratio already matches the board → no offset, no cropping
  (`x: 0, y: 0`, size equals the board).

## Test scenarios

1. A wider-than-board image scales to fill height, with equal negative
   `x` overflow on both sides.
2. A taller-than-board image scales to fill width, with equal negative
   `y` overflow top and bottom.
3. An image already matching the board's aspect ratio needs no cropping.
4. A zero or negative input dimension falls back to the board size
   without producing `NaN`.

## Non-goals / known limitations

- No `contain`/`fill`/other `resizeMode` equivalents — only cover, since
  that's the only one `PuzzleBoard` needs (matches the plain `Image`
  cover behavior `PuzzleScreen` used before pieces existed).

## Related

- Code: `src/games/puzzle/logic/coverRect.ts`
- Tests: `src/games/puzzle/logic/coverRect.test.ts`
- Related specs: [[PuzzleBoard]]
