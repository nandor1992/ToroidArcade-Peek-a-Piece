import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

function randomTwoDigitNumber(): number {
  return Math.floor(Math.random() * 90) + 10; // 10-99
}

function randomProblem() {
  return { a: randomTwoDigitNumber(), b: randomTwoDigitNumber() };
}

export interface ParentGateScreenProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export function ParentGateScreen({
  onSuccess,
  onBack,
}: ParentGateScreenProps) {
  const [problem, setProblem] = useState(randomProblem);
  const [answer, setAnswer] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (parseInt(answer, 10) === problem.a + problem.b) {
      onSuccess();
      return;
    }
    setShowError(true);
    setAnswer('');
    setProblem(randomProblem());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
      <View style={styles.content}>
        <Text style={styles.title}>Parents Only</Text>
        <Text style={styles.prompt}>
          What is {problem.a} + {problem.b}?
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={answer}
          onChangeText={text => {
            setAnswer(text);
            setShowError(false);
          }}
          accessibilityLabel="Answer"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        {showError && (
          <Text style={styles.error}>Not quite — try this new one.</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue"
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
          ]}>
          <Text style={styles.submitLabel}>Continue</Text>
        </Pressable>
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
  prompt: {
    fontSize: 20,
    color: colors.navy,
    marginBottom: 16,
  },
  input: {
    width: 140,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: 12,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    color: colors.navy,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  error: {
    color: colors.coral,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: colors.teal,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
