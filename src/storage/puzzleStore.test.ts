/**
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Puzzle } from '../types/puzzle';
import {
  loadCompletedIds,
  loadUserPuzzles,
  saveCompletedIds,
  saveUserPuzzles,
} from './puzzleStore';

const storage = AsyncStorage as unknown as {
  __reset: () => void;
  setItem: (k: string, v: string) => Promise<void>;
};

beforeEach(() => {
  storage.__reset();
});

const puzzle = (id: string): Puzzle => ({
  id,
  title: `Photo ${id}`,
  source: 'user',
  imageUri: `file:///mock/Documents/puzzles/${id}.jpg`,
});

test('user puzzles round-trip through storage', async () => {
  expect(await loadUserPuzzles()).toEqual([]);

  await saveUserPuzzles([puzzle('a'), puzzle('b')]);

  expect(await loadUserPuzzles()).toEqual([puzzle('a'), puzzle('b')]);
});

test('loadUserPuzzles drops malformed / non-user entries', async () => {
  await storage.setItem(
    '@peekapiece/userPuzzles',
    JSON.stringify([
      puzzle('good'),
      { id: 'no-image', title: 'x', source: 'user' },
      { id: 'stocky', title: 'x', source: 'stock', imageUri: 'file:///x' },
      null,
    ]),
  );

  expect(await loadUserPuzzles()).toEqual([puzzle('good')]);
});

test('loadUserPuzzles returns [] on corrupt JSON', async () => {
  await storage.setItem('@peekapiece/userPuzzles', '{not json');
  expect(await loadUserPuzzles()).toEqual([]);
});

test('completed ids round-trip through storage', async () => {
  expect(await loadCompletedIds()).toEqual([]);

  await saveCompletedIds(['stock-1', 'user-9']);

  expect(await loadCompletedIds()).toEqual(['stock-1', 'user-9']);
});
