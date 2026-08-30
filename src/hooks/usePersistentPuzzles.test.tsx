/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from '@dr.pogodin/react-native-fs';
import type { Puzzle } from '../types/puzzle';
import { usePersistentPuzzles } from './usePersistentPuzzles';
import type { PersistentPuzzles } from './usePersistentPuzzles';

const storage = AsyncStorage as unknown as {
  __reset: () => void;
  setItem: jest.Mock;
  getItem: (k: string) => Promise<string | null>;
};
const fs = RNFS as unknown as {
  __reset: () => void;
  __seed: (p: string) => void;
  __files: Set<string>;
  copyFile: jest.Mock;
};

let hook: PersistentPuzzles;
function Harness() {
  hook = usePersistentPuzzles();
  return null;
}

async function mountHarness() {
  let root: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    root = ReactTestRenderer.create(<Harness />);
  });
  await act(async () => {}); // flush the hydration promise
  return root!;
}

const pick = (id: string): Puzzle => ({
  id,
  title: `Photo ${id}`,
  source: 'user',
  imageUri: `file:///tmp/${id}.jpg`,
});

beforeEach(() => {
  storage.__reset();
  fs.__reset();
});

test('hydrates userPuzzles and completedIds from storage on mount', async () => {
  await storage.setItem(
    '@peekapiece/userPuzzles',
    JSON.stringify([
      {
        id: 'user-1',
        title: 'Gran',
        source: 'user',
        imageUri: 'file:///mock/Documents/puzzles/user-1.jpg',
      },
    ]),
  );
  await storage.setItem(
    '@peekapiece/completedPuzzleIds',
    JSON.stringify(['stock-3']),
  );

  await mountHarness();

  expect(hook.hydrated).toBe(true);
  expect(hook.userPuzzles.map(p => p.id)).toEqual(['user-1']);
  expect([...hook.completedIds]).toEqual(['stock-3']);
});

test('addPuzzles copies each photo into app storage, prepends, and persists', async () => {
  await mountHarness();

  await act(async () => {
    hook.addPuzzles([pick('user-a'), pick('user-b')]);
  });

  expect(fs.copyFile).toHaveBeenCalledTimes(2);
  expect(hook.userPuzzles.map(p => p.id)).toEqual(['user-a', 'user-b']);
  // imageUri rewritten to the app-private copy.
  expect(hook.userPuzzles[0].imageUri).toBe(
    'file:///mock/Documents/puzzles/user-a.jpg',
  );
  const persisted = JSON.parse(
    (await storage.getItem('@peekapiece/userPuzzles')) ?? '[]',
  );
  expect(persisted.map((p: Puzzle) => p.id)).toEqual(['user-a', 'user-b']);
});

test('deletePuzzle removes it from state, deletes the file, and persists', async () => {
  await mountHarness();
  await act(async () => {
    hook.addPuzzles([pick('user-a')]);
  });
  const storedUri = hook.userPuzzles[0].imageUri!;
  expect(fs.__files.has(storedUri.replace('file://', ''))).toBe(true);

  await act(async () => {
    hook.deletePuzzle('user-a');
  });

  expect(hook.userPuzzles).toEqual([]);
  expect(fs.__files.has(storedUri.replace('file://', ''))).toBe(false);
  expect(await storage.getItem('@peekapiece/userPuzzles')).toBe('[]');
});

test('markCompleted / clearCompleted update the set and persist', async () => {
  await mountHarness();

  await act(async () => {
    hook.markCompleted('stock-1');
  });
  expect([...hook.completedIds]).toEqual(['stock-1']);
  expect(
    JSON.parse((await storage.getItem('@peekapiece/completedPuzzleIds')) ?? '[]'),
  ).toEqual(['stock-1']);

  await act(async () => {
    hook.clearCompleted('stock-1');
  });
  expect([...hook.completedIds]).toEqual([]);
  expect(
    JSON.parse((await storage.getItem('@peekapiece/completedPuzzleIds')) ?? '[]'),
  ).toEqual([]);
});

test('markCompleted is idempotent (no duplicate, no needless write)', async () => {
  await mountHarness();
  await act(async () => {
    hook.markCompleted('stock-1');
  });
  const idsBefore = hook.completedIds;
  const writesBefore = storage.setItem.mock.calls.length;

  await act(async () => {
    hook.markCompleted('stock-1');
  });

  expect([...hook.completedIds]).toEqual(['stock-1']);
  expect(hook.completedIds).toBe(idsBefore); // same Set, no state churn
  expect(storage.setItem.mock.calls.length).toBe(writesBefore);
});
