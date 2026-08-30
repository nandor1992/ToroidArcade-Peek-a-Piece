/**
 * @format
 */

import * as RNFS from '@dr.pogodin/react-native-fs';
import { deletePersistedPhoto, persistPickedPhoto } from './photoFiles';

const fs = RNFS as unknown as {
  __reset: () => void;
  __seed: (path: string) => void;
  __files: Set<string>;
  copyFile: jest.Mock;
  unlink: jest.Mock;
};

const DIR = '/mock/Documents/puzzles';

beforeEach(() => {
  fs.__reset();
});

test('copies the picked file into the app puzzles dir, keyed by id, and returns a file:// URI', async () => {
  const uri = await persistPickedPhoto('file:///tmp/pick123.jpg', 'user-42');

  expect(uri).toBe(`file://${DIR}/user-42.jpg`);
  expect(fs.copyFile).toHaveBeenCalledWith(
    '/tmp/pick123.jpg', // scheme stripped
    `${DIR}/user-42.jpg`,
  );
  expect(fs.__files.has(`${DIR}/user-42.jpg`)).toBe(true);
});

test('replaces an existing copy for the same id', async () => {
  fs.__seed(`${DIR}/user-42.jpg`);
  await persistPickedPhoto('file:///tmp/new.jpg', 'user-42');

  expect(fs.unlink).toHaveBeenCalledWith(`${DIR}/user-42.jpg`);
  expect(fs.copyFile).toHaveBeenCalled();
});

test('falls back to the original URI when the copy fails', async () => {
  fs.copyFile.mockRejectedValueOnce(new Error('disk full'));

  const uri = await persistPickedPhoto('file:///tmp/pick.jpg', 'user-1');

  expect(uri).toBe('file:///tmp/pick.jpg');
});

test('deletePersistedPhoto unlinks a file inside our dir', async () => {
  fs.__seed(`${DIR}/user-7.jpg`);

  await deletePersistedPhoto(`file://${DIR}/user-7.jpg`);

  expect(fs.unlink).toHaveBeenCalledWith(`${DIR}/user-7.jpg`);
  expect(fs.__files.has(`${DIR}/user-7.jpg`)).toBe(false);
});

test('deletePersistedPhoto ignores a URI outside our dir', async () => {
  await deletePersistedPhoto('file:///tmp/somewhere-else.jpg');

  expect(fs.unlink).not.toHaveBeenCalled();
});

test('deletePersistedPhoto ignores an already-missing file', async () => {
  await expect(
    deletePersistedPhoto(`file://${DIR}/gone.jpg`),
  ).resolves.toBeUndefined();
});
