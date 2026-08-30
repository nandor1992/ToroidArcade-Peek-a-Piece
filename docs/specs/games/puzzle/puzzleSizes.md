---
name: puzzleSizes
type: game
source: src/games/puzzle/puzzleSizes.ts
status: draft
last_verified: 2026-08-30
---

# puzzleSizes

## Purpose

The list of piece-grid sizes a parent can choose from in Settings, and the
default. Keeps the labels and the `rows`/`columns` numbers in one place so
`SettingsScreen` (the chooser) and `App.tsx` (which passes the choice down
to `PuzzleScreen` → [[PuzzleBoard]]) agree.

## How it works

`PUZZLE_SIZES` is a fixed array of `{ label, columns, rows }`:

| label | columns | rows | pieces |
|-------|---------|------|--------|
| 2x2 | 2 | 2 | 4 |
| 3x2 | 3 | 2 | 6 |
| 3x3 | 3 | 3 | 9 |
| 4x3 | 4 | 3 | 12 |
| 4x4 | 4 | 4 | 16 |
| 5x4 | 5 | 4 | 20 |
| 6x5 | 6 | 5 | 30 |

`label` is `columns`x`rows`. `DEFAULT_PUZZLE_SIZE` is `2x2`.
`findPuzzleSize(label)` looks one up by label, falling back to the
default — handy if a persisted value ever needs re-hydrating (storage
isn't implemented yet).

[[generatePuzzleGrid]] and [[pieceShapes]] are fully general — tab size is
a fraction of each edge's length — so every entry here cuts cleanly, from
4 pieces up to 30. [[PuzzleBoard]] scales its snap radius to piece size to
match.

## Interface

- `PUZZLE_SIZES: readonly PuzzleSize[]`
- `DEFAULT_PUZZLE_SIZE: PuzzleSize`
- `findPuzzleSize(label: string): PuzzleSize`
- `interface PuzzleSize { label: string; columns: number; rows: number }`

## Toddler UX constraints

- Not toddler-facing — this is a parent choice made behind the gate. The
  larger grids (20, 30 pieces) are there for older kids / harder play; the
  default stays at the easiest 2x2.

## Edge cases & expected behavior

- `findPuzzleSize` with an unknown label → returns `DEFAULT_PUZZLE_SIZE`.

## Test scenarios

Exercised through [[SettingsScreen]]'s tests (picking a chip reports the
matching `PuzzleSize`; the current one renders selected) and
[[PuzzleBoard]]'s (a non-2x2 grid still solves).

## Non-goals / known limitations

- No per-puzzle size, no "auto" size — one global setting.
- Not persisted; resets to `2x2` on app restart (like every other
  setting).

## Related

- Code: `src/games/puzzle/puzzleSizes.ts`
- Related specs: [[SettingsScreen]], [[PuzzleScreen]], [[PuzzleBoard]], [[generatePuzzleGrid]], [[pieceShapes]]
