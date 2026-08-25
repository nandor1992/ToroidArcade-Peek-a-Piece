/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from './App';

function findByLabel(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) {
  // Interactive components (Pressable, TextInput) wrap their host node in
  // layers that all end up carrying the same accessibilityLabel; matching
  // on the presence of an actual handler grabs the one that's usable,
  // rather than an outer wrapper without onPress/onChangeText.
  return root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      (typeof node.props.onPress === 'function' ||
        typeof node.props.onChangeText === 'function'),
  )[0];
}

async function solveMathGate(root: ReactTestRenderer.ReactTestInstance) {
  const promptText = root
    .findAll(node => Array.isArray(node.props.children))
    .map(node => node.props.children.join(''))
    .find((text: string) => text.startsWith('What is'));
  const match = /What is (\d+) \+ (\d+)\?/.exec(promptText!);
  const [, a, b] = match!;

  await act(() => {
    findByLabel(root, 'Answer').props.onChangeText(String(Number(a) + Number(b)));
  });
  await act(() => {
    findByLabel(root, 'Continue').props.onPress();
  });
}

test('renders correctly', async () => {
  await act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('setting a screen-time limit locks the app after it elapses, and solving the gate unlocks it', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  // Fake timers only from here on — SafeAreaProvider's own initial setup
  // relies on a real timer/microtask during mount above.
  jest.useFakeTimers();

  // Home -> parent gate -> parent screen -> settings.
  await act(() => {
    findByLabel(root!.root, 'Parent settings').props.onPress();
  });
  await solveMathGate(root!.root);
  await act(() => {
    findByLabel(root!.root, 'Settings').props.onPress();
  });

  // Set a 5-minute limit, then back out to the home screen.
  await act(() => {
    findByLabel(root!.root, '5 min').props.onPress();
  });
  await act(() => {
    findByLabel(root!.root, 'Back').props.onPress(); // settings -> parent
  });
  await act(() => {
    findByLabel(root!.root, 'Back').props.onPress(); // parent -> home
  });

  expect(
    root!.root.findAll(node => node.props.children === "Time's Up!").length,
  ).toBe(0);

  await act(() => {
    jest.advanceTimersByTime(5 * 60_000);
  });

  expect(
    root!.root.findAll(node => node.props.children === "Time's Up!").length,
  ).toBeGreaterThan(0);

  await solveMathGate(root!.root);

  expect(
    root!.root.findAll(node => node.props.children === "Time's Up!").length,
  ).toBe(0);

  jest.useRealTimers();
});
