/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ErrorBoundary } from './ErrorBoundary';

function Boom({ crash }: { crash: boolean }): React.ReactElement {
  if (crash) {
    throw new Error('kaboom');
  }
  return <Text>all good</Text>;
}

function hasText(root: ReactTestRenderer.ReactTestInstance, text: string) {
  return root.findAll(n => n.props.children === text).length > 0;
}

// React logs caught render errors to console.error; silence just that noise.
let errSpy: jest.SpyInstance;
beforeEach(() => {
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errSpy.mockRestore());

test('renders children when nothing throws', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ErrorBoundary>
        <Boom crash={false} />
      </ErrorBoundary>,
    );
  });
  expect(hasText(root!.root, 'all good')).toBe(true);
});

test('shows the recovery screen and reports the error when a child throws', async () => {
  const onError = jest.fn();
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <ErrorBoundary onError={onError}>
        <Boom crash={true} />
      </ErrorBoundary>,
    );
  });

  expect(hasText(root!.root, 'Something went wrong')).toBe(true);
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'kaboom' }));
});

test('"Try again" clears the error and re-renders the subtree', async () => {
  // A parent that can stop crashing, so the retry has something healthy
  // to remount into.
  function Host() {
    const [crash, setCrash] = React.useState(true);
    (Host as unknown as { stop: () => void }).stop = () => setCrash(false);
    return (
      <ErrorBoundary>
        <Boom crash={crash} />
      </ErrorBoundary>
    );
  }

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<Host />);
  });
  expect(hasText(root!.root, 'Something went wrong')).toBe(true);

  await act(() => {
    (Host as unknown as { stop: () => void }).stop();
  });
  await act(() => {
    root!.root
      .findAll(n => n.props.accessibilityLabel === 'Try again')[0]
      .props.onPress();
  });

  expect(hasText(root!.root, 'all good')).toBe(true);
});
