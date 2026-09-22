/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { MemoryScreen } from './MemoryScreen';
import { MATCH_PAUSE_MS } from '../games/memory/components/MemoryBoard';
import { MemoryCard } from '../games/memory/components/MemoryCard';
import { buildMemoryGroups } from '../games/memory/logic/buildMemoryGroups';
import type { Puzzle } from '../types/puzzle';

function stock(n: number): Puzzle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    title: `Picture ${i}`,
    source: 'stock' as const,
    imageAsset: 100 + i,
  }));
}

/** Three rounds of three pictures each. */
const GROUPS = buildMemoryGroups(stock(9), 3);

let randomSpy: jest.SpyInstance<number, []>;

beforeEach(() => {
  randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  randomSpy.mockRestore();
  jest.useRealTimers();
});

async function layOutBoard(root: ReactTestRenderer.ReactTestRenderer) {
  const board = root.root.findAll(
    node => typeof node.props.onLayout === 'function',
  )[0];
  await act(() => {
    board.props.onLayout({
      nativeEvent: { layout: { width: 600, height: 600 } },
    });
  });
}

async function render(
  props: Partial<React.ComponentProps<typeof MemoryScreen>> = {},
) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryScreen groups={GROUPS} initialGroupId="set-1" {...props} />,
    );
  });
  await layOutBoard(root!);
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

/** Which round is on screen — the board layer is labelled with its title. */
function currentSet(root: ReactTestRenderer.ReactTestRenderer): string {
  return root.root.findAll(
    node =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityRole !== 'button',
  )[0].props.accessibilityLabel;
}

async function press(root: ReactTestRenderer.ReactTestRenderer, label: string) {
  await act(() => {
    findByLabel(root.root, label).props.onPress();
  });
  await layOutBoard(root);
}

async function clearBoard(root: ReactTestRenderer.ReactTestRenderer) {
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
}

test('opens the round it was asked for', async () => {
  const root = await render({ initialGroupId: 'set-2' });

  expect(currentSet(root)).toBe('Set 2');
  expect(cards(root)).toHaveLength(6); // 3 pictures, 2 cards each
});

test('falls back to the first round when the id is unknown', async () => {
  const root = await render({ initialGroupId: 'nope' });

  expect(currentSet(root)).toBe('Set 1');
});

test('names the game in the header', async () => {
  const root = await render();

  expect(texts(root.root)).toContain('Family Memory');
});

test('Next and Previous page through the rounds', async () => {
  const root = await render({ initialGroupId: 'set-1' });

  await press(root, 'Next set');
  expect(currentSet(root)).toBe('Set 2');
  await press(root, 'Next set');
  expect(currentSet(root)).toBe('Set 3');

  await press(root, 'Previous set');
  expect(currentSet(root)).toBe('Set 2');
});

test('Next wraps round from the last set to the first', async () => {
  const root = await render({ initialGroupId: 'set-3' });

  await press(root, 'Next set');
  expect(currentSet(root)).toBe('Set 1');
});

test('Previous wraps round from the first set to the last', async () => {
  const root = await render({ initialGroupId: 'set-1' });

  await press(root, 'Previous set');
  expect(currentSet(root)).toBe('Set 3');
});

test('switching rounds deals a clean board', async () => {
  jest.useFakeTimers();
  const root = await render();

  const [first] = [
    ...new Set(cards(root).map(card => card.props.card.pictureId)),
  ];
  const card = cards(root).filter(c => c.props.card.pictureId === first)[0];
  await act(() => {
    card.props.onPress(card.props.card);
  });
  expect(cards(root).filter(c => c.props.faceUp)).toHaveLength(1);

  await press(root, 'Next set');

  expect(cards(root).filter(c => c.props.faceUp)).toHaveLength(0);
});

test('Home calls onBack', async () => {
  const onBack = jest.fn();
  const root = await render({ onBack });

  await act(() => {
    findByLabel(root.root, 'Home').props.onPress();
  });

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('celebrates when every pair in the round is found', async () => {
  jest.useFakeTimers();
  const root = await render();

  expect(texts(root.root)).not.toContain('🎉 You found them all!');
  await clearBoard(root);
  expect(texts(root.root)).toContain('🎉 You found them all!');
});

test('New game re-deals the round and clears the celebration', async () => {
  jest.useFakeTimers();
  const root = await render();

  await clearBoard(root);
  expect(texts(root.root)).toContain('🎉 You found them all!');

  await press(root, 'New game');

  expect(texts(root.root)).not.toContain('🎉 You found them all!');
  expect(cards(root).filter(card => card.props.faceUp)).toHaveLength(0);
});

test('moving to another round clears a celebration', async () => {
  jest.useFakeTimers();
  const root = await render();

  await clearBoard(root);
  expect(texts(root.root)).toContain('🎉 You found them all!');

  await press(root, 'Next set');

  expect(texts(root.root)).not.toContain('🎉 You found them all!');
});

test('renders nothing when there are no rounds to play', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <MemoryScreen groups={[]} initialGroupId="set-1" />,
    );
  });

  expect(root!.toJSON()).toBeNull();
});
