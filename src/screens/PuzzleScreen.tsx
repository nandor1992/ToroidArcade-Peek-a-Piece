import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { PuzzleBoard } from '../games/puzzle/components/PuzzleBoard';
import type { Puzzle } from '../types/puzzle';
import { puzzleSkiaSource } from '../utils/puzzleImage';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';

// Soft pastel washes — a barely-there tint behind the board, not the
// full-strength brand colours (too loud sitting right behind the photo).
// Each is a heavily lightened relative of a palette hue. Stand-ins until
// bundled background art exists — see docs/specs/screens/PuzzleScreen.md.
const BACKGROUND_PLACEHOLDERS = [
  '#FBF3DC', // pale sunbeam
  '#EAF4E0', // pale leaf
  '#F1EAF9', // pale violet
  '#FCEEDD', // pale tangerine
  '#E2F3F0', // pale teal
] as const;

export interface PuzzleScreenProps {
  puzzles: Puzzle[];
  initialPuzzleId: string;
  /** Piece grid — from the Settings "Puzzle Size" chooser. Defaults to 2x2. */
  rows?: number;
  columns?: number;
  onBack?: () => void;
  /** Called with the puzzle's id the first time it's solved. */
  onCompleted?: (puzzleId: string) => void;
  /** Called with the puzzle's id when Reset is pressed — clears its completion. */
  onReset?: (puzzleId: string) => void;
}

export function PuzzleScreen({
  puzzles,
  initialPuzzleId,
  rows = 2,
  columns = 2,
  onBack,
  onCompleted,
  onReset,
}: PuzzleScreenProps) {
  const [index, setIndex] = useState(() => {
    const found = puzzles.findIndex(p => p.id === initialPuzzleId);
    return found === -1 ? 0 : found;
  });

  const puzzle = puzzles[index];
  const [solved, setSolved] = useState(false);
  // Passed to PuzzleBoard as `resetSignal`; bumping it re-scatters the
  // pieces in place (no remount, so the decoded image is kept) — the Reset
  // button.
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    setSolved(false);
  }, [puzzle?.id]);

  const background = useMemo(
    () =>
      BACKGROUND_PLACEHOLDERS[
        Math.floor(Math.random() * BACKGROUND_PLACEHOLDERS.length)
      ],
    // Re-roll only when the puzzle actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puzzle?.id],
  );

  if (!puzzle) {
    return null;
  }

  const imageSource = puzzleSkiaSource(puzzle);
  const goPrev = () =>
    setIndex(current => (current - 1 + puzzles.length) % puzzles.length);
  const goNext = () => setIndex(current => (current + 1) % puzzles.length);
  const reset = () => {
    setResetCount(current => current + 1);
    setSolved(false);
    onReset?.(puzzle.id);
  };

  const handleSolved = () => {
    setSolved(true);
    onCompleted?.(puzzle.id);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={['top', 'bottom']}>
      <AppHeader />

      <View style={styles.playArea}>
        <View style={styles.boardLayer} accessibilityLabel={puzzle.title}>
          {imageSource != null ? (
            <PuzzleBoard
              // Keyed only on the puzzle + grid size, so switching puzzles
              // remounts (new image to decode) but Reset doesn't — Reset
              // goes through `resetSignal`, keeping the decoded image.
              key={`${puzzle.id}-${columns}x${rows}`}
              imageSource={imageSource}
              rows={rows}
              columns={columns}
              resetSignal={resetCount}
              onSolved={handleSolved}
            />
          ) : (
            // A puzzle with no artwork at all — nothing to cut into
            // pieces. See docs/specs/screens/PuzzleScreen.md.
            <Text style={styles.imageGlyph}>🧩</Text>
          )}
        </View>

        {/* Controls float over the board. `box-none` so touches between
            the buttons still reach the pieces underneath. */}
        <View style={styles.topControls} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Home"
            onPress={onBack}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}>
            <Icon name="home" size={28} color={colors.navy} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset puzzle"
            onPress={reset}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}>
            <Icon name="reset" size={26} color={colors.navy} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous puzzle"
          onPress={goPrev}
          style={({ pressed }) => [
            styles.sideButton,
            styles.sideButtonLeft,
            pressed && styles.navButtonPressed,
          ]}>
          <Icon name="previous" size={32} color={colors.navy} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next puzzle"
          onPress={goNext}
          style={({ pressed }) => [
            styles.sideButton,
            styles.sideButtonRight,
            pressed && styles.navButtonPressed,
          ]}>
          <Icon name="next" size={32} color={colors.navy} />
        </Pressable>

        {solved && (
          <View style={styles.solvedBanner} pointerEvents="none">
            <Text style={styles.solvedBannerText}>🎉 Great job!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playArea: {
    flex: 1,
  },
  boardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    opacity: 0.6,
  },
  topControls: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sideButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
    opacity: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonLeft: {
    left: 8,
  },
  sideButtonRight: {
    right: 8,
  },
  imageGlyph: {
    fontSize: 96,
  },
  solvedBanner: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: colors.teal,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  solvedBannerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
