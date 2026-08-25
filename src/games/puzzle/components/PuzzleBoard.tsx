import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { generatePuzzleGrid } from '../logic/generatePuzzleGrid';
import type { PuzzlePieceDescriptor } from '../logic/generatePuzzleGrid';
import { pathCommandsToSvgPath } from '../logic/pathCommandsToSvgPath';
import { computeCoverRect } from '../logic/coverRect';

export interface PuzzleBoardProps {
  imageUri: string;
  rows?: number;
  columns?: number;
  onSolved?: () => void;
}

interface PieceState {
  descriptor: PuzzlePieceDescriptor;
  x: number;
  y: number;
  placed: boolean;
}

// How close (in board pixels) a released piece needs to land to its
// correct spot to snap into place — generous on purpose, matching the
// forgiving-input constraint used everywhere else a toddler taps or drags.
const SNAP_DISTANCE = 40;

function randomStart(max: number): number {
  return Math.random() * Math.max(0, max);
}

/**
 * A Skia-rendered jigsaw puzzle: cuts `imageUri` into `rows` x `columns`
 * interlocking pieces (see `generatePuzzleGrid`/`pieceShapes`), scrambles
 * them, and lets the player drag pieces back into place. All state is
 * local — nothing here persists once the screen showing it unmounts, by
 * design. See docs/specs/games/puzzle/components/PuzzleBoard.md.
 */
export function PuzzleBoard({
  imageUri,
  rows = 2,
  columns = 2,
  onSolved,
}: PuzzleBoardProps) {
  const image = useImage(imageUri);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [pieces, setPieces] = useState<PieceState[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const solvedRef = useRef(false);

  const pieceWidth = boardSize.width / columns;
  const pieceHeight = boardSize.height / rows;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize(current =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  // Lays out and scrambles the grid once the board's on-screen size is
  // known. Only runs once per mount (guarded by `pieces` already being
  // set) — this screen is expected to remount for a new puzzle, not
  // resize an existing one.
  useEffect(() => {
    if (pieces || boardSize.width === 0 || boardSize.height === 0) {
      return;
    }
    const descriptors = generatePuzzleGrid(
      rows,
      columns,
      boardSize.width,
      boardSize.height,
    );
    setPieces(
      descriptors.map(descriptor => ({
        descriptor,
        x: randomStart(boardSize.width - boardSize.width / columns),
        y: randomStart(boardSize.height - boardSize.height / rows),
        placed: false,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardSize]);

  const coverRect = useMemo(() => {
    if (!image || boardSize.width === 0 || boardSize.height === 0) {
      return null;
    }
    return computeCoverRect(
      image.width(),
      image.height(),
      boardSize.width,
      boardSize.height,
    );
  }, [image, boardSize]);

  const handleGrant = (event: GestureResponderEvent) => {
    if (!pieces) {
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    // Search topmost (last-rendered) first, so overlapping unplaced
    // pieces prefer whichever was most recently brought forward.
    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i];
      if (piece.placed) {
        continue;
      }
      if (
        locationX >= piece.x &&
        locationX <= piece.x + pieceWidth &&
        locationY >= piece.y &&
        locationY <= piece.y + pieceHeight
      ) {
        dragOffset.current = {
          x: locationX - piece.x,
          y: locationY - piece.y,
        };
        setDraggingId(piece.descriptor.id);
        // Bring the grabbed piece to the front (end of the array) so it
        // renders on top of everything else while dragged.
        setPieces(current => {
          if (!current) {
            return current;
          }
          const rest = current.filter(
            p => p.descriptor.id !== piece.descriptor.id,
          );
          return [...rest, piece];
        });
        return;
      }
    }
  };

  const handleMove = (event: GestureResponderEvent) => {
    if (!draggingId) {
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    const nextX = locationX - dragOffset.current.x;
    const nextY = locationY - dragOffset.current.y;
    setPieces(current =>
      current
        ? current.map(p =>
            p.descriptor.id === draggingId ? { ...p, x: nextX, y: nextY } : p,
          )
        : current,
    );
  };

  const handleRelease = () => {
    if (!draggingId) {
      return;
    }
    const id = draggingId;
    setDraggingId(null);
    // Only updates piece positions/placed flags here — calling onSolved
    // is a side effect and belongs in the effect below, not in this
    // updater (React disallows scheduling another component's update
    // from inside one, which onSolved often does).
    setPieces(current => {
      if (!current) {
        return current;
      }
      return current.map(p => {
        if (p.descriptor.id !== id) {
          return p;
        }
        const distance = Math.hypot(
          p.x - p.descriptor.targetX,
          p.y - p.descriptor.targetY,
        );
        if (distance <= SNAP_DISTANCE) {
          return {
            ...p,
            x: p.descriptor.targetX,
            y: p.descriptor.targetY,
            placed: true,
          };
        }
        return p;
      });
    });
  };

  useEffect(() => {
    if (
      pieces &&
      !solvedRef.current &&
      pieces.every(p => p.placed)
    ) {
      solvedRef.current = true;
      onSolved?.();
    }
  }, [pieces, onSolved]);

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleRelease}>
      {image && pieces && coverRect && (
        <Canvas style={{ width: boardSize.width, height: boardSize.height }}>
          {pieces.map(piece => (
            <Group
              key={piece.descriptor.id}
              clip={pathCommandsToSvgPath(piece.descriptor.path)}
              transform={[{ translateX: piece.x }, { translateY: piece.y }]}>
              <Image
                image={image}
                x={coverRect.x - piece.descriptor.targetX}
                y={coverRect.y - piece.descriptor.targetY}
                width={coverRect.width}
                height={coverRect.height}
              />
            </Group>
          ))}
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Percentage sizing, not flex: 1 — callers (e.g. PuzzleScreen's
    // imagePlaceholder) may center-align their children rather than
    // stretch them, which would leave a flex: 1 view with zero cross-axis
    // size and nothing to ever measure via onLayout.
    width: '100%',
    height: '100%',
  },
});
