/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PuzzleBoard } from './PuzzleBoard';

function findBoard(root: ReactTestRenderer.ReactTestInstance) {
  return root.findAll(
    node => typeof node.props.onResponderGrant === 'function',
  )[0];
}

async function renderLaidOutBoard(
  props: Partial<React.ComponentProps<typeof PuzzleBoard>> = {},
) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <PuzzleBoard
        imageUri="file:///photo.jpg"
        rows={2}
        columns={2}
        {...props}
      />,
    );
  });
  const board = findBoard(root!.root);
  await act(() => {
    board.props.onLayout({
      nativeEvent: { layout: { width: 200, height: 200 } },
    });
  });
  return root!;
}

async function grabDragRelease(
  root: ReactTestRenderer.ReactTestRenderer,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const board = findBoard(root.root);
  await act(() => {
    board.props.onResponderGrant({
      nativeEvent: { locationX: from.x, locationY: from.y },
    });
  });
  await act(() => {
    board.props.onResponderMove({
      nativeEvent: { locationX: to.x, locationY: to.y },
    });
  });
  await act(() => {
    board.props.onResponderRelease();
  });
}

let randomSpy: jest.SpyInstance<number, []>;

beforeEach(() => {
  // Deterministic scrambling: every piece starts at (0, 0). Board is
  // 200x200 laid out as a 2x2 grid, so each piece is 100x100 and grant
  // events at (1, 1) always land on whichever unplaced piece is
  // currently topmost — the last one generated in row-major order,
  // "1-1" (target 100, 100), initially.
  randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  randomSpy.mockRestore();
});

test('dropping all four pieces on their correct targets calls onSolved once', async () => {
  const onSolved = jest.fn();
  const root = await renderLaidOutBoard({ onSolved });

  // Grabbing (1,1) always finds whichever unplaced piece is still
  // stacked at the origin, in reverse-generation order: 1-1, 1-0, 0-1,
  // 0-0 (each placed piece is skipped by hit-testing on the next grab).
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 101, y: 101 }); // 1-1 -> (100,100)
  expect(onSolved).not.toHaveBeenCalled();
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 1, y: 101 }); // 1-0 -> (0,100)
  expect(onSolved).not.toHaveBeenCalled();
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 101, y: 1 }); // 0-1 -> (100,0)
  expect(onSolved).not.toHaveBeenCalled();
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 1, y: 1 }); // 0-0 -> (0,0)

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test('dropping a piece far from its target does not place it, so the puzzle is not solved', async () => {
  const onSolved = jest.fn();
  const root = await renderLaidOutBoard({ onSolved });

  // Drop the first piece (1-1, target 100,100) way off in the corner
  // instead of near its target.
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 199, y: 1 });
  // It wasn't placed, so it's still grabbable at (199, 1) — grabbing
  // there and dropping it correctly this time should complete the set.
  await grabDragRelease(root, { x: 199, y: 1 }, { x: 101, y: 101 });
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 1, y: 101 }); // 1-0
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 101, y: 1 }); // 0-1
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 1, y: 1 }); // 0-0

  expect(onSolved).toHaveBeenCalledTimes(1);
});
