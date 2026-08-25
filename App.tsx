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
import type { Puzzle } from './src/types/puzzle';

// No persisted storage yet (src/storage/ is empty) — parent-uploaded
// puzzles will replace this once that layer exists.
const USER_PUZZLES: Puzzle[] = [];

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [openPuzzleId, setOpenPuzzleId] = useState<string | null>(null);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {openPuzzleId ? (
          <PuzzleScreen
            puzzles={[...USER_PUZZLES, ...STARTER_PUZZLES]}
            initialPuzzleId={openPuzzleId}
            onBack={() => setOpenPuzzleId(null)}
          />
        ) : (
          <HomeScreen
            userPuzzles={USER_PUZZLES}
            onSelectPuzzle={puzzle => setOpenPuzzleId(puzzle.id)}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
