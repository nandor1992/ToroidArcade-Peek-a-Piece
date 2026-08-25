import React from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
  type SectionListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { Puzzle } from '../types/puzzle';

const TILE_COLORS = [
  colors.teal,
  colors.coral,
  colors.violet,
  colors.leaf,
  colors.tangerine,
] as const;

const STARTER_PUZZLES: Puzzle[] = [
  { id: 'stock-1', title: 'Puppy', source: 'stock' },
  { id: 'stock-2', title: 'Rocket', source: 'stock' },
  { id: 'stock-3', title: 'Flower', source: 'stock' },
  { id: 'stock-4', title: 'Beach Ball', source: 'stock' },
  { id: 'stock-5', title: 'Teddy Bear', source: 'stock' },
  { id: 'stock-6', title: 'Rainbow', source: 'stock' },
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
      <Text style={styles.tileGlyph}>🧩</Text>
    </Pressable>
  );
}

export interface HomeScreenProps {
  userPuzzles?: Puzzle[];
  stockPuzzles?: Puzzle[];
  onSelectPuzzle?: (puzzle: Puzzle) => void;
}

export function HomeScreen({
  userPuzzles = [],
  stockPuzzles = STARTER_PUZZLES,
  onSelectPuzzle,
}: HomeScreenProps) {
  const sections = [
    { title: 'Your Photos', puzzles: userPuzzles },
    { title: 'Starter Puzzles', puzzles: stockPuzzles },
  ]
    .filter(section => section.puzzles.length > 0)
    .map(section => ({
      title: section.title,
      data: chunk(section.puzzles, COLUMNS),
    }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(row, index) => `${row[0]?.id ?? 'row'}-${index}`}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item: row }: SectionListRenderItemInfo<Puzzle[]>) => (
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
        stickySectionHeadersEnabled={false}
      />
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
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 16,
    marginBottom: 12,
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
});
