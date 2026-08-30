import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Canvas, Group, Image, Path, useImage } from '@shopify/react-native-skia';
import { generatePuzzleGrid } from '../logic/generatePuzzleGrid';
import type { PuzzlePieceDescriptor } from '../logic/generatePuzzleGrid';
import { pathCommandsToSvgPath } from '../logic/pathCommandsToSvgPath';
import { colors } from '../../../theme/colors';

export interface PuzzleBoardProps {
  /**
   * The source photo to cut into pieces, in whatever shape Skia's
   * `useImage` accepts: a bundled asset module (`require()`d number) for a
   * starter puzzle, or a `file://` URI string for a parent-uploaded photo.
   */
  imageSource: number | string;
  rows?: number;
  columns?: number;
  onSolved?: () => void;
}

interface PieceState {
  descriptor: PuzzlePieceDescriptor;
  /** Absolute (board-space) position of the piece's top-left corner. */
  x: number;
  y: number;
  /** Where this piece belongs when the picture is fully assembled. */
  targetX: number;
  targetY: number;
  /**
   * Pieces sharing a `groupId` are locked together in their correct
   * relative arrangement and drag as one. The puzzle is solved when every
   * piece is in a single group.
   */
  groupId: number;
  /** Sitting exactly on its final spot → can't be picked up again (only Reset clears it). */
  placed: boolean;
}

