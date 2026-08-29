import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { Puzzle } from '../types/puzzle';
import { puzzleImageSource } from '../utils/puzzleImage';

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
// jigsaws now, where they used to be bare emoji placeholders.
export const STARTER_PUZZLES: Puzzle[] = [
  {
    id: 'stock-1',
    title: 'Meadow',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/meadow.png'),
  },
  {
    id: 'stock-2',
    title: 'Fairground',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/fairground.png'),
  },
  {
    id: 'stock-3',
    title: 'Climbing',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/climbing.png'),
  },
  {
    id: 'stock-4',
    title: 'Dinosaur',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/dinosaur.png'),
  },
  {
    id: 'stock-5',
    title: 'Tractor',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/tractor.png'),
  },
  {
    id: 'stock-6',
    title: 'Teddies',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/teddies.png'),
  },
  {
    id: 'stock-7',
    title: 'Christmas',
    source: 'stock',
    imageAsset: require('../games/puzzle/assets/starter/christmas.png'),
  },
];

const COLUMNS = 2;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
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
  // One continuous grid — uploaded photos first, starter puzzles after —
  // rather than two labeled sections, per the "together, above them" grid
  // ordering.
  const rows = chunk([...userPuzzles, ...stockPuzzles], COLUMNS);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        data={rows}
        keyExtractor={(row, index) => `${row[0]?.id ?? 'row'}-${index}`}
        renderItem={({ item: row }: ListRenderItemInfo<Puzzle[]>) => (
          <View style={styles.row}>
            {row.map((puzzle, index) => (
              <PuzzleTile
                key={puzzle.id}
                puzzle={puzzle}
                color={TILE_COLORS[index % TILE_COLORS.length]}
                onPress={onSelectPuzzle}
              />
            ))}
            {row.length < COLUMNS && (
              // Keeps a trailing odd tile from stretching to fill the row.
              <View style={styles.spacer} pointerEvents="none" />
            )}
          </View>
        )}
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
        <Text style={styles.parentButtonGlyph}>🔒</Text>
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
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
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
  parentButtonGlyph: {
    fontSize: 18,
  },
});
