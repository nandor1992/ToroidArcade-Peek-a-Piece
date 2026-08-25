/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';
import type { Puzzle } from '../types/puzzle';

function tileOrder(root: ReactTestRenderer.ReactTestInstance): string[] {
  return root
    .findAll(node => typeof node.props.onPress === 'function')
    .map(node => node.props.accessibilityLabel)
    .filter(
      (label): label is string =>
        typeof label === 'string' && label !== 'Parent settings',
    );
}

test('renders the starter puzzles when no photos have been uploaded', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen />);
  });

  expect(tileOrder(root!.root)).toEqual([
    'Puppy',
    'Rocket',
    'Flower',
    'Beach Ball',
    'Teddy Bear',
    'Rainbow',
  ]);
});

test('shows uploaded photos first, ahead of the starter puzzles, in one grid', async () => {
  const userPuzzles: Puzzle[] = [
    { id: 'user-1', title: 'Grandma', source: 'user' },
  ];

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen userPuzzles={userPuzzles} />);
  });

  const order = tileOrder(root!.root);
  expect(order[0]).toBe('Grandma');
  expect(order.slice(1)).toEqual([
    'Puppy',
    'Rocket',
    'Flower',
    'Beach Ball',
    'Teddy Bear',
    'Rainbow',
  ]);
});

test('tapping a tile reports the selected puzzle', async () => {
  const onSelectPuzzle = jest.fn();

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <HomeScreen onSelectPuzzle={onSelectPuzzle} />,
    );
  });

  // Different pnpm-resolved copies of `react-native` mean the imported
  // `Pressable` reference here isn't the same object HomeScreen renders
  // with, so match the tile by its onPress handler instead of by type.
  const tile = root!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Puppy' &&
      typeof node.props.onPress === 'function',
  )[0];

  await act(() => {
    tile.props.onPress();
  });

  expect(onSelectPuzzle).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'stock-1' }),
  );
});

test('tapping the parent button opens the parent area', async () => {
  const onOpenParentArea = jest.fn();

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <HomeScreen onOpenParentArea={onOpenParentArea} />,
    );
  });

  const button = root!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Parent settings' &&
      typeof node.props.onPress === 'function',
  )[0];

  await act(() => {
    button.props.onPress();
  });

  expect(onOpenParentArea).toHaveBeenCalledTimes(1);
});
