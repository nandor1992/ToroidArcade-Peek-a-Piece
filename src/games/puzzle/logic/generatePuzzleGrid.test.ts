import { generatePuzzleGrid } from './generatePuzzleGrid';
import type { EdgeType } from './pieceShapes';

function opposite(type: EdgeType): EdgeType {
  return type === 'tab' ? 'blank' : 'tab';
}

test('produces rows * columns pieces with correct ids and target positions', () => {
  const pieces = generatePuzzleGrid(2, 3, 300, 200, () => 0);

  expect(pieces).toHaveLength(6);
  const byId = new Map(pieces.map(p => [p.id, p]));
  expect(byId.get('0-0')).toMatchObject({ row: 0, column: 0, targetX: 0, targetY: 0 });
  expect(byId.get('0-2')).toMatchObject({ row: 0, column: 2, targetX: 200, targetY: 0 });
  expect(byId.get('1-1')).toMatchObject({ row: 1, column: 1, targetX: 100, targetY: 100 });
});

test('outer border edges are always flat', () => {
  const pieces = generatePuzzleGrid(3, 3, 300, 300, () => 0.9);

  for (const piece of pieces) {
    if (piece.row === 0) expect(piece.edges.top).toBe('flat');
    if (piece.row === 2) expect(piece.edges.bottom).toBe('flat');
    if (piece.column === 0) expect(piece.edges.left).toBe('flat');
    if (piece.column === 2) expect(piece.edges.right).toBe('flat');
  }
});

test('internal edges are never flat and always tab on one side, blank on the other', () => {
  const pieces = generatePuzzleGrid(3, 3, 300, 300, () => 0.5);
  const byId = new Map(pieces.map(p => [p.id, p]));

  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 2; column++) {
      const left = byId.get(`${row}-${column}`)!;
      const right = byId.get(`${row}-${column + 1}`)!;
      expect(left.edges.right).not.toBe('flat');
      expect(right.edges.left).toBe(opposite(left.edges.right));
    }
  }

  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 3; column++) {
      const top = byId.get(`${row}-${column}`)!;
      const bottom = byId.get(`${row + 1}-${column}`)!;
      expect(top.edges.bottom).not.toBe('flat');
      expect(bottom.edges.top).toBe(opposite(top.edges.bottom));
    }
  }
});

test('a random function that always returns 0 (i.e. < 0.5) gives every internal connection the same orientation', () => {
  const pieces = generatePuzzleGrid(2, 2, 200, 200, () => 0);
  const byId = new Map(pieces.map(p => [p.id, p]));

  // random() < 0.5 is true here, so every connection flag is true ->
  // right = 'tab' for the left piece, left = 'blank' for the right piece.
  expect(byId.get('0-0')!.edges.right).toBe('tab');
  expect(byId.get('0-1')!.edges.left).toBe('blank');
  // Same flag drives bottom/top -> bottom = 'tab' for the top piece.
  expect(byId.get('0-0')!.edges.bottom).toBe('tab');
  expect(byId.get('1-0')!.edges.top).toBe('blank');
});

test('a single-piece (1x1) puzzle has all four edges flat', () => {
  const pieces = generatePuzzleGrid(1, 1, 100, 100, () => 0.5);

  expect(pieces).toHaveLength(1);
  expect(pieces[0].edges).toEqual({
    top: 'flat',
    right: 'flat',
    bottom: 'flat',
    left: 'flat',
  });
});
