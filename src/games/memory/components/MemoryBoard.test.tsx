/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  MemoryBoard,
  MISMATCH_PAUSE_MS,
  MATCH_PAUSE_MS,
  gridColumns,
} from './MemoryBoard';
import { MemoryCard } from './MemoryCard';
import type { Puzzle } from '../../../types/puzzle';

function stock(n: number): Puzzle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    title: `Picture ${i}`,
    source: 'stock' as const,
    imageAsset: 100 + i,
  }));
}

let randomSpy: jest.SpyInstance<number, []>;

beforeEach(() => {
  // Fixed only so the *selection* is deterministic — which pictures get
  // dealt. No test assumes a deal order: they address cards by picture id,
  // so the shuffle is free to put them anywhere.
  randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  randomSpy.mockRestore();
  jest.useRealTimers();
});

async function layOut(root: ReactTestRenderer.ReactTestRenderer) {
  const container = root.root.findAll(
    node => typeof node.props.onLayout === 'function',
  )[0];
  await act(() => {
    container.props.onLayout({
      nativeEvent: { layout: { width: 600, height: 600 } },
    });
  });
}

async function renderBoard(
  props: Partial<React.ComponentProps<typeof MemoryBoard>> = {},
) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryBoard pictures={stock(8)} pictureCount={3} {...props} />,
    );
  });
  await layOut(root!);
  return root!;
}

/** The rendered cards, in deal order. */
function cards(root: ReactTestRenderer.ReactTestRenderer) {
  return root.root.findAllByType(MemoryCard);
}

/** The picture ids on the board, de-duplicated. */
function dealtPictures(root: ReactTestRenderer.ReactTestRenderer): string[] {
  return [...new Set(cards(root).map(card => card.props.card.pictureId))];
}

/**
 * Taps the `which`-th card of a picture's pair. Addressing cards by
 * picture rather than by grid position keeps each test independent of how
 * the deck happened to shuffle.
 */
async function tap(
  root: ReactTestRenderer.ReactTestRenderer,
  pictureId: string,
  which: 0 | 1 = 0,
) {
  const card = cards(root).filter(
    c => c.props.card.pictureId === pictureId,
  )[which];
  await act(() => {
    card.props.onPress(card.props.card);
  });
}

function faceUpCount(root: ReactTestRenderer.ReactTestRenderer): number {
  return cards(root).filter(card => card.props.faceUp).length;
}

function matchedCount(root: ReactTestRenderer.ReactTestRenderer): number {
  return cards(root).filter(card => card.props.matched).length;
}

test('deals two cards per picture, all face down', async () => {
  const root = await renderBoard({ pictureCount: 3 });

  expect(cards(root)).toHaveLength(6);
  expect(dealtPictures(root)).toHaveLength(3);
  expect(faceUpCount(root)).toBe(0);
});

test('respects the requested picture count', async () => {
  const root = await renderBoard({ pictureCount: 6 });

  expect(cards(root)).toHaveLength(12);
  expect(dealtPictures(root)).toHaveLength(6);
});

test('tapping a card turns it face up', async () => {
  const root = await renderBoard();
  const [first] = dealtPictures(root);

  await tap(root, first);

  expect(faceUpCount(root)).toBe(1);
});

test('a matching pair stays face up and is marked matched', async () => {
  jest.useFakeTimers();
  const root = await renderBoard();
  const [a] = dealtPictures(root);

  await tap(root, a, 0);
  await tap(root, a, 1);
  await act(async () => {
    jest.advanceTimersByTime(MATCH_PAUSE_MS);
  });

  expect(faceUpCount(root)).toBe(2);
  expect(matchedCount(root)).toBe(2);
});

test('a mismatched pair turns back over', async () => {
  jest.useFakeTimers();
  const root = await renderBoard();
  const [a, b] = dealtPictures(root);

  await tap(root, a);
  await tap(root, b);
  expect(faceUpCount(root)).toBe(2);

  await act(async () => {
    jest.advanceTimersByTime(MISMATCH_PAUSE_MS);
  });

  expect(faceUpCount(root)).toBe(0);
  expect(matchedCount(root)).toBe(0);
});

test('a mismatched pair stays up long enough to memorise', async () => {
  jest.useFakeTimers();
  const root = await renderBoard();
  const [a, b] = dealtPictures(root);

  await tap(root, a);
  await tap(root, b);

  // Still up just before the pause elapses — the reveal is the whole game.
  await act(async () => {
    jest.advanceTimersByTime(MISMATCH_PAUSE_MS - 50);
  });
  expect(faceUpCount(root)).toBe(2);
});

