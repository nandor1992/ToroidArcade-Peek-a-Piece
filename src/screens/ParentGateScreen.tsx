import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { MathGateForm } from '../components/MathGateForm';

export interface ParentGateScreenProps {
  onSuccess: () => void;
  onBack?: () => void;
  title?: string;
}

export function ParentGateScreen({
  onSuccess,
  onBack,
  title = 'Parents Only',
}: ParentGateScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}>
          <Text style={styles.backGlyph}>←</Text>
        </Pressable>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <MathGateForm onSuccess={onSuccess} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  backButton: {
    margin: 16,
    minWidth: 56,
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backGlyph: {
    fontSize: 28,
    color: colors.navy,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
});
