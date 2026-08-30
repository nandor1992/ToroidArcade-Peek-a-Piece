import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { Puzzle } from '../types/puzzle';
import { puzzleImageSource } from '../utils/puzzleImage';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';

const TILE_COLORS = [
  colors.teal,
  colors.coral,
  colors.violet,
  colors.leaf,
  colors.tangerine,
] as const;

// The bundled starter set, so the app is playable before a parent has
// uploaded any photo. Each one carries a hand-illustrated cartoon
// (src/games/puzzle/assets/starter/) — redistribution-safe art, not a real
// family photo — so these tiles show real pictures and open as real
// jigsaws now, where they used to be bare emoji placeholders. Eight of
// them: a full 4x2 grid on a tablet.
export const STARTER_PUZZLES: Puzzle[] = [
  {
    id: 'stock-1',
    title: 'Meadow',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/meadow.jpg'),
  },
  {
    id: 'stock-2',
    title: 'Fairground',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/fairground.jpg'),
  },
  {
    id: 'stock-3',
    title: 'Climbing',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/climbing.jpg'),
  },
  {
    id: 'stock-4',
    title: 'Tractor',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/tractor.jpg'),
  },
  {
    id: 'stock-5',
    title: 'Sandpit',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/sandpit.jpg'),
  },
  {
    id: 'stock-6',
    title: 'Train',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/train.jpg'),
  },
  {
    id: 'stock-7',
    title: 'Theatre',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/theatre.jpg'),
  },
  {
    id: 'stock-8',
    title: 'Teddies',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/teddies.jpg'),
  },
];

// How many tiles sit side by side, by available width. A typical tablet
// (>= 700dp) gets 4 across — so the eight starter puzzles land as a tidy
// 4x2 — a small tablet / large phone gets 3, a phone gets 2.
function columnsForWidth(width: number): number {
  if (width >= 700) {
    return 4;
  }
  if (width >= 520) {
    return 3;
  }
  return 2;
}

// The column count for the current viewport. In portrait the grid
// "rotates": it shows half as many columns as the same width would give
// in landscape (floored at 2), so a tablet's 4-wide layout becomes 2-wide
// and the eight starters run 2x4 instead of 4x2. Recomputed on
// rotation/resize via `useWindowDimensions`.
function columnsForViewport(width: number, height: number): number {
  const columns = columnsForWidth(width);
  if (height > width) {
    return Math.max(2, Math.round(columns / 2));
  }
  return columns;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

type GridItem =
  | { kind: 'row'; puzzles: Puzzle[]; colorBase: number }
  | { kind: 'divider' };

// Uploaded photos first, then the bundled starter set, as one grid — but
// with a divider between the two groups *only when there's an uploaded
// group to divide from*. `colorBase` is the tile's absolute position so
// background colours keep cycling across rows and across the divider.
function buildGrid(
  userPuzzles: Puzzle[],
  stockPuzzles: Puzzle[],
  columns: number,
): GridItem[] {
  const items: GridItem[] = [];
  let colorBase = 0;
  const addRows = (list: Puzzle[]) => {
    for (const puzzles of chunk(list, columns)) {
      items.push({ kind: 'row', puzzles, colorBase });
      colorBase += puzzles.length;
    }
  };
  addRows(userPuzzles);
  if (userPuzzles.length > 0 && stockPuzzles.length > 0) {
    items.push({ kind: 'divider' });
  }
  addRows(stockPuzzles);
  return items;
}

interface PuzzleTileProps {
  puzzle: Puzzle;
  color: string;
  /** Show the green "solved" check badge. */
  completed?: boolean;
  onPress?: (puzzle: Puzzle) => void;
}

function PuzzleTile({ puzzle, color, completed, onPress }: PuzzleTileProps) {
  const imageSource = puzzleImageSource(puzzle);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={puzzle.title}
      accessibilityState={{ selected: completed }}
      onPress={() => onPress?.(puzzle)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: color },
        pressed && styles.tilePressed,
      ]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.tileImage}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.tileGlyph}>🧩</Text>
      )}
      {completed && (
        <View style={styles.completeBadge} pointerEvents="none">
          <Icon name="check" size={20} color="white" />
        </View>
      )}
    </Pressable>
  );
}

export interface HomeScreenProps {
  userPuzzles?: Puzzle[];
  stockPuzzles?: Puzzle[];
  /** Ids of puzzles solved at least once — each gets a green check. */
  completedPuzzleIds?: string[];
  onSelectPuzzle?: (puzzle: Puzzle) => void;
  onOpenParentArea?: () => void;
}

export function HomeScreen({
  userPuzzles = [],
  stockPuzzles = STARTER_PUZZLES,
  completedPuzzleIds = [],
  onSelectPuzzle,
  onOpenParentArea,
}: HomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const columns = columnsForViewport(width, height);
  const grid = buildGrid(userPuzzles, stockPuzzles, columns);
  const completed = React.useMemo(
    () => new Set(completedPuzzleIds),
    [completedPuzzleIds],
  );

  return (
    <View style={styles.container}>
      {/* The art is pre-blurred and paled; `backgroundImage` fades it
          further so it's a hint of a backdrop behind the tiles, never
          something that competes with the puzzle photos. Sized to the
          full window with `cover` so it always fills the screen, with
          whichever of width/height overflows getting cropped. */}
      <Image
        source={require('../assets/home-bg.jpg')}
        style={[styles.backgroundImage, { width, height }]}
        resizeMode="cover"
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader />
        <FlatList
          // `key` forces a fresh list when the column count changes
          // (rotate a tablet, resize a window) so every row re-chunks.
          key={`cols-${columns}`}
          data={grid}
          keyExtractor={(item, index) =>
            item.kind === 'divider'
              ? `divider-${index}`
              : item.puzzles[0].id
          }
          renderItem={({ item }: ListRenderItemInfo<GridItem>) => {
            if (item.kind === 'divider') {
              return <View style={styles.divider} pointerEvents="none" />;
            }
            return (
              <View style={styles.row}>
                {item.puzzles.map((puzzle, colIndex) => (
                  <PuzzleTile
                    key={puzzle.id}
                    puzzle={puzzle}
                    color={
                      TILE_COLORS[
                        (item.colorBase + colIndex) % TILE_COLORS.length
                      ]
                    }
                    completed={completed.has(puzzle.id)}
                    onPress={onSelectPuzzle}
                  />
                ))}
                {Array.from({ length: columns - item.puzzles.length }).map(
                  (_, i) => (
                    // Keep a short last row's tiles their natural size
                    // instead of letting them stretch to fill the width.
                    <View
                      key={`spacer-${i}`}
                      style={styles.spacer}
                      pointerEvents="none"
                    />
                  ),
                )}
              </View>
            );
          }}
          contentContainerStyle={styles.content}
        />
        {/* Deliberately low-contrast — the parent-only entry point, not
            something a toddler should be drawn to tap. Omitted entirely when
            there's no parent area to open (the web demo), rather than left
            as a dead button. */}
        {onOpenParentArea && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Parent settings"
            onPress={onOpenParentArea}
            style={({ pressed }) => [
              styles.parentButton,
              pressed && styles.parentButtonPressed,
            ]}>
            <Icon name="parents" size={50} color={colors.navy} />
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  safe: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  divider: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.navy,
    opacity: 0.12,
    marginBottom: 16,
  },
  spacer: {
    flex: 1,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    minHeight: 140,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePressed: {
    opacity: 0.7,
  },
  tileGlyph: {
    fontSize: 48,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  completeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.leaf,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    opacity: 0.55,
  },
  parentButtonPressed: {
    opacity: 0.85,
  },
});
