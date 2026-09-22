import React from 'react';
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';
import { GameMark, type GameMarkName } from '../components/GameMark';
import { Icon } from '../components/Icon';

// The app's landing screen: one tile per game. Adding a third game means
// adding a row here (and a screen for it) — nothing else on this screen
// is game-specific.
interface GameChoice {
  key: string;
  title: string;
  mark: GameMarkName;
  /** The tile's base stripe — the only colour the tile itself carries. */
  accent: string;
}

const GAMES: GameChoice[] = [
  { key: 'puzzle', title: 'Family Puzzle', mark: 'puzzle', accent: colors.teal },
  { key: 'memory', title: 'Family Memory', mark: 'memory', accent: colors.coral },
];

// The mark fills its tile: 94% of the width, or whatever height is left
// after the label, whichever is smaller. The tiles themselves are sized to
// fill the screen (no maxHeight), so this is as large as two marks can be
// without one crowding the other.
const MARK_WIDTH_SCALE = 0.94;
/** Room kept below the mark for the label, its gap and the base stripe. */
const LABEL_SPACE = 44;

// Breathing room around the tiles, as a share of the screen's shorter side
// — so the inset reads the same on a phone and a tablet instead of being a
// hairline on one and a canyon on the other. Also used as the gap between
// the two tiles, so the spacing has one rhythm.
const INSET_RATIO = 0.1;

interface GameTileProps {
  game: GameChoice;
  onPress?: () => void;
}

function GameTile({ game, onPress }: GameTileProps) {
  // Skia needs a pixel size, and the tiles are flex-sized, so the mark is
  // sized from the measured tile rather than hard-coded. It renders on the
  // second pass; before that the tile is just its background.
  const [markSize, setMarkSize] = React.useState(0);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMarkSize(
      Math.max(
        0,
        Math.round(
          Math.min(width * MARK_WIDTH_SCALE, height - LABEL_SPACE),
        ),
      ),
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={game.title}
      // Always a handler, so a tile with nothing wired to it absorbs the
      // tap silently rather than looking broken.
      onPress={() => onPress?.()}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.tile,
        { borderBottomColor: game.accent },
        pressed && styles.tilePressed,
      ]}>
      {/* The mark carries the meaning for a pre-reader; the label
          underneath is for the adult handing over the tablet. The tile is
          cream so the mark's own brand colours stay legible — a teal piece
          on a teal tile would disappear. */}
      {markSize > 0 && <GameMark name={game.mark} size={markSize} />}
      <Text style={styles.tileLabel}>{game.title}</Text>
    </Pressable>
  );
}

export interface GameSelectScreenProps {
  onSelectPuzzles?: () => void;
  onSelectMemory?: () => void;
  onOpenParentArea?: () => void;
}

/**
 * Main screen — picks which game to play. Two big tiles, side by side in
 * landscape and stacked in portrait, each opening one game's own screen.
 * See docs/specs/screens/GameSelectScreen.md.
 */
export function GameSelectScreen({
  onSelectPuzzles,
  onSelectMemory,
  onOpenParentArea,
}: GameSelectScreenProps) {
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const inset = Math.round(Math.min(width, height) * INSET_RATIO);

  const handlers: Record<string, (() => void) | undefined> = {
    puzzle: onSelectPuzzles,
    memory: onSelectMemory,
  };

  return (
    <View style={styles.container}>
      {/* Same pre-blurred backdrop as Home, so the two screens read as one
          app rather than two. */}
      <Image
        source={require('../assets/home-bg.jpg')}
        style={[styles.backgroundImage, { width, height }]}
        resizeMode="cover"
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader />
        <View
          style={[
            styles.tiles,
            { padding: inset, gap: inset },
            portrait && styles.tilesPortrait,
          ]}>
          {GAMES.map(game => (
            <GameTile
              key={game.key}
              game={game}
              onPress={handlers[game.key]}
            />
          ))}
        </View>
        {/* Same corner affordance as HomeScreen, and deliberately the same
            low contrast — the parent-only entry point, not something a
            toddler should be drawn to tap. Here as well as on the game
            screens so a grown-up can reach Settings from the app's first
            screen instead of having to enter a game first. Omitted
            entirely when there's no parent area to open (the web demo),
            rather than left as a dead button. */}
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
  tiles: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    // padding and gap are set inline, from the viewport — see INSET_RATIO.
  },
  tilesPortrait: {
    flexDirection: 'column',
  },
  tile: {
    flex: 1,
    // Never smaller than a comfortable two-handed target, however the
    // window is sized.
    minWidth: 160,
    minHeight: 160,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: colors.cream,
    // The tile's only colour: a thick base stripe in the game's accent,
    // set per-tile. Keeps teal/coral telling the two apart without
    // swamping the marks.
    borderBottomWidth: 10,
    // Lifts the cream tile off the cream page, which the blurred backdrop
    // alone doesn't do reliably.
    borderWidth: 2,
    borderColor: 'rgba(38, 56, 90, 0.10)',
    elevation: 3,
    shadowColor: colors.navy,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  tilePressed: {
    opacity: 0.7,
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
  tileLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    // In portrait the tiles run the full width of the screen, so without
    // this the label sits hard against the tile's rounded edges.
    paddingHorizontal: 20,
  },
});
