import { buildPiecePath } from './pieceShapes';
import type { EdgeType, PathCommand, PieceEdges } from './pieceShapes';

export interface PuzzlePieceDescriptor {
  id: string;
  row: number;
  column: number;
  /** Piece's correct position, top-left corner, in board pixel coordinates. */
  targetX: number;
  targetY: number;
  edges: PieceEdges;
  /** Outline in the piece's own local space — (0, 0) is its own top-left corner. */
  path: PathCommand[];
}

export type RandomFn = () => number;

/**
 * Generates an interlocking `rows` x `columns` grid of jigsaw pieces sized
 * to fill a `boardWidth` x `boardHeight` board. Each internal edge between
 * two neighboring pieces is randomly assigned a tab/blank pairing — see
 * docs/specs/games/puzzle/logic/generatePuzzleGrid.md.
 *
 * `random` is injectable so tests can generate deterministic layouts.
 */
export function generatePuzzleGrid(
  rows: number,
  columns: number,
  boardWidth: number,
  boardHeight: number,
  random: RandomFn = Math.random,
): PuzzlePieceDescriptor[] {
  const pieceWidth = boardWidth / columns;
  const pieceHeight = boardHeight / rows;

  // verticalConnections[r][c] (c in 0..columns-2) describes the shared
  // edge between piece (r, c) and piece (r, c+1): true means the left
  // piece's right side is the tab.
  const verticalConnections: boolean[][] = Array.from(
    { length: rows },
    () => Array.from({ length: columns - 1 }, () => random() < 0.5),
  );
  // horizontalConnections[r][c] (r in 0..rows-2) describes the shared edge
  // between piece (r, c) and piece (r+1, c): true means the top piece's
  // bottom side is the tab.
  const horizontalConnections: boolean[][] = Array.from(
    { length: rows - 1 },
    () => Array.from({ length: columns }, () => random() < 0.5),
  );

  const pieces: PuzzlePieceDescriptor[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const left: EdgeType =
        column === 0
          ? 'flat'
          : verticalConnections[row][column - 1]
            ? 'blank'
            : 'tab';
      const right: EdgeType =
        column === columns - 1
          ? 'flat'
          : verticalConnections[row][column]
            ? 'tab'
            : 'blank';
      const top: EdgeType =
        row === 0
          ? 'flat'
          : horizontalConnections[row - 1][column]
            ? 'blank'
            : 'tab';
      const bottom: EdgeType =
        row === rows - 1
          ? 'flat'
          : horizontalConnections[row][column]
            ? 'tab'
            : 'blank';

      const edges: PieceEdges = { top, right, bottom, left };
      pieces.push({
        id: `${row}-${column}`,
        row,
        column,
        targetX: column * pieceWidth,
        targetY: row * pieceHeight,
        edges,
        path: buildPiecePath(pieceWidth, pieceHeight, edges),
      });
    }
  }
  return pieces;
}
