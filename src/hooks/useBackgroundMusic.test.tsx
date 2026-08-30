/**
 * @format
 */

import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import Sound from 'react-native-sound';
import { useBackgroundMusic } from './useBackgroundMusic';
import type { UseBackgroundMusicOptions } from './useBackgroundMusic';

function Harness(props: UseBackgroundMusicOptions) {
  useBackgroundMusic(props);
  return null;
}

test('enabled starts playback, disabled pauses it', async () => {
  const playSpy = jest.spyOn(Sound.prototype, 'play');
  const pauseSpy = jest.spyOn(Sound.prototype, 'pause');

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <Harness enabled={false} volume={0.5} muted={false} />,
    );
  });

  // Mounted with enabled: false and nothing loaded yet → neither play nor
  // pause has been called.
  expect(playSpy).not.toHaveBeenCalled();
  expect(pauseSpy).not.toHaveBeenCalled();

  await act(() => {
    root!.update(<Harness enabled={true} volume={0.5} muted={false} />);
  });
  expect(playSpy).toHaveBeenCalledTimes(1);

  await act(() => {
    root!.update(<Harness enabled={false} volume={0.5} muted={false} />);
  });
  expect(pauseSpy).toHaveBeenCalledTimes(1);

  playSpy.mockRestore();
  pauseSpy.mockRestore();
});

test('backgrounding the app pauses playback; returning to the foreground resumes it', async () => {
  const playSpy = jest.spyOn(Sound.prototype, 'play');
  const pauseSpy = jest.spyOn(Sound.prototype, 'pause');
  let changeHandler: ((state: string) => void) | undefined;
  const addSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation(((_event: string, handler: (s: string) => void) => {
      changeHandler = handler;
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <Harness enabled={true} volume={0.5} muted={false} />,
    );
  });
  expect(playSpy).toHaveBeenCalledTimes(1);

  // App sent to the background → paused, even though `enabled` is still true.
  await act(() => {
    changeHandler!('background');
  });
  expect(pauseSpy).toHaveBeenCalledTimes(1);

  // Back to the foreground → playback resumes.
  await act(() => {
    changeHandler!('active');
  });
  expect(playSpy).toHaveBeenCalledTimes(2);

  await act(() => {
    root!.unmount();
  });
  addSpy.mockRestore();
  playSpy.mockRestore();
  pauseSpy.mockRestore();
});

test('playback starts once the file finishes loading, even though enabled was set before then', async () => {
  const playSpy = jest.spyOn(Sound.prototype, 'play');

  let root: ReactTestRenderer.ReactTestRenderer;
  // Synchronous act body: the sound's async load callback hasn't run yet.
  act(() => {
    root = ReactTestRenderer.create(
      <Harness enabled={true} volume={0.5} muted={false} />,
    );
  });
  expect(playSpy).not.toHaveBeenCalled();

  // Flush the load callback.
  await act(async () => {});
  expect(playSpy).toHaveBeenCalledTimes(1);

  await act(() => {
    root!.unmount();
  });
  playSpy.mockRestore();
});

test('the track is set to loop indefinitely, after it has loaded', async () => {
  const loopSpy = jest.spyOn(Sound.prototype, 'setNumberOfLoops');

  act(() => {
    ReactTestRenderer.create(
      <Harness enabled={true} volume={0.5} muted={false} />,
    );
  });
  // Not before load — the library would silently ignore it.
  expect(loopSpy).not.toHaveBeenCalled();

  await act(async () => {});
  expect(loopSpy).toHaveBeenCalledWith(-1);

  loopSpy.mockRestore();
});

test('muted forces volume to 0 regardless of the volume prop', async () => {
  const setVolumeSpy = jest.spyOn(Sound.prototype, 'setVolume');

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <Harness enabled={true} volume={0.8} muted={false} />,
    );
  });
  expect(setVolumeSpy).toHaveBeenLastCalledWith(0.8);

  await act(() => {
    root!.update(<Harness enabled={true} volume={0.8} muted={true} />);
  });
  expect(setVolumeSpy).toHaveBeenLastCalledWith(0);

  setVolumeSpy.mockRestore();
});

test('unmounting stops and releases the sound', async () => {
  const stopSpy = jest.spyOn(Sound.prototype, 'stop');
  const releaseSpy = jest.spyOn(Sound.prototype, 'release');

  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(
      <Harness enabled={true} volume={0.5} muted={false} />,
    );
  });

  await act(() => {
    root!.unmount();
  });

  expect(stopSpy).toHaveBeenCalledTimes(1);
  expect(releaseSpy).toHaveBeenCalledTimes(1);

  stopSpy.mockRestore();
  releaseSpy.mockRestore();
});
