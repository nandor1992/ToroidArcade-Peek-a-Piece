/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from '@dr.pogodin/react-native-fs';
import App from './App';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

const mockedLaunchImageLibrary = launchImageLibrary as jest.Mock;

beforeEach(() => {
  (AsyncStorage as unknown as { __reset?: () => void }).__reset?.();
  (RNFS as unknown as { __reset?: () => void }).__reset?.();
});

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

function currentPuzzleLabel(root: ReactTestRenderer.ReactTestInstance) {
  // The puzzle-screen image area is the only accessibilityLabel-bearing
  // node that isn't one of the nav buttons (those carry
  // accessibilityRole "button"; this doesn't).
  return root.findAll(
    node =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityRole !== 'button',
  )[0]?.props.accessibilityLabel;
}

function addPhoto(fileName: string, uri: string) {
  mockedLaunchImageLibrary.mockImplementationOnce((_options, callback) => {
    callback({ assets: [{ uri, fileName }] });
  });
}

test('renders correctly', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<App />);
  });
  // Let the AsyncStorage hydration in usePersistentPuzzles settle so its
  // state update lands inside act().
  await act(async () => {});
  await act(() => {
    root!.unmount();
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

test('Next on the puzzle screen only cycles through puzzles currently visible on Home, respecting the starter-puzzles toggle', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  // Home -> parent gate -> parent screen.
  await act(() => {
    findByLabel(root!.root, 'Parent settings').props.onPress();
  });
  await solveMathGate(root!.root);

  // Add two photos (prepended, so the grid ends up ["b.jpg", "a.jpg"]).
  // Each add now runs through the async persist-to-storage path, so flush
  // microtasks after each.
  addPhoto('a.jpg', 'file:///a.jpg');
  await act(async () => {
    findByLabel(root!.root, 'Add photos').props.onPress();
  });
  addPhoto('b.jpg', 'file:///b.jpg');
  await act(async () => {
    findByLabel(root!.root, 'Add photos').props.onPress();
  });

  // Turn starter puzzles off — the "Show starter puzzles" Switch lives on
  // ParentScreen itself, not under Settings (which has its own unrelated
  // "Off" preset for the screen-time timer).
  const starterPuzzlesSwitch = root!.root.findAll(
    node => node.props.accessibilityLabel === 'Show starter puzzles',
  )[0];
  await act(() => {
    starterPuzzlesSwitch.props.onValueChange(false);
  });
  await act(() => {
    findByLabel(root!.root, 'Back').props.onPress(); // parent -> home
  });

  // Open the first tile on Home — with starter puzzles off, only the two
  // uploaded photos are on the grid.
  await act(() => {
    findByLabel(root!.root, 'b.jpg').props.onPress();
  });
  expect(currentPuzzleLabel(root!.root)).toBe('b.jpg');

  await act(() => {
    findByLabel(root!.root, 'Next puzzle').props.onPress();
  });
  expect(currentPuzzleLabel(root!.root)).toBe('a.jpg');

  // Wraps back to the first uploaded photo — never a starter puzzle,
  // since those are toggled off.
  await act(() => {
    findByLabel(root!.root, 'Next puzzle').props.onPress();
  });
  expect(currentPuzzleLabel(root!.root)).toBe('b.jpg');
});
