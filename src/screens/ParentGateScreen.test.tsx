/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ParentGateScreen } from './ParentGateScreen';

function findByLabel(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) {
  return root.findAll(node => node.props.accessibilityLabel === label)[0];
}

function currentProblem(root: ReactTestRenderer.ReactTestInstance): {
  a: number;
  b: number;
} {
  const promptText = root
    .findAll(node => Array.isArray(node.props.children))
    .map(node => node.props.children.join(''))
    .find((text: string) => text.startsWith('What is'));
  const match = /What is (\d+) \+ (\d+)\?/.exec(promptText);
  if (!match) {
    throw new Error(`Could not find problem prompt, got: ${promptText}`);
  }
  return { a: Number(match[1]), b: Number(match[2]) };
}

test('correct answer calls onSuccess', async () => {
  const onSuccess = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<ParentGateScreen onSuccess={onSuccess} />);
  });

  const { a, b } = currentProblem(root!.root);

  await act(() => {
    findByLabel(root!.root, 'Answer').props.onChangeText(String(a + b));
  });
  await act(() => {
    findByLabel(root!.root, 'Continue').props.onPress();
  });

  expect(onSuccess).toHaveBeenCalledTimes(1);
});

test('wrong answer does not call onSuccess and issues a new problem', async () => {
  const onSuccess = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<ParentGateScreen onSuccess={onSuccess} />);
  });

  const { a, b } = currentProblem(root!.root);

  await act(() => {
    findByLabel(root!.root, 'Answer').props.onChangeText(String(a + b + 1));
  });
  await act(() => {
    findByLabel(root!.root, 'Continue').props.onPress();
  });

  expect(onSuccess).not.toHaveBeenCalled();
  // Answering the freshly-issued problem correctly still succeeds.
  const retry = currentProblem(root!.root);
  await act(() => {
    findByLabel(root!.root, 'Answer').props.onChangeText(
      String(retry.a + retry.b),
    );
  });
  await act(() => {
    findByLabel(root!.root, 'Continue').props.onPress();
  });

  expect(onSuccess).toHaveBeenCalledTimes(1);
});

test('back button calls onBack', async () => {
  const onBack = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ParentGateScreen onSuccess={jest.fn()} onBack={onBack} />,
    );
  });

  await act(() => {
    findByLabel(root!.root, 'Back').props.onPress();
  });

  expect(onBack).toHaveBeenCalledTimes(1);
});
