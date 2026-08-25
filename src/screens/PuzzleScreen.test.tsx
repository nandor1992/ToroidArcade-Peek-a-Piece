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
