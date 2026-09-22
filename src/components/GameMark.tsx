import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, Path } from '@shopify/react-native-skia';
import {
  EYE_COLOR,
  EYE_HIGHLIGHT_COLOR,
  MARK_CANVAS,
  MEMORY_MARK,
  PUZZLE_MARK,
  type GameMarkGeometry,
} from './gameMarkGeometry';

const MARKS: Record<string, GameMarkGeometry> = {
  puzzle: PUZZLE_MARK,
  memory: MEMORY_MARK,
};

export type GameMarkName = keyof typeof MARKS & ('puzzle' | 'memory');

export interface GameMarkProps {
  name: GameMarkName;
  /** Rendered square, in dp. */
  size?: number;
}

/**
 * The illustrated mark for one game, on the picker: a 2x2 jigsaw block for
 * Family Puzzle, a fanned pair of cards for Family Memory, both with the
 * Peek-a-Piece eyes peeking over the top.
 *
 * Drawn with Skia rather than shipped as PNGs — Skia is already a dependency
 * (the puzzle board uses it) and already gated on the web build, so the marks
 * stay vector at every screen density and there's no rasterising step in the
 * build. Geometry comes from `gameMarkGeometry.ts`, which is generated from
 * the brand mark. See docs/specs/components/GameMark.md.
 */
export function GameMark({ name, size = 96 }: GameMarkProps) {
  const mark = MARKS[name];
  const scale = size / MARK_CANVAS;

  return (
    // Decorative: every use sits inside an already-labelled Pressable, the
    // same arrangement as Icon.
    <View
      style={[styles.frame, { width: size, height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Canvas style={styles.canvas}>
        {/* One uniform scale is the only transform: the geometry is authored
            in absolute MARK_CANVAS coordinates with rotations baked in. */}
        <Group transform={[{ scale }]}>
          {/* Eyes first, so the shapes drawn over them hide the bottom third
              of each — the peekaboo the whole brand is built on. */}
          {mark.eyes.map((eye, i) => (
            <React.Fragment key={`eye-${i}`}>
              <Circle cx={eye.cx} cy={eye.cy} r={eye.r} color={EYE_COLOR} />
              <Circle
                cx={eye.highlight.cx}
                cy={eye.highlight.cy}
                r={eye.highlight.r}
                color={EYE_HIGHLIGHT_COLOR}
              />
            </React.Fragment>
          ))}
          {mark.shapes.map((shape, i) => (
            <Path
              key={`shape-${i}`}
              path={shape.d}
              color={shape.fill}
              opacity={shape.opacity}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
    width: '100%',
  },
});
