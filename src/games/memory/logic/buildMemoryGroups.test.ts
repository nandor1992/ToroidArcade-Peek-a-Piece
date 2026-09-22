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

test('tops a short final round up from the start of the pool', () => {
  const groups = buildMemoryGroups(stock(14), 6);

  expect(sizes(groups)).toEqual([6, 6, 6]);
  // The two left over, then back round to the beginning for four more.
  expect(groups[2].pictures.map(p => p.id)).toEqual([
    'p12',
    'p13',
    'p0',
    'p1',
    'p2',
    'p3',
  ]);
});

test('fills even a one-picture remainder to a full round', () => {
  // 13 at 6 would otherwise leave a single picture — a round won by
  // tapping twice.
  const groups = buildMemoryGroups(stock(13), 6);

  expect(sizes(groups)).toEqual([6, 6, 6]);
  expect(groups[2].pictures.map(p => p.id)).toEqual([
    'p12',
    'p0',
    'p1',
    'p2',
    'p3',
    'p4',
  ]);
});

test('the eight starter pictures make two full rounds of six', () => {
  const groups = buildMemoryGroups(stock(8), 6);

  expect(sizes(groups)).toEqual([6, 6]);
  expect(groups[1].pictures.map(p => p.id)).toEqual([
    'p6',
    'p7',
    'p0',
    'p1',
    'p2',
    'p3',
  ]);
});

test('never repeats a picture within one round', () => {
  // Four cards of one picture would leave two of them with no partner, so
  // the round could not be finished. Checked across a spread of pools
  // that all leave awkward remainders.
  for (const total of [7, 8, 9, 10, 11, 13, 14, 17, 21]) {
    for (const size of [3, 4, 6, 8, 10]) {
      for (const group of buildMemoryGroups(stock(total), size)) {
        const ids = group.pictures.map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  }
});

test('every round is the requested size once the pool exceeds one round', () => {
  for (const total of [7, 9, 13, 14, 17, 21]) {
    for (const size of [3, 4, 6]) {
      if (total <= size) {
        continue;
      }
      expect(sizes(buildMemoryGroups(stock(total), size))).toEqual(
        Array(Math.ceil(total / size)).fill(size),
      );
    }
  }
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

test('a pool smaller than one round stays short — there is nothing to borrow', () => {
  // Topping up here could only repeat a picture already in the round,
  // which would break matching. A 3-picture round it is.
  expect(sizes(buildMemoryGroups(stock(3), 6))).toEqual([3]);
  expect(sizes(buildMemoryGroups(stock(2), 6))).toEqual([2]);
  // Exactly one round's worth divides evenly and needs no filling.
  expect(sizes(buildMemoryGroups(stock(6), 6))).toEqual([6]);
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

test('every picture in the pool appears in at least one round', () => {
  const groups = buildMemoryGroups(stock(17), 4);
  const ids = new Set(groups.flatMap(g => g.pictures.map(p => p.id)));

  expect(ids.size).toBe(17);
  // 17 at 4 is five rounds, the last topped up from the start — so more
  // slots than pictures, by design.
  expect(groups.flatMap(g => g.pictures)).toHaveLength(20);
});
