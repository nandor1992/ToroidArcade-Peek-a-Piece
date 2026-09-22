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
  // A trailing chunk of one picture would be a one-pair round — a tile
  // that's won the instant it's opened. Fold it into the round before it
  // instead, leaving that one slightly larger.
  if (chunks.length > 1 && chunks[chunks.length - 1].length < MIN_GROUP) {
    const orphan = chunks.pop() as Puzzle[];
    chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...orphan];
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
