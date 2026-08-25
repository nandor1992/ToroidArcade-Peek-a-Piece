import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { Puzzle } from '../types/puzzle';

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}>
          <Text style={styles.navGlyph}>←</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next puzzle"
          onPress={() => setIndex(current => (current + 1) % puzzles.length)}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}>
          <Text style={styles.navGlyph}>→</Text>
        </Pressable>
      </View>
      <View style={styles.imageArea}>
        {/* Placeholder for the opened puzzle photo — becomes the actual
            jigsaw game component later. */}
        <View
          style={styles.imagePlaceholder}
          accessibilityLabel={puzzle.title}>
          <Text style={styles.imageGlyph}>🧩</Text>
        </View>
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
  navGlyph: {
    fontSize: 28,
    color: colors.navy,
    fontWeight: '700',
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
  },
  imageGlyph: {
    fontSize: 96,
  },
});
