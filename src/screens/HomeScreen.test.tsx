/**
 * @format
 */

import React from 'react';
import { useWindowDimensions } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';
import type { Puzzle } from '../types/puzzle';

const STARTER_TITLES = [
  'Meadow',
  'Fairground',
  'Climbing',
  'Tractor',
  'Sandpit',
  'Train',
  'Theatre',
  'Teddies',
];

function tileOrder(root: ReactTestRenderer.ReactTestInstance): string[] {
  return root
    .findAll(node => typeof node.props.onPress === 'function')
    .map(node => node.props.accessibilityLabel)
    .filter(
      (label): label is string =>
        typeof label === 'string' && label !== 'Parent settings',
    );
}

// The grid is built by chunking the puzzle list into rows; the FlatList's
// `data` prop is that array of rows, so its shape tells us how many
// columns were used (spacer padding on a short last row is separate).
function rowSizes(root: ReactTestRenderer.ReactTestInstance): number[] {
  const list = root.findAll(node => Array.isArray(node.props.data))[0];
  return (list.props.data as unknown[][]).map(row => row.length);
}

function mockWidth(width: number) {
  (useWindowDimensions as jest.Mock).mockReturnValue({
    width,
    height: 1024,
    scale: 2,
    fontScale: 2,
  });
}

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

beforeEach(() => {
  mockWidth(400); // phone by default
});

test('renders the starter puzzles when no photos have been uploaded', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen />);
  });

  expect(tileOrder(root!.root)).toEqual(STARTER_TITLES);
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
  expect(order.slice(1)).toEqual(STARTER_TITLES);
});

test('lays the grid out 2-wide on a phone and 4-wide on a tablet', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;

  mockWidth(400);
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen />);
  });
  // 8 starter puzzles → four rows of two.
  expect(rowSizes(root!.root)).toEqual([2, 2, 2, 2]);

  mockWidth(900);
  await act(() => {
    root!.update(<HomeScreen />);
  });
  // Same eight → two rows of four.
  expect(rowSizes(root!.root)).toEqual([4, 4]);

  mockWidth(600);
  await act(() => {
    root!.update(<HomeScreen />);
  });
  // In between → rows of three (3, 3, 2).
  expect(rowSizes(root!.root)).toEqual([3, 3, 2]);
});

test('a short last row keeps its real tile count (spacers fill the rest)', async () => {
  mockWidth(900); // 4 columns
  const userPuzzles: Puzzle[] = [
    { id: 'user-1', title: 'Grandma', source: 'user' },
  ];

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<HomeScreen userPuzzles={userPuzzles} />);
  });

  // 9 tiles across 4 columns → rows of 4, 4, 1.
  expect(rowSizes(root!.root)).toEqual([4, 4, 1]);
  expect(tileOrder(root!.root)).toHaveLength(9);
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
      node.props.accessibilityLabel === 'Meadow' &&
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
