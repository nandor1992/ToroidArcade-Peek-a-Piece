/**
 * @format
 */

import { buildMemoryGroups } from './buildMemoryGroups';
import type { Puzzle } from '../../../types/puzzle';

function stock(n: number): Puzzle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    title: `Picture ${i}`,
    source: 'stock' as const,
    imageAsset: 100 + i,
  }));
}

const sizes = (groups: ReturnType<typeof buildMemoryGroups>) =>
  groups.map(group => group.pictures.length);

test('splits the pool into rounds of the requested size', () => {
  const groups = buildMemoryGroups(stock(12), 6);

  expect(sizes(groups)).toEqual([6, 6]);
  expect(groups.map(g => g.id)).toEqual(['set-1', 'set-2']);
  expect(groups.map(g => g.title)).toEqual(['Set 1', 'Set 2']);
});

test('keeps a short final round when it is still playable', () => {
  const groups = buildMemoryGroups(stock(14), 6);

  expect(sizes(groups)).toEqual([6, 6, 2]);
});

test('folds a one-picture remainder into the round before it', () => {
  // 13 pictures at 6 would leave a single picture — a round won by
  // tapping twice. It joins the previous round instead.
  const groups = buildMemoryGroups(stock(13), 6);

  expect(sizes(groups)).toEqual([6, 7]);
  expect(groups[1].pictures.map(p => p.id)).toEqual([
    'p6',
    'p7',
    'p8',
    'p9',
    'p10',
    'p11',
    'p12',
  ]);
});

test('preserves pool order, so uploaded photos come first', () => {
  const pictures: Puzzle[] = [
    { id: 'u1', title: 'a.jpg', source: 'user', imageUri: 'file:///a.jpg' },
    ...stock(3),
  ];

  const groups = buildMemoryGroups(pictures, 4);

  expect(groups[0].pictures.map(p => p.id)).toEqual(['u1', 'p0', 'p1', 'p2']);
});

test('is stable — the same pool gives the same rounds every time', () => {
  const first = buildMemoryGroups(stock(10), 4);
  const second = buildMemoryGroups(stock(10), 4);

  expect(first.map(g => g.pictures.map(p => p.id))).toEqual(
    second.map(g => g.pictures.map(p => p.id)),
  );
});

test('drops pictures with no artwork before grouping', () => {
  const pictures: Puzzle[] = [
    ...stock(4),
    { id: 'blank', title: 'No art', source: 'stock' },
  ];

  const groups = buildMemoryGroups(pictures, 4);

  expect(sizes(groups)).toEqual([4]);
  expect(groups.flatMap(g => g.pictures.map(p => p.id))).not.toContain(
    'blank',
  );
});

test('a pool smaller than one round still makes a single playable round', () => {
  expect(sizes(buildMemoryGroups(stock(3), 6))).toEqual([3]);
});

test('gives no rounds when there is nothing playable', () => {
  expect(buildMemoryGroups([], 6)).toEqual([]);
  // One picture is one pair — not a round worth a tile.
  expect(buildMemoryGroups(stock(1), 6)).toEqual([]);
  expect(
    buildMemoryGroups([{ id: 'b', title: 'b', source: 'stock' }], 6),
  ).toEqual([]);
});

test('refuses a group size that could not make a real round', () => {
  expect(buildMemoryGroups(stock(10), 1)).toEqual([]);
  expect(buildMemoryGroups(stock(10), 0)).toEqual([]);
});

test('every picture in the pool lands in exactly one round', () => {
  const groups = buildMemoryGroups(stock(17), 4);
  const ids = groups.flatMap(g => g.pictures.map(p => p.id));

  expect(ids).toHaveLength(17);
  expect(new Set(ids).size).toBe(17);
});
