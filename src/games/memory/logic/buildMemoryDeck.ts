import type { ImageSourcePropType } from 'react-native';
import type { Puzzle } from '../../../types/puzzle';
import { puzzleImageSource } from '../../../utils/puzzleImage';

export interface MemoryCard {
  /** Unique per card. The two cards of a pair differ only by the suffix. */
  id: string;
  /** Shared by the two cards showing the same picture — the match key. */
  pictureId: string;
  /** The picture's title, used as the card's accessibility label face-up. */
  title: string;
  source: ImageSourcePropType;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  // Fisher-Yates, back to front.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deals a shuffled memory deck: `pictureCount` pictures drawn from
 * `pictures`, each on two cards.
 *
 * Pictures without artwork are dropped first. A blank card can't be
 * matched by looking at it, so leaving one in would make the game
 * unwinnable by sight — and this game is nothing but looking.
 *
 * Repeats are dropped for a harder reason: one picture dealt twice makes
 * four identical cards, and matching two of them leaves the other two
 * stranded with no partner, so the round can never be finished. Rounds
 * deliberately reuse pictures from earlier rounds (see
 * {@link buildMemoryGroups}), which makes a duplicate slipping through a
 * plausible mistake rather than a theoretical one.
 *
 * The *selection* is shuffled as well as the deal, so a parent with more
 * photos than the chosen count gets a different set each round rather than
 * always the first six.
 *
 * @param random Injectable for tests; defaults to `Math.random`.
 */
export function buildMemoryDeck(
  pictures: Puzzle[],
  pictureCount: number,
  random: () => number = Math.random,
): MemoryCard[] {
  if (pictureCount <= 0) {
    return [];
  }
  const seen = new Set<string>();
  const usable = pictures.filter(picture => {
    if (puzzleImageSource(picture) === undefined || seen.has(picture.id)) {
      return false;
    }
    seen.add(picture.id);
    return true;
  });
  // Fewer photos than asked for → play with what there is, rather than
  // repeating a picture across two different pairs (which would make two
  // pairs indistinguishable and the game unwinnable).
  const chosen = shuffle(usable, random).slice(0, pictureCount);
  const cards = chosen.flatMap(picture => {
    const source = puzzleImageSource(picture) as ImageSourcePropType;
    return [
      { id: `${picture.id}-a`, pictureId: picture.id, title: picture.title, source },
      { id: `${picture.id}-b`, pictureId: picture.id, title: picture.title, source },
    ];
  });
  return shuffle(cards, random);
}
