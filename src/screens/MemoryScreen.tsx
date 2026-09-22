import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { AppHeader } from '../components/AppHeader';

export interface MemoryScreenProps {
  onBack?: () => void;
}

/**
 * Placeholder for the Family Memory game — the second tile on
 * GameSelectScreen. Nothing here yet but the header (title + back) and
 * the game's name, so the route exists and is navigable while the game
 * itself is built under `src/games/memory/`.
 * See docs/specs/screens/MemoryScreen.md.
 */
export function MemoryScreen({ onBack }: MemoryScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="Family Memory" onBack={onBack} />
      <View style={styles.body}>
        <Text style={styles.title}>Family Memory</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },
});
