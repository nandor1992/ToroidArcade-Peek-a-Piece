import type { Puzzle } from '../../../types/puzzle';
import { puzzleImageSource } from '../../../utils/puzzleImage';

export interface MemoryGroup {
  id: string;
  /** Shown to a grown-up (as the tile's accessibility label), not to the child. */
  title: string;
  /** The pictures this round is played with. Each becomes two cards. */
  pictures: Puzzle[];
}

/** Below this a "game" is a single pair — won by tapping twice. */
const MIN_GROUP = 2;

/**
 * Splits the photo pool into the rounds of Family Memory that the landing
 * page lists — the memory equivalent of the puzzle grid's one-tile-per-photo.
 *
 * Deliberately **not** shuffled. These are stable sets a player picks
 * between and pages through with next/previous, so the same tile has to
 * mean the same round each time the screen is opened. The shuffling
 * happens a layer down, when a chosen group is dealt — see
 * {@link buildMemoryDeck}.
 *
 * Order follows the pool it's given (uploaded photos first, then starter
 * pictures), matching how the puzzle grid orders its tiles.
 */
export function buildMemoryGroups(
  pictures: Puzzle[],
  groupSize: number,
): MemoryGroup[] {
  if (groupSize < MIN_GROUP) {
    return [];
  }
  // Same rule as the deal: a picture with no artwork can't be matched by
  // sight, so it never makes it into a round.
  const usable = pictures.filter(
    picture => puzzleImageSource(picture) !== undefined,
  );
  if (usable.length < MIN_GROUP) {
    return [];
  }

  const chunks: Puzzle[][] = [];
  for (let i = 0; i < usable.length; i += groupSize) {
    chunks.push(usable.slice(i, i + groupSize));
  }

  // A pool that doesn't divide evenly leaves a short final round — at
  // worst a single picture, a tile won the instant it's opened. Top it up
  // by coming back round to the start of the pool, so every round is the
  // size the parent chose.
  //
  // Pictures already in that round are skipped: a picture appearing twice
  // in one round would deal four identical cards, and matching two of them
  // would leave the other two stranded with no partner. Repeating *across*
  // rounds is fine — each round is dealt on its own.
  //
  // Only possible when the pool is bigger than one round. If it isn't,
  // there's a single round holding everything and nothing to borrow from,
  // so it stays short.
  const last = chunks[chunks.length - 1];
  if (chunks.length > 1 && last.length < groupSize) {
    const taken = new Set(last.map(picture => picture.id));
    for (const picture of usable) {
      if (last.length >= groupSize) {
        break;
      }
      if (taken.has(picture.id)) {
        continue;
      }
      taken.add(picture.id);
      last.push(picture);
    }
  }

  return chunks.map((group, index) => ({
    // Keyed on position rather than contents: adding a photo reshuffles
    // which pictures land in which round anyway, so there's no stable
    // identity to preserve beyond "the nth round".
    id: `set-${index + 1}`,
    title: `Set ${index + 1}`,
    pictures: group,
  }));
}
