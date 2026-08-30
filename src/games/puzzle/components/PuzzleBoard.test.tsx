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
        imageSource="file:///photo.jpg"
        rows={2}
        columns={2}
        {...props}
      />,
    );
  });
  const board = findBoard(root!.root);
  await act(() => {
    board.props.onLayout({
      nativeEvent: { layout: { width: 800, height: 800 } },
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
  // Deterministic scrambling: `Math.random` mocked to 0 → every piece is
  // scattered to (0, 0). The image mock is 200x200 (square), so on an
  // 800x800 play area the assembled picture box is 720x720
  // (MAX_PUZZLE_FRACTION 0.9) centred at origin (40, 40); each 2x2 piece
  // is 360x360. Absolute targets:
  //   (0,0)->(40,40)  (0,1)->(400,40)  (1,0)->(40,400)  (1,1)->(400,400)
  // A drag reported as grant(from) then move(to) shifts the grabbed piece
  // by `to - from` from where it was — so from (0,0), `to = from + target`
  // lands it exactly. Grabs at (1,1) hit whichever piece is still stacked
  // at the origin and topmost (last generated first: 1-1, 1-0, 0-1, 0-0).
  // The 800px area keeps the (0,0) pile comfortably outside the snap
  // radius of piece 0-0's home, so nothing auto-merges early.
  randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  randomSpy.mockRestore();
});

test('assembling every piece calls onSolved once', async () => {
  const onSolved = jest.fn();
  const root = await renderLaidOutBoard({ onSolved });

  await grabDragRelease(root, { x: 1, y: 1 }, { x: 401, y: 401 }); // 1-1
  expect(onSolved).not.toHaveBeenCalled();
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 41, y: 401 }); // 1-0
  expect(onSolved).not.toHaveBeenCalled();
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 401, y: 41 }); // 0-1
  expect(onSolved).not.toHaveBeenCalled();
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 41, y: 41 }); // 0-0

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test('a piece placed in its final spot is locked and ignores further drags', async () => {
  const onSolved = jest.fn();
  const root = await renderLaidOutBoard({ onSolved });

  // Place 1-1 exactly on its target.
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 401, y: 401 });
  // Try to drag it back off from a point that's on 1-1's spot but clear of
  // the (0,0) pile — a locked piece shouldn't move, and nothing else is
  // there to grab.
  await grabDragRelease(root, { x: 500, y: 500 }, { x: 5, y: 5 });

  // Finish the other three. If 1-1 had been dragged away, the group would
  // never close and onSolved would not fire.
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 41, y: 401 }); // 1-0
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 401, y: 41 }); // 0-1
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 41, y: 41 }); // 0-0

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test('a piece dropped far from where it belongs does not connect', async () => {
  const onSolved = jest.fn();
  const root = await renderLaidOutBoard({ onSolved });

  // Drop 1-1 (belongs at 400,400) off in the far corner instead.
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 439, y: 1 });
  // It didn't connect, so it's still grabbable where it landed — pick it
  // up there and place it correctly this time.
  await grabDragRelease(root, { x: 439, y: 1 }, { x: 401, y: 401 });
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 41, y: 401 }); // 1-0
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 401, y: 41 }); // 0-1
  await grabDragRelease(root, { x: 1, y: 1 }, { x: 41, y: 41 }); // 0-0

  expect(onSolved).toHaveBeenCalledTimes(1);
});
