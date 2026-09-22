import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { MemoryBoard } from '../games/memory/components/MemoryBoard';
import type { MemoryGroup } from '../games/memory/logic/buildMemoryGroups';

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
  /** Every round, from `buildMemoryGroups` — what next/previous page through. */
  groups: MemoryGroup[];
  /** The round picked on the landing page. */
  initialGroupId: string;
  /** Back to the memory landing page. */
  onBack?: () => void;
}

/**
 * Plays one round of Family Memory, with next/previous paging between
 * rounds — the memory counterpart of [[PuzzleScreen]], and laid out the
 * same way: header, floating Home and Reset, side arrows, board beneath.
 *
 * Deliberately thin: the rules live in [[MemoryBoard]] and the deal in
 * [[buildMemoryDeck]].
 * See docs/specs/screens/MemoryScreen.md.
 */
export function MemoryScreen({
  groups,
  initialGroupId,
  onBack,
}: MemoryScreenProps) {
  const [index, setIndex] = useState(() => {
    const found = groups.findIndex(group => group.id === initialGroupId);
    return found === -1 ? 0 : found;
  });
  // Bumping this re-deals in place — the same mechanism as the puzzle's
  // Reset, and it also drives the background colour so a new round
  // visibly starts afresh.
  const [resetCount, setResetCount] = useState(0);
  const [solved, setSolved] = useState(false);

  const group = groups[index];

  // A new round, or a re-deal of this one, is never already solved.
  useEffect(() => {
    setSolved(false);
  }, [group?.id, resetCount]);

  if (!group) {
    return null;
  }

  const goPrev = () =>
    setIndex(current => (current - 1 + groups.length) % groups.length);
  const goNext = () => setIndex(current => (current + 1) % groups.length);
  const background =
    BACKGROUND_PLACEHOLDERS[
      (index + resetCount) % BACKGROUND_PLACEHOLDERS.length
    ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={['top', 'bottom']}>
      <AppHeader title="Family Memory" />

      <View style={styles.playArea}>
        <View style={styles.boardLayer} accessibilityLabel={group.title}>
          <MemoryBoard
            // Keyed on the round, so switching rounds remounts with a
            // clean slate rather than carrying turned cards across.
            key={group.id}
            pictures={group.pictures}
            pictureCount={group.pictures.length}
            resetSignal={resetCount}
            onSolved={() => setSolved(true)}
          />
        </View>

        {/* Controls float over the board. `box-none` so taps between the
            buttons still reach the cards underneath. */}
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
            accessibilityLabel="New game"
            onPress={() => setResetCount(current => current + 1)}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}>
            <Icon name="reset" size={26} color={colors.navy} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous set"
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
          accessibilityLabel="Next set"
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
    // Keeps the cards clear of the floating controls on every edge.
    paddingTop: 76,
    paddingBottom: 16,
    paddingHorizontal: 76,
  },
  topControls: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  sideButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonLeft: {
    left: 8,
  },
  sideButtonRight: {
    right: 8,
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
