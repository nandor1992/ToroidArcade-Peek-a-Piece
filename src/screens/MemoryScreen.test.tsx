/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { MemoryScreen } from './MemoryScreen';
import { MemoryBoard, MATCH_PAUSE_MS } from '../games/memory/components/MemoryBoard';
import { MemoryCard } from '../games/memory/components/MemoryCard';
import type { Puzzle } from '../types/puzzle';

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
  randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  randomSpy.mockRestore();
  jest.useRealTimers();
});

async function render(props: Partial<React.ComponentProps<typeof MemoryScreen>> = {}) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryScreen pictures={stock(8)} pictureCount={3} {...props} />,
    );
  });
  // The board sizes its cards from a measured layout.
  const board = root!.root.findAll(
    node => typeof node.props.onLayout === 'function',
  )[0];
  await act(() => {
    board.props.onLayout({
      nativeEvent: { layout: { width: 600, height: 600 } },
    });
  });
  return root!;
}

function findByLabel(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) {
  return root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
}

function texts(root: ReactTestRenderer.ReactTestInstance): string[] {
  return root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children as string);
}

function cards(root: ReactTestRenderer.ReactTestRenderer) {
  return root.root.findAllByType(MemoryCard);
}

test('names the game and deals a board', async () => {
  const root = await render();

  expect(texts(root.root)).toContain('Family Memory');
  expect(cards(root)).toHaveLength(6);
});

test('passes the picture count straight through to the board', async () => {
  const root = await render({ pictureCount: 4 });

  expect(root.root.findByType(MemoryBoard).props.pictureCount).toBe(4);
  expect(cards(root)).toHaveLength(8);
});

test('defaults to six pictures when the host does not say', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<MemoryScreen pictures={stock(8)} />);
  });

  expect(root!.root.findByType(MemoryBoard).props.pictureCount).toBe(6);
});

test('the back button calls onBack', async () => {
  const onBack = jest.fn();
  const root = await render({ onBack });

  await act(() => {
    findByLabel(root.root, 'Back').props.onPress();
  });

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('hides the back button when there is nowhere to go', async () => {
  const root = await render();

  expect(
    root.root.findAll(node => node.props.accessibilityLabel === 'Back'),
  ).toHaveLength(0);
});

test('celebrates when every pair is found', async () => {
  jest.useFakeTimers();
  const root = await render({ pictureCount: 3 });

  expect(texts(root.root)).not.toContain('🎉 You found them all!');

  const pictures = [
    ...new Set(cards(root).map(card => card.props.card.pictureId)),
  ];
  for (const picture of pictures) {
    for (const which of [0, 1]) {
      const card = cards(root).filter(
        c => c.props.card.pictureId === picture,
      )[which];
      await act(() => {
        card.props.onPress(card.props.card);
      });
    }
    await act(async () => {
      jest.advanceTimersByTime(MATCH_PAUSE_MS);
    });
  }

  expect(texts(root.root)).toContain('🎉 You found them all!');
});

test('New game re-deals and clears the celebration', async () => {
  jest.useFakeTimers();
  const root = await render({ pictureCount: 3 });

  const pictures = [
    ...new Set(cards(root).map(card => card.props.card.pictureId)),
  ];
  for (const picture of pictures) {
    for (const which of [0, 1]) {
      const card = cards(root).filter(
        c => c.props.card.pictureId === picture,
      )[which];
      await act(() => {
        card.props.onPress(card.props.card);
      });
    }
    await act(async () => {
      jest.advanceTimersByTime(MATCH_PAUSE_MS);
    });
  }
  expect(texts(root.root)).toContain('🎉 You found them all!');

  await act(() => {
    findByLabel(root.root, 'New game').props.onPress();
  });

  expect(texts(root.root)).not.toContain('🎉 You found them all!');
  expect(cards(root).filter(card => card.props.faceUp)).toHaveLength(0);
});
