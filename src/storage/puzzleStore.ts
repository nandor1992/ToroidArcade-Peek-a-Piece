import type { Puzzle } from '../types/puzzle';
import { readJSON, writeJSON } from './asyncStore';

const USER_PUZZLES_KEY = '@peekapiece/userPuzzles';
const COMPLETED_IDS_KEY = '@peekapiece/completedPuzzleIds';

/**
 * The parent-uploaded puzzle list, persisted across launches. Only
 * `source: 'user'` puzzles live here — the starter set is bundled, not
 * stored. See docs/specs/storage/puzzleStore.md.
 */
export async function loadUserPuzzles(): Promise<Puzzle[]> {
  const stored = await readJSON<Puzzle[]>(USER_PUZZLES_KEY, []);
  // Guard against a shape change / corruption: keep only well-formed
  // user entries with an image.
  return stored.filter(
    (p): p is Puzzle =>
      !!p &&
      typeof p.id === 'string' &&
      typeof p.title === 'string' &&
      p.source === 'user' &&
      typeof p.imageUri === 'string',
  );
}

export async function saveUserPuzzles(puzzles: Puzzle[]): Promise<void> {
  await writeJSON(USER_PUZZLES_KEY, puzzles);
}

/** Ids of every puzzle (starter or uploaded) the child has solved. */
export async function loadCompletedIds(): Promise<string[]> {
  const stored = await readJSON<string[]>(COMPLETED_IDS_KEY, []);
  return stored.filter((id): id is string => typeof id === 'string');
}

export async function saveCompletedIds(ids: string[]): Promise<void> {
  await writeJSON(COMPLETED_IDS_KEY, ids);
}
