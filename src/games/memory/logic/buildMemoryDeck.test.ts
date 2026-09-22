/**
 * @format
 */

import { buildMemoryDeck } from './buildMemoryDeck';
import type { Puzzle } from '../../../types/puzzle';

function stock(n: number): Puzzle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    title: `Picture ${i}`,
    source: 'stock' as const,
    imageAsset: 100 + i,
  }));
}

// `random` fixed to 0 makes Fisher-Yates deterministic, so the assertions
// below are about content and structure rather than a particular order.
const noShuffle = () => 0;

test('deals two cards per picture', () => {
  const deck = buildMemoryDeck(stock(8), 3, noShuffle);

  expect(deck).toHaveLength(6);
  const byPicture = new Map<string, number>();
  for (const card of deck) {
    byPicture.set(card.pictureId, (byPicture.get(card.pictureId) ?? 0) + 1);
  }
  expect([...byPicture.values()]).toEqual([2, 2, 2]);
});

test('every card id is unique, and pair members share a pictureId', () => {
  const deck = buildMemoryDeck(stock(6), 6, noShuffle);

  expect(new Set(deck.map(c => c.id)).size).toBe(deck.length);
  expect(new Set(deck.map(c => c.pictureId)).size).toBe(6);
});

test('carries the picture artwork and title onto both cards', () => {
  const deck = buildMemoryDeck(stock(1), 1, noShuffle);

  expect(deck).toHaveLength(2);
  for (const card of deck) {
    expect(card.source).toBe(100);
    expect(card.title).toBe('Picture 0');
  }
});

test('resolves an uploaded photo to a uri source', () => {
  const deck = buildMemoryDeck(
    [
      {
        id: 'u1',
        title: 'a.jpg',
        source: 'user',
        imageUri: 'file:///a.jpg',
      },
    ],
    1,
    noShuffle,
  );

  expect(deck[0].source).toEqual({ uri: 'file:///a.jpg' });
});

test('drops pictures with no artwork — a blank card cannot be matched by sight', () => {
  const pictures: Puzzle[] = [
    ...stock(2),
    { id: 'blank', title: 'No art', source: 'stock' },
  ];

  const deck = buildMemoryDeck(pictures, 3, noShuffle);

  expect(deck).toHaveLength(4);
  expect(deck.map(c => c.pictureId)).not.toContain('blank');
});

test('plays with what there is when there are fewer pictures than asked for', () => {
  const deck = buildMemoryDeck(stock(2), 6, noShuffle);

  // Two pairs, not six — a picture is never reused across two pairs, which
  // would make those pairs indistinguishable.
  expect(deck).toHaveLength(4);
  expect(new Set(deck.map(c => c.pictureId)).size).toBe(2);
});

test('deals nothing when there are no pictures, or none requested', () => {
  expect(buildMemoryDeck([], 6, noShuffle)).toEqual([]);
  expect(buildMemoryDeck(stock(4), 0, noShuffle)).toEqual([]);
  expect(buildMemoryDeck(stock(4), -1, noShuffle)).toEqual([]);
});

test('shuffles both the selection and the deal', () => {
  const pictures = stock(10);
  const sequence = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.05];
  let i = 0;
  const cycling = () => sequence[i++ % sequence.length];

  const first = buildMemoryDeck(pictures, 4, cycling);
  const second = buildMemoryDeck(pictures, 4, cycling);

  // Selection varies: with ten pictures and four dealt, two rounds should
  // not draw the identical set in the identical order.
  expect(first.map(c => c.id)).not.toEqual(second.map(c => c.id));
  // Order varies too — the pair members are not left adjacent.
  const positions = new Map<string, number[]>();
  first.forEach((card, index) => {
    positions.set(card.pictureId, [
      ...(positions.get(card.pictureId) ?? []),
      index,
    ]);
  });
  const adjacent = [...positions.values()].filter(
    ([a, b]) => Math.abs(a - b) === 1,
  );
  expect(adjacent.length).toBeLessThan(positions.size);
});
