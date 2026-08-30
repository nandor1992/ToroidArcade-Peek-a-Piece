---
name: generatePuzzleGrid
type: service
source: src/games/puzzle/logic/generatePuzzleGrid.ts
status: draft
last_verified: 2026-08-25
---

# generatePuzzleGrid

## Purpose

Lays out a full `rows` x `columns` jigsaw from a board size: decides which
side of each shared edge gets the tab vs. the blank (see [[pieceShapes]]
for the actual curve math), and returns every piece's outline plus its
correct on-board position, ready for [[PuzzleBoard]] to scramble and
render.

A rendered check of this module's actual output (not just the unit tests
below) is published as an artifact — a 3×3 grid, drawn from the real
`generatePuzzleGrid`/`pathCommandsToSvgPath` output as SVG, solved and
scrambled — since visual correctness isn't something the test suite alone
can confirm in this environment.

## How it works

Two independent grids of booleans decide connectivity:

- `verticalConnections[row][c]` (one entry per internal column boundary,
  `c` in `0..columns-2`): `true` means the *left* piece's right edge is
  the tab (and the right piece's left edge is the blank).
- `horizontalConnections[r][column]` (one entry per internal row boundary,
  `r` in `0..rows-2`): `true` means the *top* piece's bottom edge is the
  tab.

Each piece then derives its four `EdgeType`s from whichever connections
border it, defaulting to `'flat'` on any side that's on the whole board's
outer edge (row 0's top, the last row's bottom, column 0's left, the last
column's right). `buildPiecePath` (from `pieceShapes`) turns those into an
actual outline, and `targetX`/`targetY` are just `column * pieceWidth` /
`row * pieceHeight` — the piece's correct top-left corner in board pixels.

`random` defaults to `Math.random` but is a parameter specifically so
tests (and anything else that wants a reproducible layout, like the
preview artifact) can pass a seeded function instead.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `generatePuzzleGrid(rows, columns, boardWidth, boardHeight, random?)` | `(...) => PuzzlePieceDescriptor[]` | `random` defaults to `Math.random`. |
| `PuzzlePieceDescriptor` | `{ id, row, column, targetX, targetY, edges, path }` | `id` is `"${row}-${column}"`. `path` is local-space (see `pieceShapes`). |

## Edge cases & expected behavior

- Outer-border edges are always `'flat'`, regardless of what `random`
  returns.
- Every internal edge is tab on exactly one side and blank on the other —
  never flat, never both the same.
- A 1x1 grid (`rows=1, columns=1`) has all four edges flat (no internal
  connections exist to make anything else).

## Test scenarios

1. Produces exactly `rows * columns` pieces, with correct `id`, `row`,
   `column`, `targetX`, `targetY` for a few spot-checked pieces.
2. Border edges are flat for every piece touching that border, across a
   3x3 grid.
3. Every internal edge pairing is tab on one side, blank on the other —
   checked for all horizontal and vertical neighbor pairs in a 3x3 grid.
4. A `random` that always returns `0` (i.e. always `< 0.5`) makes every
   internal connection flag `true`, producing a specific, exactly
   predictable edge assignment on a 2x2 grid — locks in the flag-to-edge
   mapping itself, not just the complementarity property.
5. A 1x1 grid has all four edges flat.

## Non-goals / known limitations

- `rows`/`columns` are just numbers a caller passes in. The presets a
  parent actually picks from live in [[puzzleSizes]] (2x2 … 6x5);
  `PuzzleBoard` defaults to 2x2 when given nothing.
- No guarantee against a "trivial" random layout (e.g. it's possible,
  though unlikely, for a whole row's connections to all land the same
  way) — no attempt to enforce visual variety beyond a straight coin flip
  per edge.

## Related

- Code: `src/games/puzzle/logic/generatePuzzleGrid.ts`
- Tests: `src/games/puzzle/logic/generatePuzzleGrid.test.ts`
- Related specs: [[pieceShapes]], [[PuzzleBoard]]
