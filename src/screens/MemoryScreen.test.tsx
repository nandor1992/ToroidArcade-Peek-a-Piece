/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { MemoryScreen } from './MemoryScreen';

async function render(props: Parameters<typeof MemoryScreen>[0] = {}) {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<MemoryScreen {...props} />);
  });
  return root!;
}

function texts(root: ReactTestRenderer.ReactTestInstance): string[] {
  return root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children as string);
}

test('names the game', async () => {
  const root = await render();

  expect(texts(root.root)).toContain('Family Memory');
});

test('the back button calls onBack', async () => {
  const onBack = jest.fn();
  const root = await render({ onBack });

  const back = root.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Back' &&
      typeof node.props.onPress === 'function',
  )[0];
  await act(() => {
    back.props.onPress();
  });

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('hides the back button when there is nowhere to go', async () => {
  const root = await render();

  expect(
    root.root.findAll(node => node.props.accessibilityLabel === 'Back'),
  ).toHaveLength(0);
});
