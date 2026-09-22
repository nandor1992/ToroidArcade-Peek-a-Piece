import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { colors } from '../../../theme/colors';
import type { Puzzle } from '../../../types/puzzle';
import { buildMemoryDeck, type MemoryCard as CardData } from '../logic/buildMemoryDeck';
import { MemoryCard } from './MemoryCard';

/**
 * How long a matched pair stays face-up before it settles. Long enough to
 * register that the two pictures were the same.
 */
export const MATCH_PAUSE_MS = 600;
/**
 * How long a mismatched pair stays face-up before turning back. Deliberately
 * longer than {@link MATCH_PAUSE_MS} — this is the only chance the child has
 * to memorise where the two pictures were, and it's the whole game.
 */
export const MISMATCH_PAUSE_MS = 1300;

const GAP = 12;

export interface MemoryBoardProps {
  /** The pool to deal from — uploaded photos and starter pictures alike. */
  pictures: Puzzle[];
  /** How many distinct pictures to deal. Each appears on two cards. */
  pictureCount: number;
  /** Fired once when the last pair is found. */
  onSolved?: () => void;
  /** Bump this (any new number) to re-deal — the Reset button. */
  resetSignal?: number;
}

/**
 * Chooses a column count that keeps the cards as large as possible: tries
 * every option and keeps whichever gives the biggest card, so the grid
 * follows the shape of the space rather than a fixed rule.
 */
export function gridColumns(
  cardCount: number,
  width: number,
  height: number,
): number {
  if (cardCount <= 0 || width <= 0 || height <= 0) {
    return 1;
  }
  let best = 1;
  let bestSize = 0;
  for (let columns = 1; columns <= cardCount; columns++) {
    const rows = Math.ceil(cardCount / columns);
    const size = Math.min(
      (width - GAP * (columns - 1)) / columns,
      (height - GAP * (rows - 1)) / rows,
    );
    if (size > bestSize) {
      bestSize = size;
      best = columns;
    }
  }
  return best;
}

/**
 * The memory game: a grid of face-down cards, two of each picture. Tap one
 * to turn it over, tap a second — if they match they stay up, if not they
 * turn back and you try again. Solved when every pair is face-up.
 *
 * All state is local; nothing persists once the screen unmounts, matching
 * how the jigsaw behaves. See docs/specs/games/memory/components/MemoryBoard.md.
 */
export function MemoryBoard({
  pictures,
  pictureCount,
  onSolved,
  resetSignal = 0,
}: MemoryBoardProps) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [deck, setDeck] = useState<CardData[]>([]);
  /** Card ids turned over and not yet resolved — at most two. */
  const [turned, setTurned] = useState<string[]>([]);
  /** Picture ids whose pair has been found. */
  const [matched, setMatched] = useState<string[]>([]);
  const solvedRef = useRef(false);

  // Keyed on the pool's *contents*, not the array's identity: a parent
  // that rebuilds its puzzle list on every render would otherwise re-deal
  // the board continuously.
  const poolKey = pictures.map(picture => picture.id).join('|');

  // Re-deals on mount, on an explicit reset, and whenever the pool or the
  // requested count changes (a parent changing the Settings chip mid-game
  // should get a fresh board, not a half-played one).
  useEffect(() => {
    setDeck(buildMemoryDeck(pictures, pictureCount));
    setTurned([]);
    setMatched([]);
    solvedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey, pictureCount, resetSignal]);

  // Resolves a pair once two cards are up: matched ones join `matched`,
  // mismatched ones simply turn back. Either way `turned` clears, which is
  // also what re-opens the board to taps.
  useEffect(() => {
    if (turned.length < 2) {
      return;
    }
    const [first, second] = turned.map(id => deck.find(c => c.id === id));
    const isMatch =
      first != null && second != null && first.pictureId === second.pictureId;
    const timeout = setTimeout(
      () => {
        if (isMatch && first) {
          setMatched(current => [...current, first.pictureId]);
        }
        setTurned([]);
      },
      isMatch ? MATCH_PAUSE_MS : MISMATCH_PAUSE_MS,
    );
    return () => clearTimeout(timeout);
  }, [turned, deck]);

  useEffect(() => {
    const pairs = new Set(deck.map(c => c.pictureId)).size;
    if (pairs === 0 || matched.length < pairs || solvedRef.current) {
      return;
    }
    solvedRef.current = true;
    onSolved?.();
  }, [matched, deck, onSolved]);

  const handlePress = (card: CardData) => {
    // Every one of these is a legitimate toddler tap, and every one of them
    // does nothing rather than being an error: a third card while two are
    // showing, the same card twice, or a pair already found.
    if (turned.length >= 2) {
      return;
    }
    if (turned.includes(card.id) || matched.includes(card.pictureId)) {
      return;
    }
    setTurned(current => [...current, card.id]);
  };

  const columns = gridColumns(deck.length, area.width, area.height);
  const rows = Math.ceil(deck.length / columns);
  const cardSize = useMemo(() => {
    if (deck.length === 0 || area.width === 0) {
      return 0;
    }
    return Math.floor(
      Math.min(
        (area.width - GAP * (columns - 1)) / columns,
        (area.height - GAP * (rows - 1)) / rows,
      ),
    );
  }, [deck.length, area.width, area.height, columns, rows]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setArea(current =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {deck.length === 0 ? (
        // Only reachable with no usable pictures at all — every starter
        // puzzle turned off and no photos uploaded.
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No pictures yet</Text>
        </View>
      ) : (
        cardSize > 0 && (
          <View style={[styles.grid, { width: columns * (cardSize + GAP) - GAP }]}>
            {deck.map(card => (
              <MemoryCard
                key={card.id}
                card={card}
                faceUp={
                  turned.includes(card.id) || matched.includes(card.pictureId)
                }
                matched={matched.includes(card.pictureId)}
                size={cardSize}
                onPress={handlePress}
              />
            ))}
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
  },
});
