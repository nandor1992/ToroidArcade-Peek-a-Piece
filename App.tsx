/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen, STARTER_PUZZLES } from './src/screens/HomeScreen';
import { PuzzleScreen } from './src/screens/PuzzleScreen';
import { ParentGateScreen } from './src/screens/ParentGateScreen';
import { ParentScreen } from './src/screens/ParentScreen';
import type { Puzzle } from './src/types/puzzle';

type Screen =
  | { name: 'home' }
  | { name: 'puzzle'; puzzleId: string }
  | { name: 'parentGate' }
  | { name: 'parent' };

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  // No persisted storage yet (src/storage/ is empty) — these reset on
  // every app launch until that layer exists.
  const [userPuzzles, setUserPuzzles] = useState<Puzzle[]>([]);
  const [defaultImagesEnabled, setDefaultImagesEnabled] = useState(true);

  const stockPuzzles = defaultImagesEnabled ? STARTER_PUZZLES : [];
  const puzzles = [...userPuzzles, ...stockPuzzles];
  const goHome = () => setScreen({ name: 'home' });

  let content;
  if (screen.name === 'puzzle') {
    content = (
      <PuzzleScreen
        puzzles={puzzles}
        initialPuzzleId={screen.puzzleId}
        onBack={goHome}
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
        onAddPuzzle={puzzle =>
          setUserPuzzles(current => [puzzle, ...current])
        }
        onDeletePuzzle={id =>
          setUserPuzzles(current => current.filter(p => p.id !== id))
        }
        defaultImagesEnabled={defaultImagesEnabled}
        onToggleDefaultImages={setDefaultImagesEnabled}
        onBack={goHome}
      />
    );
  } else {
    content = (
      <HomeScreen
        userPuzzles={userPuzzles}
        stockPuzzles={stockPuzzles}
        onSelectPuzzle={puzzle => setScreen({ name: 'puzzle', puzzleId: puzzle.id })}
        onOpenParentArea={() => setScreen({ name: 'parentGate' })}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>{content}</View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
