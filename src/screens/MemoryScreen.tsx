import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { MemoryBoard } from '../games/memory/components/MemoryBoard';
import { DEFAULT_MEMORY_SIZE } from '../games/memory/memorySizes';
import type { Puzzle } from '../types/puzzle';

// Pale washes behind the board, the same idea as PuzzleScreen's — a tint
// that sets the cards off without competing with the photos on them.
const BACKGROUND_PLACEHOLDERS = [
  '#FBF3DC', // pale sunbeam
  '#EAF4E0', // pale leaf
  '#F1EAF9', // pale violet
  '#FCEEDD', // pale tangerine
  '#E2F3F0', // pale teal
] as const;

export interface MemoryScreenProps {
  /** The pool to deal from — uploaded photos and starter pictures alike. */
  pictures?: Puzzle[];
  /** How many distinct pictures to deal; each appears on two cards. */
  pictureCount?: number;
  onBack?: () => void;
}

/**
 * Hosts the Family Memory game: header, a Reset button, and the board.
 * Deliberately thin — the rules live in [[MemoryBoard]], the deal in
 * [[buildMemoryDeck]], matching how PuzzleScreen sits over PuzzleBoard.
 * See docs/specs/screens/MemoryScreen.md.
 */
export function MemoryScreen({
  pictures = [],
  pictureCount = DEFAULT_MEMORY_SIZE.pictures,
  onBack,
}: MemoryScreenProps) {
  // Bumping this re-deals in place — same mechanism as the puzzle's Reset.
  const [resetCount, setResetCount] = useState(0);
  const [solved, setSolved] = useState(false);

  // A new deal is never already solved, and changing the count deals anew.
  useEffect(() => {
    setSolved(false);
  }, [resetCount, pictureCount]);

  const background =
    BACKGROUND_PLACEHOLDERS[resetCount % BACKGROUND_PLACEHOLDERS.length];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={['top', 'bottom']}>
      <AppHeader title="Family Memory" onBack={onBack} />

      <View style={styles.playArea}>
        <View style={styles.boardLayer}>
          <MemoryBoard
            pictures={pictures}
            pictureCount={pictureCount}
            resetSignal={resetCount}
            onSolved={() => setSolved(true)}
          />
        </View>

        {/* Floats over the board. `box-none` so taps between the buttons
            still reach the cards underneath. */}
        <View style={styles.topControls} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New game"
            onPress={() => setResetCount(current => current + 1)}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}>
            <Icon name="reset" size={26} color={colors.navy} />
          </Pressable>
        </View>

        {solved && (
          <View style={styles.solvedBanner} pointerEvents="none">
            <Text style={styles.solvedBannerText}>🎉 You found them all!</Text>
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
    // Leaves the Reset button a clear corner to sit in.
    padding: 16,
    paddingTop: 76,
  },
  topControls: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  solvedBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  solvedBannerText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    backgroundColor: colors.cream,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
});
