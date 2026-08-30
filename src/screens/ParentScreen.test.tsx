/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { ParentScreen } from './ParentScreen';
import type { Puzzle } from '../types/puzzle';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

const mockedLaunchImageLibrary = launchImageLibrary as jest.Mock;

function findByLabel(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) {
  return root.findAll(node => node.props.accessibilityLabel === label)[0];
}

beforeEach(() => {
  mockedLaunchImageLibrary.mockReset();
});

test('settings button calls onOpenSettings', async () => {
  const onOpenSettings = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzles={jest.fn()}
        onDeletePuzzle={jest.fn()}
        defaultImagesEnabled={true}
        onToggleDefaultImages={jest.fn()}
        onOpenSettings={onOpenSettings}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Settings').props.onPress();
  });

  expect(onOpenSettings).toHaveBeenCalledTimes(1);
});

test('toggling the switch reports the new value', async () => {
  const onToggleDefaultImages = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzles={jest.fn()}
        onDeletePuzzle={jest.fn()}
        defaultImagesEnabled={true}
        onToggleDefaultImages={onToggleDefaultImages}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Show starter puzzles').props.onValueChange(false);
  });

  expect(onToggleDefaultImages).toHaveBeenCalledWith(false);
});

test('picking photos adds a puzzle for each one', async () => {
  mockedLaunchImageLibrary.mockImplementation((_options, callback) => {
    callback({
      assets: [
        { uri: 'file:///a.jpg', fileName: 'a.jpg' },
        { uri: 'file:///b.jpg', fileName: 'b.jpg' },
      ],
    });
  });
  const onAddPuzzles = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzles={onAddPuzzles}
        onDeletePuzzle={jest.fn()}
        defaultImagesEnabled={true}
        onToggleDefaultImages={jest.fn()}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Add photos').props.onPress();
  });

  // The OS picker is asked with no selection limit.
  expect(mockedLaunchImageLibrary.mock.calls[0][0]).toEqual(
    expect.objectContaining({ selectionLimit: 0 }),
  );
  expect(onAddPuzzles).toHaveBeenCalledTimes(1);
  const added = onAddPuzzles.mock.calls[0][0];
  expect(added).toHaveLength(2);
  expect(added[0]).toEqual(
    expect.objectContaining({
      title: 'a.jpg',
      source: 'user',
      imageUri: 'file:///a.jpg',
    }),
  );
  expect(added[1].imageUri).toBe('file:///b.jpg');
  expect(added[0].id).not.toBe(added[1].id);
});

test('cancelling the picker does not add puzzles', async () => {
  mockedLaunchImageLibrary.mockImplementation((_options, callback) => {
    callback({ didCancel: true });
  });
  const onAddPuzzles = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzles={onAddPuzzles}
        onDeletePuzzle={jest.fn()}
        defaultImagesEnabled={true}
        onToggleDefaultImages={jest.fn()}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Add photos').props.onPress();
  });

  expect(onAddPuzzles).not.toHaveBeenCalled();
});

test('deleting a photo confirms, then calls onDeletePuzzle when confirmed', async () => {
  const puzzle: Puzzle = {
    id: 'user-1',
    title: 'Grandma',
    source: 'user',
    imageUri: 'file:///grandma.jpg',
  };
  const onDeletePuzzle = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[puzzle]}
        onAddPuzzles={jest.fn()}
        onDeletePuzzle={onDeletePuzzle}
        defaultImagesEnabled={true}
        onToggleDefaultImages={jest.fn()}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Delete Grandma').props.onPress();
  });

  expect(alertSpy).toHaveBeenCalled();
  const buttons = alertSpy.mock.calls[0][2] as Array<{
    text?: string;
    onPress?: () => void;
  }>;
  const deleteButton = buttons.find(button => button.text === 'Delete');

  deleteButton?.onPress?.();

  expect(onDeletePuzzle).toHaveBeenCalledWith('user-1');

  alertSpy.mockRestore();
});
