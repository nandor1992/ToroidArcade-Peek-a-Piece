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
import { puzzleImageSource } from '../utils/puzzleImage';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import type { MemoryGroup } from '../games/memory/logic/buildMemoryGroups';

const TILE_COLORS = [
  colors.teal,
  colors.coral,
  colors.violet,
  colors.leaf,
  colors.tangerine,
] as const;

/** Thumbnails shown on a tile. Four fills a 2x2 grid; the rest are implied. */
const COLLAGE_MAX = 4;

// Same breakpoints as HomeScreen, so the two landing pages lay out
// identically — see docs/specs/screens/HomeScreen.md.
function columnsForWidth(width: number): number {
  if (width >= 700) {
    return 4;
  }
  if (width >= 520) {
    return 3;
  }
  return 2;
}

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

interface GroupTileProps {
  group: MemoryGroup;
  color: string;
  onPress?: (group: MemoryGroup) => void;
}

/**
 * One round, shown as a 2x2 collage of the pictures in it. A collage
 * rather than a single photo because the thing being chosen *is* a set —
 * a lone picture would look like the jigsaw's one-photo-per-tile grid and
 * suggest the round is about that photo.
 */
function GroupTile({ group, color, onPress }: GroupTileProps) {
  const thumbs = group.pictures.slice(0, COLLAGE_MAX);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={group.title}
      onPress={() => onPress?.(group)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: color },
        pressed && styles.tilePressed,
      ]}>
      <View style={styles.collage}>
        {thumbs.map(picture => {
          const source = puzzleImageSource(picture);
          return (
            <View key={picture.id} style={styles.thumbSlot}>
              {source ? (
                <Image
                  source={source}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.thumbGlyph}>🖼️</Text>
              )}
            </View>
          );
        })}
      </View>
      {/* Pairs to find, for the grown-up deciding how long this will take.
          Small and cornered so it stays out of the picture's way. */}
      <View style={styles.countBadge} pointerEvents="none">
        <Text style={styles.countText}>{group.pictures.length}</Text>
      </View>
    </Pressable>
  );
}

export interface MemoryHomeScreenProps {
  groups?: MemoryGroup[];
  onSelectGroup?: (group: MemoryGroup) => void;
  onOpenParentArea?: () => void;
  /** Back to the game picker. Omitted → no back button. */
  onBack?: () => void;
}

/**
 * The Family Memory landing page: one tile per round, the memory
 * counterpart of [[HomeScreen]]'s puzzle grid. Picking a tile opens that
 * round; from there next/previous page between rounds.
 * See docs/specs/screens/MemoryHomeScreen.md.
 */
export function MemoryHomeScreen({
  groups = [],
  onSelectGroup,
  onOpenParentArea,
  onBack,
}: MemoryHomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const columns = columnsForViewport(width, height);
  const rows = chunk(groups, columns);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/home-bg.jpg')}
        style={[styles.backgroundImage, { width, height }]}
        resizeMode="cover"
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader title="Family Memory" onBack={onBack} />
        {groups.length === 0 ? (
          // No playable round at all — every starter picture switched off
          // and nothing uploaded.
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pictures yet</Text>
          </View>
        ) : (
          <FlatList
            // Forces a fresh list when the column count changes (rotate a
            // tablet, resize a window) so every row re-chunks.
            key={`cols-${columns}`}
            data={rows}
            keyExtractor={row => row[0].id}
            renderItem={({
              item,
              index,
            }: ListRenderItemInfo<MemoryGroup[]>) => (
              <View style={styles.row}>
                {item.map((group, colIndex) => (
                  <GroupTile
                    key={group.id}
                    group={group}
                    color={
                      TILE_COLORS[
                        (index * columns + colIndex) % TILE_COLORS.length
                      ]
                    }
                    onPress={onSelectGroup}
                  />
                ))}
                {Array.from({ length: columns - item.length }).map((_, i) => (
                  // Keeps a short last row's tiles their natural size rather
                  // than stretching them across the width.
                  <View
                    key={`spacer-${i}`}
                    style={styles.spacer}
                    pointerEvents="none"
                  />
                ))}
              </View>
            )}
            contentContainerStyle={styles.content}
          />
        )}
        {onOpenParentArea && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Parent controls"
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

const TILE_RADIUS = 24;

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
  spacer: {
    flex: 1,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    minHeight: 140,
    borderRadius: TILE_RADIUS,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.7,
  },
  collage: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  thumbSlot: {
    width: '50%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbGlyph: {
    fontSize: 28,
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
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
