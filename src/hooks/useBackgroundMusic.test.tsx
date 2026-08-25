/**
 * @format
 */

import React from 'react';
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

  // Mounting with enabled: false pauses once right away — clear that so
  // the assertions below are about the toggles, not the initial mount.
  expect(playSpy).not.toHaveBeenCalled();
  pauseSpy.mockClear();

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
