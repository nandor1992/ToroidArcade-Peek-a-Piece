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

test('toggling the switch reports the new value', async () => {
  const onToggleDefaultImages = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzle={jest.fn()}
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

test('picking a photo adds a puzzle for it', async () => {
  mockedLaunchImageLibrary.mockImplementation((_options, callback) => {
    callback({
      assets: [{ uri: 'file:///photo.jpg', fileName: 'photo.jpg' }],
    });
  });
  const onAddPuzzle = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzle={onAddPuzzle}
        onDeletePuzzle={jest.fn()}
        defaultImagesEnabled={true}
        onToggleDefaultImages={jest.fn()}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Add photo').props.onPress();
  });

  expect(onAddPuzzle).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'photo.jpg',
      source: 'user',
      imageUri: 'file:///photo.jpg',
    }),
  );
});

test('cancelling the picker does not add a puzzle', async () => {
  mockedLaunchImageLibrary.mockImplementation((_options, callback) => {
    callback({ didCancel: true });
  });
  const onAddPuzzle = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentScreen
        userPuzzles={[]}
        onAddPuzzle={onAddPuzzle}
        onDeletePuzzle={jest.fn()}
        defaultImagesEnabled={true}
        onToggleDefaultImages={jest.fn()}
      />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Add photo').props.onPress();
  });

  expect(onAddPuzzle).not.toHaveBeenCalled();
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
        onAddPuzzle={jest.fn()}
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
