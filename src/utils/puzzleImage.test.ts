/**
 * @format
 */

import { puzzleImageSource, puzzleSkiaSource } from './puzzleImage';
import type { Puzzle } from '../types/puzzle';

const base = { id: 'p1', title: 'P', source: 'stock' } as const;

test('a bundled asset is passed straight through to both consumers', () => {
  const puzzle: Puzzle = { ...base, imageAsset: 42 };
  expect(puzzleImageSource(puzzle)).toBe(42);
  expect(puzzleSkiaSource(puzzle)).toBe(42);
});

test('a parent photo becomes { uri } for <Image>, a bare string for Skia', () => {
  const puzzle: Puzzle = {
    ...base,
    source: 'user',
    imageUri: 'file:///g.jpg',
  };
  expect(puzzleImageSource(puzzle)).toEqual({ uri: 'file:///g.jpg' });
  expect(puzzleSkiaSource(puzzle)).toBe('file:///g.jpg');
});

test('a puzzle with no artwork resolves to undefined', () => {
  const puzzle: Puzzle = { ...base };
  expect(puzzleImageSource(puzzle)).toBeUndefined();
  expect(puzzleSkiaSource(puzzle)).toBeUndefined();
});

test('a bundled asset id of 0 still counts as present', () => {
  // Metro asset ids start at 1 in practice, but the guard is `!= null`, not
  // truthiness — a 0 here must not fall through to the URI / undefined path.
  const puzzle: Puzzle = { ...base, imageAsset: 0 };
  expect(puzzleImageSource(puzzle)).toBe(0);
  expect(puzzleSkiaSource(puzzle)).toBe(0);
});
