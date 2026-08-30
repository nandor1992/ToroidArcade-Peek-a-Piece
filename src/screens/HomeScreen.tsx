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
// 4x2 — a small tablet / large phone gets 3, a phone gets 2. Recomputed
// on rotation/resize via `useWindowDimensions`.
function columnsForWidth(width: number): number {
  if (width >= 700) {
    return 4;
  }
  if (width >= 520) {
    return 3;
  }
  return 2;
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
  onPress?: (puzzle: Puzzle) => void;
}

function PuzzleTile({ puzzle, color, onPress }: PuzzleTileProps) {
  const imageSource = puzzleImageSource(puzzle);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={puzzle.title}
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
    </Pressable>
  );
}

export interface HomeScreenProps {
  userPuzzles?: Puzzle[];
  stockPuzzles?: Puzzle[];
  onSelectPuzzle?: (puzzle: Puzzle) => void;
  onOpenParentArea?: () => void;
}

export function HomeScreen({
  userPuzzles = [],
  stockPuzzles = STARTER_PUZZLES,
  onSelectPuzzle,
  onOpenParentArea,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const columns = columnsForWidth(width);
  const grid = buildGrid(userPuzzles, stockPuzzles, columns);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader />
      <FlatList
        // `key` forces a fresh list when the column count changes (rotate
        // a tablet, resize a window) so every row re-chunks cleanly.
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
      {/* Deliberately small and low-contrast — this is the parent-only
          entry point, not something a toddler should be drawn to tap. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Parent settings"
        onPress={onOpenParentArea}
        style={({ pressed }) => [
          styles.parentButton,
          pressed && styles.parentButtonPressed,
        ]}>
        <Icon name="parents" size={22} color={colors.navy} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
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
  parentButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    opacity: 0.55,
  },
  parentButtonPressed: {
    opacity: 0.85,
  },
});
