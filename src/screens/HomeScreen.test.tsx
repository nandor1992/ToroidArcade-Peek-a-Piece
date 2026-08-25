/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { HomeScreen } from './HomeScreen';
import type { Puzzle } from '../types/puzzle';

test('renders the starter puzzles when no photos have been uploaded', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen />);
  });

  const headers = root!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .filter(text => text === 'Your Photos' || text === 'Starter Puzzles');

  expect(headers).toEqual(['Starter Puzzles']);
});

test('shows uploaded photos first, ahead of the starter puzzles', async () => {
  const userPuzzles: Puzzle[] = [
    { id: 'user-1', title: 'Grandma', source: 'user' },
  ];

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen userPuzzles={userPuzzles} />);
  });

  const headers = root!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .filter(text => text === 'Your Photos' || text === 'Starter Puzzles');

  expect(headers).toEqual(['Your Photos', 'Starter Puzzles']);
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
