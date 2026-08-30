import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Test seam — called with the caught error. */
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render/lifecycle exceptions anywhere below it so a JS crash
 * shows a calm, parent-facing recovery screen instead of a permanent
 * white screen with a toddler holding the device. "Try again" remounts
 * the subtree — enough to recover from a transient error; a persistent
 * one needs the parent to close and reopen the app.
 * See docs/specs/components/ErrorBoundary.md.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // No crash-reporting SDK by design (see docs/architecture.md) — just
    // the console, which Android Vitals / logcat still surface.
    console.error('ErrorBoundary caught an error:', error);
    this.props.onError?.(error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🧩</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          Please hand this back to a grown-up.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={this.handleRetry}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.teal,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
