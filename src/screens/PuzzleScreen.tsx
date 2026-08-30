import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { PuzzleBoard } from '../games/puzzle/components/PuzzleBoard';
import type { Puzzle } from '../types/puzzle';
import { puzzleSkiaSource } from '../utils/puzzleImage';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';

// Stand-ins for bundled background art. Swap for real images once that
// asset set exists — see docs/specs/screens/PuzzleScreen.md.
const BACKGROUND_PLACEHOLDERS = [
  colors.sunbeam,
  colors.leaf,
  colors.violet,
  colors.tangerine,
] as const;

export interface PuzzleScreenProps {
  puzzles: Puzzle[];
  initialPuzzleId: string;
  /** Piece grid — from the Settings "Puzzle Size" chooser. Defaults to 2x2. */
  rows?: number;
  columns?: number;
  onBack?: () => void;
}

export function PuzzleScreen({
  puzzles,
  initialPuzzleId,
  rows = 2,
  columns = 2,
  onBack,
}: PuzzleScreenProps) {
  const [index, setIndex] = useState(() => {
    const found = puzzles.findIndex(p => p.id === initialPuzzleId);
    return found === -1 ? 0 : found;
  });

  const puzzle = puzzles[index];
  const [solved, setSolved] = useState(false);
  // Bumping this remounts PuzzleBoard, which re-scatters the pieces — the
  // Reset button, and implicitly every puzzle change.
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
              key={`${puzzle.id}-${columns}x${rows}-${resetCount}`}
              imageSource={imageSource}
              rows={rows}
              columns={columns}
              onSolved={() => setSolved(true)}
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
