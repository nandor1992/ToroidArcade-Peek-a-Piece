import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Icon } from './Icon';

export interface AppHeaderProps {
  /**
   * Replaces the "Peek-a-Piece" wordmark with the current section's name
   * (e.g. "Family Puzzle"). Omit on the app's own main screen, where the
   * app name is the right title.
   */
  title?: string;
  /**
   * When given, a back chevron appears at the left of the bar. Omitted on
   * the main screen, which has nowhere to go back to.
   */
  onBack?: () => void;
}

/**
 * The slim app-identity bar at the top of every child-facing screen
 * (Game select, Home, Puzzle, Memory): the Peek-a-Piece mark plus either
 * the app name or the current section's title, and — on any screen below
 * the main one — a back button. Screen-specific controls (next / reset)
 * still sit below it.
 */
export function AppHeader({ title, onBack }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          // Generous hit area around a visually small chevron: the button
          // itself is 48x48, well past the toddler minimum.
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}>
          <Icon name="back" size={32} color={colors.navy} />
        </Pressable>
      )}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.name}>{title ?? 'Peek-a-Piece'}</Text>
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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Nudged left so the chevron, not its padding, lines up with the
    // content below.
    marginLeft: -12,
  },
  backButtonPressed: {
    opacity: 0.6,
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