test('a third tap while two cards are showing does nothing', async () => {
  jest.useFakeTimers();
  const root = await renderBoard();
  const [a, b, c] = dealtPictures(root);

  await tap(root, a);
  await tap(root, b);
  await tap(root, c); // mis-tap during the reveal

  expect(faceUpCount(root)).toBe(2);
});

test('tapping the same card twice does not count as a pair', async () => {
  jest.useFakeTimers();
  const root = await renderBoard();
  const [a] = dealtPictures(root);

  await tap(root, a, 0);
  await tap(root, a, 0); // the very same card again

  expect(faceUpCount(root)).toBe(1);
  // Still only one card up, so the board is still waiting for a second.
  await tap(root, a, 1);
  await act(async () => {
    jest.advanceTimersByTime(MATCH_PAUSE_MS);
  });
  expect(matchedCount(root)).toBe(2);
});

test('tapping an already-matched card does nothing', async () => {
  jest.useFakeTimers();
  const root = await renderBoard();
  const [a, b] = dealtPictures(root);

  await tap(root, a, 0);
  await tap(root, a, 1);
  await act(async () => {
    jest.advanceTimersByTime(MATCH_PAUSE_MS);
  });

  await tap(root, a, 0); // already found
  await tap(root, b, 0); // a fresh card

  // Only the new card joined the two matched ones — the matched card never
  // became "turned", so it can't be paired with anything again.
  expect(faceUpCount(root)).toBe(3);
  expect(matchedCount(root)).toBe(2);
});

test('finding every pair calls onSolved exactly once', async () => {
  jest.useFakeTimers();
  const onSolved = jest.fn();
  const root = await renderBoard({ pictureCount: 3, onSolved });

  for (const picture of dealtPictures(root)) {
    await tap(root, picture, 0);
    await tap(root, picture, 1);
    await act(async () => {
      jest.advanceTimersByTime(MATCH_PAUSE_MS);
    });
  }

  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(matchedCount(root)).toBe(6);
});

test('resetSignal re-deals a fresh, face-down board', async () => {
  jest.useFakeTimers();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryBoard pictures={stock(8)} pictureCount={3} resetSignal={0} />,
    );
  });
  await layOut(root!);

  const [a] = dealtPictures(root!);
  await tap(root!, a, 0);
  await tap(root!, a, 1);
  await act(async () => {
    jest.advanceTimersByTime(MATCH_PAUSE_MS);
  });
  expect(matchedCount(root!)).toBe(2);

  await act(() => {
    root.update(
      <MemoryBoard pictures={stock(8)} pictureCount={3} resetSignal={1} />,
    );
  });

  expect(faceUpCount(root!)).toBe(0);
  expect(matchedCount(root!)).toBe(0);
  expect(cards(root!)).toHaveLength(6);
});

test('changing the picture count re-deals rather than leaving a stale board', async () => {
  jest.useFakeTimers();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryBoard pictures={stock(8)} pictureCount={3} />,
    );
  });
  await layOut(root!);
  expect(cards(root!)).toHaveLength(6);

  await act(() => {
    root.update(<MemoryBoard pictures={stock(8)} pictureCount={4} />);
  });

  expect(cards(root!)).toHaveLength(8);
  expect(faceUpCount(root!)).toBe(0);
});

test('a re-render with an equal picture list does not re-deal', async () => {
  jest.useFakeTimers();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryBoard pictures={stock(8)} pictureCount={3} />,
    );
  });
  await layOut(root!);

  const [a] = dealtPictures(root!);
  await tap(root!, a, 0);

  // A fresh array with the same contents — what a parent that rebuilds its
  // list every render passes. The turned card must stay turned.
  await act(() => {
    root.update(<MemoryBoard pictures={stock(8)} pictureCount={3} />);
  });

  expect(faceUpCount(root!)).toBe(1);
});

test('shows a message rather than an empty board when there are no pictures', async () => {
  const root = await renderBoard({ pictures: [] });

  expect(cards(root)).toHaveLength(0);
  const texts = root.root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children);
  expect(texts).toContain('No pictures yet');
});

describe('gridColumns', () => {
  test('lays a wide area out wider than a tall one', () => {
    expect(gridColumns(12, 900, 400)).toBeGreaterThan(
      gridColumns(12, 400, 900),
    );
  });

  test('picks the column count that makes the cards biggest', () => {
    // A square area with 12 cards: something between 1 and 12 per row
    // always beats a single row or a single column.
    const columns = gridColumns(12, 600, 600);
    expect(columns).toBeGreaterThan(1);
    expect(columns).toBeLessThan(12);
  });

  test('degrades safely before the board has been measured', () => {
    expect(gridColumns(12, 0, 0)).toBe(1);
    expect(gridColumns(0, 600, 600)).toBe(1);
  });
});
