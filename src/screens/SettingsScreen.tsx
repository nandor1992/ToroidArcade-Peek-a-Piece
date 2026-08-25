import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Slider } from '../components/Slider';

export interface TimerPreset {
  label: string;
  minutes: number | null;
}

const TIMER_PRESETS: TimerPreset[] = [
  { label: 'Off', minutes: null },
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
];

export interface SettingsScreenProps {
  soundVolume: number;
  onChangeSoundVolume: (value: number) => void;
  soundMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  timerMinutes: number | null;
  onChangeTimerMinutes: (minutes: number | null) => void;
  onBack?: () => void;
}

export function SettingsScreen({
  soundVolume,
  onChangeSoundVolume,
  soundMuted,
  onToggleMute,
  timerMinutes,
  onChangeTimerMinutes,
  onBack,
}: SettingsScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}>
          <Text style={styles.iconGlyph}>←</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Background Music</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={soundMuted ? 'Unmute' : 'Mute'}
            onPress={() => onToggleMute(!soundMuted)}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}>
            <Text style={styles.iconGlyph}>{soundMuted ? '🔇' : '🔊'}</Text>
          </Pressable>
        </View>
        <View style={soundMuted && styles.sliderMuted}>
          <Slider
            value={soundVolume}
            onValueChange={onChangeSoundVolume}
            accessibilityLabel="Music volume"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Screen Time Limit</Text>
        <View style={styles.presetsRow}>
          {TIMER_PRESETS.map(preset => {
            const selected = preset.minutes === timerMinutes;
            return (
              <Pressable
                key={preset.label}
                accessibilityRole="button"
                accessibilityLabel={preset.label}
                accessibilityState={{ selected }}
                onPress={() => onChangeTimerMinutes(preset.minutes)}
                style={({ pressed }) => [
                  styles.presetChip,
                  selected && styles.presetChipSelected,
                  pressed && styles.presetChipPressed,
                ]}>
                <Text
                  style={[
                    styles.presetLabel,
                    selected && styles.presetLabelSelected,
                  ]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerSpacer: {
    width: 44,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  iconGlyph: {
    fontSize: 22,
    color: colors.navy,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  sliderMuted: {
    opacity: 0.4,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.navy,
  },
  presetChipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  presetChipPressed: {
    opacity: 0.7,
  },
  presetLabel: {
    color: colors.navy,
    fontWeight: '600',
  },
  presetLabelSelected: {
    color: 'white',
  },
});
