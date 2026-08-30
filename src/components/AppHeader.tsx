import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

/**
 * The slim app-identity bar at the top of every child-facing screen
 * (Home, Puzzle): the Peek-a-Piece mark and wordmark, nothing
 * interactive. Screen-specific controls (back / next) sit below it.
 */
export function AppHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.name}>Peek-a-Piece</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    // An opaque band so the bar stays legible on the Puzzle screen's
    // coloured backgrounds; invisible on Home (same colour as the page).
    backgroundColor: colors.cream,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 0.2,
  },
});
