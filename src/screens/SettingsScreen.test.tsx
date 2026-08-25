/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SettingsScreen } from './SettingsScreen';

function findByLabel(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) {
  return root.findAll(node => node.props.accessibilityLabel === label)[0];
}

function baseProps() {
  return {
    soundVolume: 0.5,
    onChangeSoundVolume: jest.fn(),
    soundMuted: false,
    onToggleMute: jest.fn(),
    timerMinutes: null as number | null,
    onChangeTimerMinutes: jest.fn(),
    onBack: jest.fn(),
  };
}

test('dragging the slider reports the new volume', async () => {
  const props = baseProps();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  // `findByLabel` alone would grab the <Slider> element itself (which also
  // carries accessibilityLabel) rather than its underlying host View, which
  // is what actually has onLayout/onResponderGrant.
  const slider = root!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Music volume' &&
      typeof node.props.onLayout === 'function',
  )[0];

  await act(() => {
    slider.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  });
  await act(() => {
    slider.props.onResponderGrant({ nativeEvent: { locationX: 50 } });
  });

  expect(props.onChangeSoundVolume).toHaveBeenCalledWith(0.25);
});

test('mute button toggles muted state', async () => {
  const props = baseProps();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  await act(() => {
    findByLabel(root!.root, 'Mute').props.onPress();
  });

  expect(props.onToggleMute).toHaveBeenCalledWith(true);
});

test('shows Unmute when already muted', async () => {
  const props = { ...baseProps(), soundMuted: true };
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  await act(() => {
    findByLabel(root!.root, 'Unmute').props.onPress();
  });

  expect(props.onToggleMute).toHaveBeenCalledWith(false);
});

test('picking a timer preset reports its minutes', async () => {
  const props = baseProps();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  await act(() => {
    findByLabel(root!.root, '10 min').props.onPress();
  });

  expect(props.onChangeTimerMinutes).toHaveBeenCalledWith(10);
});

test('picking Off reports null minutes', async () => {
  const props = { ...baseProps(), timerMinutes: 10 };
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  await act(() => {
    findByLabel(root!.root, 'Off').props.onPress();
  });

  expect(props.onChangeTimerMinutes).toHaveBeenCalledWith(null);
});

test('About button opens a popup with app info, and Close dismisses it', async () => {
  const props = baseProps();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  const findModal = () =>
    root!.root.findAll(node => 'visible' in node.props)[0];

  expect(findModal().props.visible).toBe(false);

  await act(() => {
    findByLabel(root!.root, 'About').props.onPress();
  });

  expect(findModal().props.visible).toBe(true);
  expect(
    root!.root.findAll(node => node.props.children === 'Peek-a-Piece')
      .length,
  ).toBeGreaterThan(0);

  await act(() => {
    findByLabel(root!.root, 'Close').props.onPress();
  });

  expect(findModal().props.visible).toBe(false);
});

test('back button calls onBack', async () => {
  const props = baseProps();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SettingsScreen {...props} />);
  });

  await act(() => {
    findByLabel(root!.root, 'Back').props.onPress();
  });

  expect(props.onBack).toHaveBeenCalledTimes(1);
});
