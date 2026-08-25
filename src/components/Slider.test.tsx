/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Slider } from './Slider';

function findTrack(root: ReactTestRenderer.ReactTestInstance) {
  return root.findAll(
    node => node.props.accessibilityRole === 'adjustable',
  )[0];
}

test('dragging within the track reports a proportional value', async () => {
  const onValueChange = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <Slider value={0} onValueChange={onValueChange} />,
    );
  });

  const track = findTrack(root!.root);

  await act(() => {
    track.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  });
  await act(() => {
    track.props.onResponderGrant({ nativeEvent: { locationX: 100 } });
  });

  expect(onValueChange).toHaveBeenCalledWith(0.5);
});

test('touches past either edge clamp to 0 or 1', async () => {
  const onValueChange = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <Slider value={0.5} onValueChange={onValueChange} />,
    );
  });

  const track = findTrack(root!.root);

  await act(() => {
    track.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  });
  await act(() => {
    track.props.onResponderMove({ nativeEvent: { locationX: -50 } });
  });
  await act(() => {
    track.props.onResponderMove({ nativeEvent: { locationX: 999 } });
  });

  expect(onValueChange).toHaveBeenNthCalledWith(1, 0);
  expect(onValueChange).toHaveBeenNthCalledWith(2, 1);
});
