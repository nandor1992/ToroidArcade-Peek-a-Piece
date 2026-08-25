import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { MathGateForm } from '../components/MathGateForm';

export interface SessionLockOverlayProps {
  onUnlock: () => void;
}

/**
 * Covers whatever child-facing screen was showing when the play-session
 * timer ran out. There's deliberately no way to dismiss this besides
 * solving the math gate — see docs/specs/screens/SessionLockOverlay.md.
 */
export function SessionLockOverlay({ onUnlock }: SessionLockOverlayProps) {
  return (
    <View style={styles.scrim}>
      <View style={styles.card}>
        <Text style={styles.title}>Time's Up!</Text>
        <Text style={styles.subtitle}>Ask a parent to keep playing.</Text>
        <MathGateForm onSuccess={onUnlock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream,
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 16,
  },
});
