/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SessionLockOverlay } from './SessionLockOverlay';

test('solving the math gate calls onUnlock', async () => {
  const onUnlock = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<SessionLockOverlay onUnlock={onUnlock} />);
  });

  const promptText = root!.root
    .findAll(node => Array.isArray(node.props.children))
    .map(node => node.props.children.join(''))
    .find((text: string) => text.startsWith('What is'));
  const match = /What is (\d+) \+ (\d+)\?/.exec(promptText!);
  const [, a, b] = match!;

  const answerField = root!.root.findAll(
    node => node.props.accessibilityLabel === 'Answer',
  )[0];
  await act(() => {
    answerField.props.onChangeText(String(Number(a) + Number(b)));
  });

  const continueButton = root!.root.findAll(
    node => node.props.accessibilityLabel === 'Continue',
  )[0];
  await act(() => {
    continueButton.props.onPress();
  });

  expect(onUnlock).toHaveBeenCalledTimes(1);
});
