/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Circle, Group, Path } from '@shopify/react-native-skia';
import { GameMark } from './GameMark';
import {
  MARK_CANVAS,
  MEMORY_MARK,
  PUZZLE_MARK,
  EYE_COLOR,
} from './gameMarkGeometry';

// The manual Skia mock renders these as null, but react-test-renderer still
// records the elements — so they can be counted and their props read.
async function render(props: Parameters<typeof GameMark>[0]) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<GameMark {...props} />);
  });
  return root!;
}

test('draws every shape and eye of the puzzle mark', async () => {
  const root = await render({ name: 'puzzle' });

  expect(root.root.findAllByType(Path)).toHaveLength(PUZZLE_MARK.shapes.length);
  // Two circles per eye: the navy iris and its white catchlight.
  expect(root.root.findAllByType(Circle)).toHaveLength(
    PUZZLE_MARK.eyes.length * 2,
  );
});

test('draws every shape and eye of the memory mark', async () => {
  const root = await render({ name: 'memory' });

  expect(root.root.findAllByType(Path)).toHaveLength(MEMORY_MARK.shapes.length);
  expect(root.root.findAllByType(Circle)).toHaveLength(
    MEMORY_MARK.eyes.length * 2,
  );
});

test('scales the authored geometry to the requested size', async () => {
  const root = await render({ name: 'puzzle', size: 128 });

  const group = root.root.findAllByType(Group)[0];
  expect(group.props.transform).toEqual([{ scale: 128 / MARK_CANVAS }]);
});

test('lays out a square frame at the requested size', async () => {
  const root = await render({ name: 'memory', size: 64 });

  const frame = root.root.findAll(
    node => node.props.accessibilityElementsHidden === true,
  )[0];
  expect([frame.props.style].flat(2)).toContainEqual({
    width: 64,
    height: 64,
  });
});

test('eyes are drawn before the shapes, so the shapes overlap them', async () => {
  const root = await render({ name: 'puzzle' });

  // Walking the whole tree in order, every Circle must come before every Path
  // — that ordering is what buries the bottom of each eye behind the mark.
  const drawn = root.root
    .findAll(node => node.type === Circle || node.type === Path)
    .map(node => (node.type === Circle ? 'eye' : 'shape'));
  expect(drawn.indexOf('shape')).toBeGreaterThan(drawn.lastIndexOf('eye'));
});

test('the eyes use the brand navy', async () => {
  const root = await render({ name: 'puzzle' });

  const irises = root.root
    .findAllByType(Circle)
    .filter(node => node.props.color === EYE_COLOR);
  expect(irises).toHaveLength(PUZZLE_MARK.eyes.length);
});
