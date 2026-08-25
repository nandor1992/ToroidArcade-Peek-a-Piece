import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

function randomTwoDigitNumber(): number {
  return Math.floor(Math.random() * 90) + 10; // 10-99
}

function randomProblem() {
  return { a: randomTwoDigitNumber(), b: randomTwoDigitNumber() };
}

export interface MathGateFormProps {
  onSuccess: () => void;
}

/**
 * The addition-problem widget shared by ParentGateScreen (full screen, with
 * a way out) and SessionLockOverlay (a modal card, no way out but solving
 * it) — see docs/specs/components/MathGateForm.md.
 */
export function MathGateForm({ onSuccess }: MathGateFormProps) {
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
    <View>
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
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 20,
    color: colors.navy,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: 140,
    alignSelf: 'center',
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
    textAlign: 'center',
  },
  submitButton: {
    alignSelf: 'center',
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
