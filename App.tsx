/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen, STARTER_PUZZLES } from './src/screens/HomeScreen';
import { PuzzleScreen } from './src/screens/PuzzleScreen';
import { ParentGateScreen } from './src/screens/ParentGateScreen';
import { ParentScreen } from './src/screens/ParentScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SessionLockOverlay } from './src/screens/SessionLockOverlay';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useBackgroundMusic } from './src/hooks/useBackgroundMusic';
import { usePersistentPuzzles } from './src/hooks/usePersistentPuzzles';
import {
  DEFAULT_PUZZLE_SIZE,
  type PuzzleSize,
} from './src/games/puzzle/puzzleSizes';

// Lets the app render immediately with zero insets instead of nothing at
// all, since SafeAreaProvider otherwise renders no children until a real
// native onInsetsChange event arrives (which real devices deliver almost
// instantly, but which never arrives at all in the Jest test renderer).
// Real insets (notch, home indicator, etc.) still override this moments
// later on an actual device.
const FALLBACK_SAFE_AREA_METRICS = {
  frame: {
    x: 0,
    y: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

type Screen =
  | { name: 'home' }
  | { name: 'puzzle'; puzzleId: string }
  | { name: 'parentGate' }
  | { name: 'parent' }
  | { name: 'settings' };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  // Uploaded photos and per-puzzle completion are persisted to
  // AsyncStorage (photos' bytes copied into app storage) and rehydrated
  // on launch — see usePersistentPuzzles.
  const {
    userPuzzles,
    addPuzzles,
    deletePuzzle,
    completedIds,
    markCompleted,
    clearCompleted,
  } = usePersistentPuzzles();
  // The rest is still session-only, by design (Settings choices reset on
  // relaunch until there's a reason to keep them).
  const [defaultImagesEnabled, setDefaultImagesEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.6);
  const [soundMuted, setSoundMuted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [puzzleSize, setPuzzleSize] = useState<PuzzleSize>(DEFAULT_PUZZLE_SIZE);
  const [locked, setLocked] = useState(false);

  const stockPuzzles = defaultImagesEnabled ? STARTER_PUZZLES : [];
  const puzzles = [...userPuzzles, ...stockPuzzles];
  const goHome = () => setScreen({ name: 'home' });
  const inChildSession = screen.name === 'home' || screen.name === 'puzzle';
  // Music also plays on the Settings screen so the volume slider and mute
  // button there have something audible to adjust — otherwise dragging the
  // slider looks like it does nothing (see useBackgroundMusic spec).
  const musicEnabled = (inChildSession || screen.name === 'settings') && !locked;

  // Re-locks every `timerMinutes` for as long as a child-facing screen is
  // showing. Leaving to a parent-only screen (or unlocking) clears the
  // pending timeout; re-entering a child screen — including via unlock —
  // starts a fresh full-length countdown, since `locked` is a dependency.
  useEffect(() => {
    if (!timerMinutes || !inChildSession || locked) {
      return;
    }
    const timeout = setTimeout(() => setLocked(true), timerMinutes * 60_000);
    return () => clearTimeout(timeout);
  }, [inChildSession, timerMinutes, locked]);

  useBackgroundMusic({
    enabled: musicEnabled,
    volume: soundVolume,
    muted: soundMuted,
  });

  let content;
  if (screen.name === 'puzzle') {
    content = (
      <PuzzleScreen
        puzzles={puzzles}
        initialPuzzleId={screen.puzzleId}
        rows={puzzleSize.rows}
        columns={puzzleSize.columns}
        onBack={goHome}
        onCompleted={markCompleted}
        onReset={clearCompleted}
      />
    );
  } else if (screen.name === 'parentGate') {
    content = (
      <ParentGateScreen
        onSuccess={() => setScreen({ name: 'parent' })}
        onBack={goHome}
      />
    );
  } else if (screen.name === 'parent') {
    content = (
      <ParentScreen
        userPuzzles={userPuzzles}
        onAddPuzzles={addPuzzles}
        onDeletePuzzle={deletePuzzle}
        defaultImagesEnabled={defaultImagesEnabled}
        onToggleDefaultImages={setDefaultImagesEnabled}
        onBack={goHome}
        onOpenSettings={() => setScreen({ name: 'settings' })}
      />
    );
  } else if (screen.name === 'settings') {
    content = (
      <SettingsScreen
        soundVolume={soundVolume}
        onChangeSoundVolume={setSoundVolume}
        soundMuted={soundMuted}
        onToggleMute={setSoundMuted}
        timerMinutes={timerMinutes}
        onChangeTimerMinutes={setTimerMinutes}
        puzzleSize={puzzleSize}
        onChangePuzzleSize={setPuzzleSize}
        onBack={() => setScreen({ name: 'parent' })}
      />
    );
  } else {
    content = (
      <HomeScreen
        userPuzzles={userPuzzles}
        stockPuzzles={stockPuzzles}
        completedPuzzleIds={[...completedIds]}
        onSelectPuzzle={puzzle =>
          setScreen({ name: 'puzzle', puzzleId: puzzle.id })
        }
        onOpenParentArea={() => setScreen({ name: 'parentGate' })}
      />
    );
  }

  return (
    <SafeAreaProvider initialMetrics={FALLBACK_SAFE_AREA_METRICS}>
      <StatusBar hidden />
      <ErrorBoundary>
        <View style={styles.container}>
          <View
            style={[styles.container, locked && styles.dimmed]}
            pointerEvents={locked ? 'none' : 'auto'}>
            {content}
          </View>
          {locked && (
            <SessionLockOverlay onUnlock={() => setLocked(false)} />
          )}
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dimmed: {
    opacity: 0.4,
  },
});

export default App;
