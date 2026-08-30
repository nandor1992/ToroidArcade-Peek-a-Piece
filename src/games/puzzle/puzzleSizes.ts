export interface PuzzleSize {
  /** How it's shown on the Settings chip, e.g. "3x2" (columns x rows). */
  label: string;
  columns: number;
  rows: number;
}

/**
 * The grid sizes a parent can pick from in Settings. `generatePuzzleGrid`
 * and `pieceShapes` are fully general (tabs scale to piece size), so any
 * of these — from 4 pieces up to 30 — cuts cleanly.
 */
export const PUZZLE_SIZES: readonly PuzzleSize[] = [
  { label: '2x2', columns: 2, rows: 2 },
  { label: '3x2', columns: 3, rows: 2 },
  { label: '3x3', columns: 3, rows: 3 },
  { label: '4x3', columns: 4, rows: 3 },
  { label: '4x4', columns: 4, rows: 4 },
  { label: '5x4', columns: 5, rows: 4 },
  { label: '6x5', columns: 6, rows: 5 },
] as const;

export const DEFAULT_PUZZLE_SIZE: PuzzleSize = PUZZLE_SIZES[0];

export function findPuzzleSize(label: string): PuzzleSize {
  return PUZZLE_SIZES.find(size => size.label === label) ?? DEFAULT_PUZZLE_SIZE;
}
