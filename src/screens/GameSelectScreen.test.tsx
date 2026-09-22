/**
 * @format
 */

import React from 'react';
import { useWindowDimensions } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { GameSelectScreen } from './GameSelectScreen';
import { GameMark } from '../components/GameMark';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Landscape by default; the orientation test overrides it.
beforeEach(() => {
  (useWindowDimensions as jest.Mock).mockReturnValue({
    width: 900,
    height: 480,
    scale: 2,
    fontScale: 2,
  });
});

function pressable(root: ReactTestRenderer.ReactTestInstance, label: string) {
  return root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
}

async function render(props: Parameters<typeof GameSelectScreen>[0] = {}) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<GameSelectScreen {...props} />);
  });
  return root!;
}

test('shows one tile per game', async () => {
  const root = await render();

  expect(pressable(root.root, 'Family Puzzle')).toBeDefined();
  expect(pressable(root.root, 'Family Memory')).toBeDefined();
});

test('each tile calls its own handler', async () => {
  const onSelectPuzzles = jest.fn();
  const onSelectMemory = jest.fn();
  const root = await render({ onSelectPuzzles, onSelectMemory });

  await act(() => {
    pressable(root.root, 'Family Puzzle').props.onPress();
  });
  expect(onSelectPuzzles).toHaveBeenCalledTimes(1);
  expect(onSelectMemory).not.toHaveBeenCalled();

  await act(() => {
    pressable(root.root, 'Family Memory').props.onPress();
  });
  expect(onSelectMemory).toHaveBeenCalledTimes(1);
  expect(onSelectPuzzles).toHaveBeenCalledTimes(1);
});

test('tapping a tile with no handler does nothing', async () => {
  const root = await render();

  await act(() => {
    pressable(root.root, 'Family Memory').props.onPress();
  });
  // Still mounted, still showing both tiles — a mis-tap is a no-op, not a
  // crash or an error state.
  expect(pressable(root.root, 'Family Puzzle')).toBeDefined();
});

test('offers a parent-area button, quietly', async () => {
  const onOpenParentArea = jest.fn();
  const root = await render({ onOpenParentArea });

  const button = pressable(root.root, 'Parent controls');
  await act(() => {
    button.props.onPress();
  });

  expect(onOpenParentArea).toHaveBeenCalledTimes(1);
});

test('hides the parent button when there is no parent area', async () => {
  const root = await render();

  expect(
    root.root.findAll(
      node => node.props.accessibilityLabel === 'Parent controls',
    ),
  ).toHaveLength(0);
});

test('has no back button — it is the top of the stack', async () => {
  const root = await render();

  expect(
    root.root.findAll(node => node.props.accessibilityLabel === 'Back'),
  ).toHaveLength(0);
});

// The marks are sized from the measured tile, so nothing draws until a
// layout pass has run — which react-test-renderer never does on its own.
async function layOutTiles(
  root: ReactTestRenderer.ReactTestInstance,
  size = 300,
) {
  // Pressable repeats its props down several wrapper layers, so the same
  // handler comes back more than once — dedupe on identity to get one per
  // actual tile.
  const handlers = new Set<(event: unknown) => void>(
    root
      .findAll(
        node =>
          typeof node.props.onLayout === 'function' &&
          typeof node.props.accessibilityLabel === 'string',
      )
      .map(node => node.props.onLayout),
  );
  await act(() => {
    for (const onLayout of handlers) {
      onLayout({
        nativeEvent: { layout: { width: size, height: size, x: 0, y: 0 } },
      });
    }
  });
  return handlers.size;
}

test('draws each game its own brand mark once the tiles are laid out', async () => {
  const root = await render();

  expect(root.root.findAllByType(GameMark)).toHaveLength(0);

  const laidOut = await layOutTiles(root.root);
  expect(laidOut).toBe(2);

  const marks = root.root.findAllByType(GameMark);
  expect(marks.map(m => m.props.name)).toEqual(['puzzle', 'memory']);
});

test('sizes the marks to fill the measured tile', async () => {
  const root = await render();
  await layOutTiles(root.root, 400);

  // 94% of the width, or the height minus the label's 44, whichever binds.
  // On a square tile that's the height: 400 - 44.
  for (const mark of root.root.findAllByType(GameMark)) {
    expect(mark.props.size).toBe(356);
  }
});

test('a tile too short for a mark asks for no mark at all', async () => {
  const root = await render();
  // Mid-rotation a tile can be briefly measured at almost no height; the
  // mark must clamp to 0 rather than ask Skia for a negative canvas.
  await layOutTiles(root.root, 20);

  for (const mark of root.root.findAllByType(GameMark)) {
    expect(mark.props.size).toBeGreaterThanOrEqual(0);
  }
});

test('tiles are cream, not the game colour, so the marks stay legible', async () => {
  const root = await render();

  const tile = root.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Family Puzzle' &&
      typeof node.props.onPress === 'function',
  )[0];
  const style = [tile.props.style({ pressed: false })].flat(2);
  expect(style).toContainEqual(
    expect.objectContaining({ backgroundColor: '#FFF6E6' }),
  );
  // The game's colour survives as the base stripe.
  expect(style).toContainEqual({ borderBottomColor: '#2EC4B6' });
});

test('insets the tiles by 10% of the shorter screen side', async () => {
  const mocked = useWindowDimensions as jest.Mock;
  const insetOf = (root: ReactTestRenderer.ReactTestInstance) => {
    const container = root.findAll(node =>
      [node.props.style].flat(2).some(s => s?.padding != null),
    )[0];
    return [container.props.style].flat(2).find(s => s?.padding != null);
  };

  mocked.mockReturnValue({ width: 393, height: 852, scale: 2, fontScale: 1 });
  expect(insetOf((await render()).root)).toEqual({ padding: 39, gap: 39 });

  // Tablet: the same share of the shorter side, not the same pixel count.
  mocked.mockReturnValue({ width: 1180, height: 820, scale: 2, fontScale: 1 });
  expect(insetOf((await render()).root)).toEqual({ padding: 82, gap: 82 });
});

test('stacks the tiles in portrait and rows them in landscape', async () => {
  const mocked = useWindowDimensions as jest.Mock;
  const flexDirections = (root: ReactTestRenderer.ReactTestInstance) =>
    root
      .findAll(node => node.props.style != null)
      .flatMap(node => [node.props.style].flat(2))
      .map(style => style?.flexDirection)
      .filter(Boolean);

  mocked.mockReturnValue({ width: 480, height: 900, scale: 2, fontScale: 1 });
  const portrait = await render();
  expect(flexDirections(portrait.root)).toContain('column');

  mocked.mockReturnValue({ width: 900, height: 480, scale: 2, fontScale: 1 });
  const landscape = await render();
  expect(flexDirections(landscape.root)).toContain('row');
});
