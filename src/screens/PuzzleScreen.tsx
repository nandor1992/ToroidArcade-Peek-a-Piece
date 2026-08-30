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
  onBack?: () => void;
}

export function PuzzleScreen({
  puzzles,
  initialPuzzleId,
  onBack,
}: PuzzleScreenProps) {
  const [index, setIndex] = useState(() => {
    const found = puzzles.findIndex(p => p.id === initialPuzzleId);
    return found === -1 ? 0 : found;
  });

  const puzzle = puzzles[index];
  const [solved, setSolved] = useState(false);

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={['top', 'bottom']}>
      <AppHeader />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}>
          <Icon name="back" size={30} color={colors.navy} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next puzzle"
          onPress={() => setIndex(current => (current + 1) % puzzles.length)}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}>
          <Icon name="next" size={30} color={colors.navy} />
        </Pressable>
      </View>
      <View style={styles.imageArea}>
        <View
          style={styles.imagePlaceholder}
          accessibilityLabel={puzzle.title}>
          {imageSource != null ? (
            <PuzzleBoard
              key={puzzle.id}
              imageSource={imageSource}
              onSolved={() => setSolved(true)}
            />
          ) : (
            // A puzzle with no artwork at all — nothing to cut into
            // pieces. See docs/specs/screens/PuzzleScreen.md.
            <Text style={styles.imageGlyph}>🧩</Text>
          )}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  navButton: {
    minWidth: 56,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    opacity: 0.7,
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 480,
    borderRadius: 32,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageGlyph: {
    fontSize: 96,
  },
  solvedBanner: {
    position: 'absolute',
    top: 12,
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
