/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PuzzleScreen } from './PuzzleScreen';
import type { Puzzle } from '../types/puzzle';

const PUZZLES: Puzzle[] = [
  { id: 'p1', title: 'Puppy', source: 'stock' },
  { id: 'p2', title: 'Rocket', source: 'stock' },
  { id: 'p3', title: 'Flower', source: 'stock' },
];

function findButton(root: ReactTestRenderer.ReactTestInstance, label: string) {
  return root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
}

test('back button calls onBack', async () => {
  const onBack = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleScreen puzzles={PUZZLES} initialPuzzleId="p1" onBack={onBack} />,
    );
  });

  await act(() => {
    findButton(root!.root, 'Back').props.onPress();
  });

  expect(onBack).toHaveBeenCalledTimes(1);
});

function currentPuzzleLabel(root: ReactTestRenderer.ReactTestInstance) {
  // The image placeholder is the only accessibilityLabel-bearing node that
  // isn't one of the back/next buttons (those carry accessibilityRole
  // "button"; this doesn't).
  return root.findAll(
    node =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityRole !== 'button',
  )[0]?.props.accessibilityLabel;
}

test('next button advances to the next puzzle, wrapping at the end', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleScreen puzzles={PUZZLES} initialPuzzleId="p3" />,
    );
  });

  expect(currentPuzzleLabel(root!.root)).toBe('Flower');

  await act(() => {
    findButton(root!.root, 'Next puzzle').props.onPress();
  });

  expect(currentPuzzleLabel(root!.root)).toBe('Puppy');
});

test('falls back to the first puzzle when initialPuzzleId is not found', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleScreen puzzles={PUZZLES} initialPuzzleId="missing" />,
    );
  });

  expect(currentPuzzleLabel(root!.root)).toBe('Puppy');
});

function findPuzzleBoard(root: ReactTestRenderer.ReactTestInstance) {
  // Pressable (the back/next buttons) also wires up onResponderGrant
  // internally, so that alone isn't unique — PuzzleBoard's container is
  // the only node that also sets onLayout.
  return root.findAll(
    node =>
      typeof node.props.onResponderGrant === 'function' &&
      typeof node.props.onLayout === 'function',
  )[0];
}

test('a puzzle with a photo renders the interactive board, not the emoji placeholder', async () => {
  const withPhoto: Puzzle[] = [
    { id: 'u1', title: 'Grandma', source: 'user', imageUri: 'file:///g.jpg' },
  ];
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleScreen puzzles={withPhoto} initialPuzzleId="u1" />,
    );
  });

  expect(findPuzzleBoard(root!.root)).toBeDefined();
});

test('a starter puzzle with no photo still shows the emoji placeholder, not a board', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleScreen puzzles={PUZZLES} initialPuzzleId="p1" />,
    );
  });

  expect(findPuzzleBoard(root!.root)).toBeUndefined();
});

test('solving the board shows the "Great job!" banner', async () => {
  const withPhoto: Puzzle[] = [
    { id: 'u1', title: 'Grandma', source: 'user', imageUri: 'file:///g.jpg' },
  ];
  const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleScreen puzzles={withPhoto} initialPuzzleId="u1" />,
    );
  });

  const board = findPuzzleBoard(root!.root);
  await act(() => {
    board.props.onLayout({
      nativeEvent: { layout: { width: 200, height: 200 } },
    });
  });

  const bannerVisible = () =>
    root!.root.findAll(node => node.props.children === '🎉 Great job!')
      .length > 0;
  expect(bannerVisible()).toBe(false);

  // Default board is a 2x2 grid of 100x100 pieces, all scrambled to
  // (0, 0) with Math.random mocked — same technique as
  // PuzzleBoard.test.tsx, driven through PuzzleScreen this time.
  const targets = [
    { x: 101, y: 101 },
    { x: 1, y: 101 },
    { x: 101, y: 1 },
    { x: 1, y: 1 },
  ];
  for (const target of targets) {
    await act(() => {
      board.props.onResponderGrant({
        nativeEvent: { locationX: 1, locationY: 1 },
      });
    });
    await act(() => {
      board.props.onResponderMove({
        nativeEvent: { locationX: target.x, locationY: target.y },
      });
    });
    await act(() => {
      board.props.onResponderRelease();
    });
  }

  expect(bannerVisible()).toBe(true);

  randomSpy.mockRestore();
});