interface PuzzleBox {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

// The assembled picture never fills more than this fraction of the play
// area in either dimension — so there's room to scatter the pieces around
// it, and it never dominates the screen.
const MAX_PUZZLE_FRACTION = 0.6;

// Snap radius as a fraction of the smaller piece dimension, floored so
// even small pieces on a fine grid stay catchable.
const SNAP_RATIO = 0.4;
const MIN_SNAP_DISTANCE = 18;

// How close (board px) a piece has to be to its target to count as
// "placed" once snapping/merging has settled.
const PLACED_EPSILON = 0.5;

function rectContainsPoint(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  px: number,
  py: number,
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function areGridNeighbours(
  a: PuzzlePieceDescriptor,
  b: PuzzlePieceDescriptor,
): boolean {
  return (
    (a.row === b.row && Math.abs(a.column - b.column) === 1) ||
    (a.column === b.column && Math.abs(a.row - b.row) === 1)
  );
}

/**
 * Where the assembled picture sits inside the play area: centred, at the
 * image's own aspect ratio, no bigger than {@link MAX_PUZZLE_FRACTION} of
 * either dimension.
 */
function fitPuzzleBox(
  imageWidth: number,
  imageHeight: number,
  areaWidth: number,
  areaHeight: number,
): PuzzleBox {
  const maxW = areaWidth * MAX_PUZZLE_FRACTION;
  const maxH = areaHeight * MAX_PUZZLE_FRACTION;
  const aspect = imageWidth / imageHeight;
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return {
    width,
    height,
    originX: (areaWidth - width) / 2,
    originY: (areaHeight - height) / 2,
  };
}

/**
 * A random top-left position for a piece: somewhere in the play area, but
 * with its centre *outside* the central assembled-picture box — i.e.
 * scattered toward the edges. Falls back to the top-left corner if it
 * can't find a free spot (only realistically happens when `random` is a
 * constant, e.g. mocked in tests).
 */
function scatterPosition(
  pieceWidth: number,
  pieceHeight: number,
  area: { width: number; height: number },
  box: PuzzleBox,
  random: () => number,
): { x: number; y: number } {
  const maxX = Math.max(0, area.width - pieceWidth);
  const maxY = Math.max(0, area.height - pieceHeight);
  for (let i = 0; i < 30; i++) {
    const x = random() * maxX;
    const y = random() * maxY;
    const inBox = rectContainsPoint(
      box.originX,
      box.originY,
      box.width,
      box.height,
      x + pieceWidth / 2,
      y + pieceHeight / 2,
    );
    if (!inBox) {
      return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function buildPieces(
  rows: number,
  columns: number,
  area: { width: number; height: number },
  box: PuzzleBox,
  random: () => number,
): PieceState[] {
  const descriptors = generatePuzzleGrid(
    rows,
    columns,
    box.width,
    box.height,
    random,
  );
  const pieceWidth = box.width / columns;
  const pieceHeight = box.height / rows;
  return descriptors.map((descriptor, index) => {
    const { x, y } = scatterPosition(pieceWidth, pieceHeight, area, box, random);
    return {
      descriptor,
      x,
      y,
      targetX: box.originX + descriptor.targetX,
      targetY: box.originY + descriptor.targetY,
      groupId: index,
      placed: false,
    };
  });
}

/**
 * The smallest translation (within `snapDistance`) that lands some piece
 * of `group` either on its own final spot or correctly against a piece of
 * another group — or `null` if nothing is close enough to snap.
 */
function bestSnap(
  group: PieceState[],
  others: PieceState[],
  snapDistance: number,
): { dx: number; dy: number } | null {
  let bestDx = 0;
  let bestDy = 0;
  let bestDist = Infinity;
  const consider = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    if (dist <= snapDistance && dist < bestDist) {
      bestDx = dx;
      bestDy = dy;
      bestDist = dist;
    }
  };
  for (const p of group) {
    consider(p.targetX - p.x, p.targetY - p.y);
    for (const o of others) {
      if (!areGridNeighbours(p.descriptor, o.descriptor)) {
        continue;
      }
      consider(
        o.x + (p.targetX - o.targetX) - p.x,
        o.y + (p.targetY - o.targetY) - p.y,
      );
    }
  }
  return bestDist === Infinity ? null : { dx: bestDx, dy: bestDy };
}

/**
 * Merges any two groups whose bordering pieces are within `tolerance` of
 * their correct relative position, snapping the newly-joined group into
 * exact alignment. Repeats to a fixpoint so one drop can connect a chain
 * of groups.
 */
function mergeAlignedGroups(
  pieces: PieceState[],
  tolerance: number,
): PieceState[] {
  let result = pieces;
  for (let pass = 0; pass < result.length; pass++) {
    let merged = false;
    for (const a of result) {
      for (const b of result) {
        if (a.groupId === b.groupId) {
          continue;
        }
        if (!areGridNeighbours(a.descriptor, b.descriptor)) {
          continue;
        }
        const offX = a.x - b.x - (a.targetX - b.targetX);
        const offY = a.y - b.y - (a.targetY - b.targetY);
        if (Math.hypot(offX, offY) > tolerance) {
          continue;
        }
        const from = b.groupId;
        const to = a.groupId;
        result = result.map(p =>
          p.groupId === from
            ? { ...p, groupId: to, x: p.x + offX, y: p.y + offY }
            : p,
        );
        merged = true;
        break;
      }
      if (merged) {
        break;
      }
    }
    if (!merged) {
      break;
    }
  }
  return result;
}

function markPlaced(pieces: PieceState[]): PieceState[] {
  return pieces.map(p => {
    const atTarget =
      Math.abs(p.x - p.targetX) < PLACED_EPSILON &&
      Math.abs(p.y - p.targetY) < PLACED_EPSILON;
    return atTarget === p.placed ? p : { ...p, placed: atTarget };
  });
}

/**
 * A Skia-rendered jigsaw puzzle. Cuts `imageSource` into `rows` x
 * `columns` interlocking pieces (see `generatePuzzleGrid` / `pieceShapes`),
 * scatters them around the edges of the play area, and lets the player
 * drag them back together — pieces snap to their final spot *or* to a
 * matching neighbour, connected pieces drag as one group, and a piece
 * that's landed in its final place is locked (only a remount / Reset
 * scatters it again). All state is local; nothing persists once the
 * screen unmounts, by design.
 * See docs/specs/games/puzzle/components/PuzzleBoard.md.
 */
export function PuzzleBoard({
  imageSource,
  rows = 2,
  columns = 2,
  onSolved,
}: PuzzleBoardProps) {
  const image = useImage(imageSource);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [pieces, setPieces] = useState<PieceState[] | null>(null);
  const [draggingGroupId, setDraggingGroupId] = useState<number | null>(null);
  const [snapReady, setSnapReady] = useState(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const solvedRef = useRef(false);

  const imageWidth = image ? image.width() : 0;
  const imageHeight = image ? image.height() : 0;

  const box = useMemo<PuzzleBox | null>(() => {
    if (imageWidth === 0 || boardSize.width === 0 || boardSize.height === 0) {
      return null;
    }
    return fitPuzzleBox(
      imageWidth,
      imageHeight,
      boardSize.width,
      boardSize.height,
    );
  }, [imageWidth, imageHeight, boardSize.width, boardSize.height]);

  const pieceWidth = box ? box.width / columns : 0;
  const pieceHeight = box ? box.height / rows : 0;
  const snapDistance = Math.max(
    MIN_SNAP_DISTANCE,
    Math.min(pieceWidth, pieceHeight) * SNAP_RATIO,
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize(current =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  // Builds and scatters the grid once, when both the play-area size and
  // the image are known. Only once per mount — a reset / a new puzzle
  // remounts the component (via its `key` in PuzzleScreen).
  useEffect(() => {
    if (pieces || !box) {
      return;
    }
    setPieces(buildPieces(rows, columns, boardSize, box, Math.random));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  const handleGrant = (event: GestureResponderEvent) => {
    if (!pieces || solvedRef.current) {
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    lastTouch.current = { x: locationX, y: locationY };
    // Topmost (last-rendered) piece whose bounding box contains the touch
    // and that isn't already locked into place.
    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i];
      if (piece.placed) {
        continue;
      }
      if (
        rectContainsPoint(
          piece.x,
          piece.y,
          pieceWidth,
          pieceHeight,
          locationX,
          locationY,
        )
      ) {
        const groupId = piece.groupId;
        setDraggingGroupId(groupId);
        // Bring the whole group to the front (end of the array).
        setPieces(current => {
          if (!current) {
            return current;
          }
          const inGroup = current.filter(p => p.groupId === groupId);
          const rest = current.filter(p => p.groupId !== groupId);
          return [...rest, ...inGroup];
        });
        return;
      }
    }
  };

  const handleMove = (event: GestureResponderEvent) => {
    if (draggingGroupId == null) {
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - lastTouch.current.x;
    const dy = locationY - lastTouch.current.y;
    lastTouch.current = { x: locationX, y: locationY };
    setPieces(current =>
      current
        ? current.map(p =>
            p.groupId === draggingGroupId ? { ...p, x: p.x + dx, y: p.y + dy } : p,
          )
        : current,
    );
  };

  const handleRelease = () => {
    const groupId = draggingGroupId;
    setDraggingGroupId(null);
    setSnapReady(false);
    if (groupId == null) {
      return;
    }
    // Position/group updates only — calling onSolved is a side effect and
    // lives in the effect below (React disallows scheduling another
    // component's update from inside this updater).
    setPieces(current => {
      if (!current) {
        return current;
      }
      const group = current.filter(p => p.groupId === groupId);
      const others = current.filter(p => p.groupId !== groupId);
      const snap = bestSnap(group, others, snapDistance);
      if (!snap) {
        return current;
      }
      const moved = current.map(p =>
        p.groupId === groupId
          ? { ...p, x: p.x + snap.dx, y: p.y + snap.dy }
          : p,
      );
      return markPlaced(mergeAlignedGroups(moved, snapDistance));
    });
  };

  // Highlight the dragged group whenever releasing now would snap it.
  useEffect(() => {
    if (draggingGroupId == null || !pieces) {
      setSnapReady(false);
      return;
    }
    const group = pieces.filter(p => p.groupId === draggingGroupId);
    const others = pieces.filter(p => p.groupId !== draggingGroupId);
    setSnapReady(bestSnap(group, others, snapDistance) !== null);
  }, [pieces, draggingGroupId, snapDistance]);

  useEffect(() => {
    if (!pieces || solvedRef.current) {
      return;
    }
    if (new Set(pieces.map(p => p.groupId)).size === 1) {
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
      {image && pieces && box && (
        <Canvas style={{ width: boardSize.width, height: boardSize.height }}>
          {pieces.map(piece => (
            <Group
              key={piece.descriptor.id}
              clip={pathCommandsToSvgPath(piece.descriptor.path)}
              transform={[{ translateX: piece.x }, { translateY: piece.y }]}>
              <Image
                image={image}
                x={-piece.descriptor.targetX}
                y={-piece.descriptor.targetY}
                width={box.width}
                height={box.height}
              />
            </Group>
          ))}
          {snapReady &&
            pieces
              .filter(p => p.groupId === draggingGroupId)
              .map(piece => (
                <Path
                  key={`snap-${piece.descriptor.id}`}
                  path={pathCommandsToSvgPath(piece.descriptor.path)}
                  transform={[
                    { translateX: piece.x },
                    { translateY: piece.y },
                  ]}
                  style="stroke"
                  strokeWidth={6}
                  color={colors.teal}
                />
              ))}
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Percentage sizing, not flex: 1 — a caller that center-aligns its
    // children rather than stretching them would leave a flex: 1 view with
    // zero cross-axis size and nothing to ever measure via onLayout.
    width: '100%',
    height: '100%',
  },
});
