import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { MemoryCard as MemoryCardData } from '../logic/buildMemoryDeck';

/** How long the flip takes. Brisk, but still a turn you can follow. */
export const FLIP_MS = 182;

export interface MemoryCardProps {
  card: MemoryCardData;
  /** Face-up right now (either just turned, or already matched). */
  faceUp: boolean;
  /** Found its pair — stays face-up, and dims slightly to mark it done. */
  matched: boolean;
  size: number;
  onPress?: (card: MemoryCardData) => void;
}

/**
 * One card on the memory board, with a 3D flip between its patterned back
 * and the family photo on its face.
 *
 * Both faces are always mounted and absolutely stacked; `backfaceVisibility`
 * hides whichever one is turned away. Animating a single shared value keeps
 * the two halves of the turn exactly in step — the alternative, fading two
 * independent opacities, shows a moment of both faces at once mid-turn.
 * See docs/specs/games/memory/components/MemoryCard.md.
 */
export function MemoryCard({
  card,
  faceUp,
  matched,
  size,
  onPress,
}: MemoryCardProps) {
  const turn = useRef(new Animated.Value(faceUp ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: faceUp ? 1 : 0,
      duration: FLIP_MS,
      useNativeDriver: true,
    }).start();
  }, [faceUp, turn]);

  const backSpin = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontSpin = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Pressable
      accessibilityRole="button"
      // Face-down cards all read the same on purpose — announcing the
      // picture would hand a screen-reader user the answer.
      accessibilityLabel={faceUp ? card.title : 'Hidden card'}
      accessibilityState={{ selected: matched, disabled: matched }}
      // Always a handler: the board decides what a tap means, and a tap
      // that means nothing has to do nothing rather than look broken.
      onPress={() => onPress?.(card)}
      style={[styles.card, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.face,
          styles.back,
          { transform: [{ perspective: 800 }, { rotateY: backSpin }] },
        ]}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.backMark}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.face,
          styles.front,
          matched && styles.frontMatched,
          { transform: [{ perspective: 800 }, { rotateY: frontSpin }] },
        ]}>
        <Image source={card.source} style={styles.photo} resizeMode="cover" />
        {matched && <View style={styles.matchedVeil} pointerEvents="none" />}
      </Animated.View>
    </Pressable>
  );
}

const RADIUS = 16;

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS,
    // The faces are absolutely positioned inside, so the Pressable itself
    // is just the hit target and the stacking context.
    overflow: 'hidden',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  back: {
    backgroundColor: colors.sunbeam,
    borderWidth: 3,
    borderColor: colors.tangerine,
  },
  backMark: {
    width: '52%',
    height: '52%',
    opacity: 0.85,
  },
  front: {
    backgroundColor: colors.cream,
    borderWidth: 3,
    borderColor: colors.teal,
    overflow: 'hidden',
  },
  frontMatched: {
    borderColor: colors.leaf,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  // A matched card stays readable but visibly "done", so the remaining
  // work is what stands out.
  matchedVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cream,
    opacity: 0.45,
  },
});
