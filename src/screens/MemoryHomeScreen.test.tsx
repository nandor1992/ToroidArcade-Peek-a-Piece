/**
 * @format
 */

import React from 'react';
import { useWindowDimensions } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { MemoryHomeScreen } from './MemoryHomeScreen';
import { buildMemoryGroups } from '../games/memory/logic/buildMemoryGroups';
import type { Puzzle } from '../types/puzzle';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Landscape phone by default; the layout tests override it.
function mockViewport(width: number, height = 480) {
  (useWindowDimensions as jest.Mock).mockReturnValue({
    width,
    height,
    scale: 2,
    fontScale: 2,
  });
}

beforeEach(() => {
  mockViewport(400);
});

function stock(n: number): Puzzle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    title: `Picture ${i}`,
    source: 'stock' as const,
    imageAsset: 100 + i,
  }));
}

async function render(
  props: Partial<React.ComponentProps<typeof MemoryHomeScreen>> = {},
) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<MemoryHomeScreen {...props} />);
  });
  return root!;
}

function tiles(root: ReactTestRenderer.ReactTestInstance): string[] {
  return root
    .findAll(node => typeof node.props.onPress === 'function')
    .map(node => node.props.accessibilityLabel)
    .filter(
      (label): label is string =>
        typeof label === 'string' &&
        label !== 'Parent controls' &&
        label !== 'Back',
    )
    .filter((label, i, all) => all.indexOf(label) === i);
}

function pressable(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) {
  return root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
}

/** The `data` a FlatList was given — the row model. */
function rowSizes(root: ReactTestRenderer.ReactTestInstance): number[] {
  const list = root.findAll(node => Array.isArray(node.props.data))[0];
  return (list.props.data as unknown[][]).map(row => row.length);
}

test('shows one tile per round', async () => {
  const root = await render({ groups: buildMemoryGroups(stock(12), 3) });

  expect(tiles(root.root)).toEqual(['Set 1', 'Set 2', 'Set 3', 'Set 4']);
});

test('tapping a tile reports that round', async () => {
  const onSelectGroup = jest.fn();
  const groups = buildMemoryGroups(stock(12), 6);
  const root = await render({ groups, onSelectGroup });

  await act(() => {
    pressable(root.root, 'Set 2').props.onPress();
  });

  expect(onSelectGroup).toHaveBeenCalledWith(groups[1]);
});

test('a tile shows a collage of its pictures, not just one', async () => {
  const groups = buildMemoryGroups(stock(8), 4);
  const root = await render({ groups });

  // Four thumbnails on the first tile, one per picture in the round.
  const images = root.root.findAll(
    node =>
      node.props.source != null &&
      node.props.resizeMode === 'cover' &&
      typeof node.props.source === 'number',
  );
  // 4 per tile across 2 tiles; the background art is a require()d module
  // too but uses its own resizeMode path, so it isn't counted here.
  expect(images.length).toBeGreaterThanOrEqual(8);
});

test('a tile is badged with how many pairs the round holds', async () => {
  const root = await render({ groups: buildMemoryGroups(stock(10), 4) });

  // The badge renders the count as a number child, not a string. Filtered
  // to host nodes because each Text shows up as both a composite and a
  // host instance, which would double every value.
  const badges = root.root
    .findAll(
      node =>
        typeof node.type === 'string' &&
        typeof node.props.children === 'number',
    )
    .map(node => node.props.children as number);
  // Three rounds of 4 — the last one topped up from the start of the pool
  // rather than left as a short round of 2.
  expect(badges).toEqual([4, 4, 4]);
});

test('tapping a tile with no handler does nothing', async () => {
  const root = await render({ groups: buildMemoryGroups(stock(6), 3) });

  await act(() => {
    pressable(root.root, 'Set 1').props.onPress();
  });

  expect(tiles(root.root)).toHaveLength(2);
});

test('the back button reports, and is absent without a destination', async () => {
  const onBack = jest.fn();
  const withBack = await render({
    groups: buildMemoryGroups(stock(6), 3),
    onBack,
  });
  await act(() => {
    pressable(withBack.root, 'Back').props.onPress();
  });
  expect(onBack).toHaveBeenCalledTimes(1);

  const withoutBack = await render({ groups: buildMemoryGroups(stock(6), 3) });
  expect(
    withoutBack.root.findAll(node => node.props.accessibilityLabel === 'Back'),
  ).toHaveLength(0);
});

test('offers the parent area, and hides the button without one', async () => {
  const onOpenParentArea = jest.fn();
  const withParent = await render({
    groups: buildMemoryGroups(stock(6), 3),
    onOpenParentArea,
  });
  await act(() => {
    pressable(withParent.root, 'Parent controls').props.onPress();
  });
  expect(onOpenParentArea).toHaveBeenCalledTimes(1);

  const without = await render({ groups: buildMemoryGroups(stock(6), 3) });
  expect(
    without.root.findAll(
      node => node.props.accessibilityLabel === 'Parent controls',
    ),
  ).toHaveLength(0);
});

test('says so rather than showing an empty grid when there are no rounds', async () => {
  const root = await render({ groups: [] });

  expect(tiles(root.root)).toHaveLength(0);
  const copy = root.root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children as string);
  expect(copy).toContain('No pictures yet');
});

test('chunks tiles into rows the same way the puzzle grid does', async () => {
  const groups = buildMemoryGroups(stock(24), 3); // 8 rounds

  mockViewport(400); // phone landscape -> 2 across
  expect(rowSizes((await render({ groups })).root)).toEqual([2, 2, 2, 2]);

  mockViewport(900); // tablet landscape -> 4 across
  expect(rowSizes((await render({ groups })).root)).toEqual([4, 4]);

  mockViewport(1100, 1400); // tablet portrait -> halved to 2
  expect(rowSizes((await render({ groups })).root)).toEqual([2, 2, 2, 2]);
});
