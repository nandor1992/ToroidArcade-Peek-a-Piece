import { useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen, STARTER_PUZZLES } from '../screens/HomeScreen';
import { PuzzleScreen } from '../screens/PuzzleScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { usePersistentPuzzles } from '../hooks/usePersistentPuzzles';
import { DEFAULT_PUZZLE_SIZE } from '../games/puzzle/puzzleSizes';

// Same reason as App.tsx: SafeAreaProvider renders no children until it has
// real insets, so seed it with zeroes for an immediate first paint.
const FALLBACK_SAFE_AREA_METRICS = {
  frame: {
    x: 0,
    y: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

// Music is on from the start here (there's no Settings screen to change it).
// The browser blocks playback until the first user gesture — the web
// implementation of useBackgroundMusic retries then.
const DEMO_VOLUME = 0.6;

type Screen = { name: 'home' } | { name: 'puzzle'; puzzleId: string };

/**
 * Root component for the **web demo** build — the bundled starter puzzles,
 * playable in a browser, and nothing else.
 *
 * Deliberately not `App.tsx`: by never importing ParentScreen /
 * SettingsScreen / ParentGateScreen / SessionLockOverlay, this entry keeps
 * `react-native-image-picker` (no web build) and `Alert` (absent from
 * react-native-web) out of the bundle entirely. Completion ticks still
 * persist — AsyncStorage falls back to IndexedDB on the web.
 * See docs/specs/app/DemoApp.md.
 */
export default function DemoApp() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const { completedIds, markCompleted, clearCompleted } =
    usePersistentPuzzles();

  useBackgroundMusic({
    enabled: true,
    volume: DEMO_VOLUME,
    muted: false,
  });

  const content =
    screen.name === 'puzzle' ? (
      <PuzzleScreen
        puzzles={STARTER_PUZZLES}
        initialPuzzleId={screen.puzzleId}
        rows={DEFAULT_PUZZLE_SIZE.rows}
        columns={DEFAULT_PUZZLE_SIZE.columns}
        onBack={() => setScreen({ name: 'home' })}
        onCompleted={markCompleted}
        onReset={clearCompleted}
      />
    ) : (
      // No `onOpenParentArea` — HomeScreen then hides the parent button,
      // which the demo has nothing to open.
      <HomeScreen
        stockPuzzles={STARTER_PUZZLES}
        completedPuzzleIds={[...completedIds]}
        onSelectPuzzle={puzzle =>
          setScreen({ name: 'puzzle', puzzleId: puzzle.id })
        }
      />
    );

  return (
    <SafeAreaProvider initialMetrics={FALLBACK_SAFE_AREA_METRICS}>
      <StatusBar hidden />
      <ErrorBoundary>
        <View style={styles.container}>{content}</View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
