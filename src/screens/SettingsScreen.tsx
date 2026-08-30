import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Slider } from '../components/Slider';
import { Icon } from '../components/Icon';
import { PUZZLE_SIZES, type PuzzleSize } from '../games/puzzle/puzzleSizes';

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

const DEDICATION = 'Built with love for Julia and Vincent';

// Keep in sync with package.json's "version" by hand — there's no build
// step wiring these together yet.
const ABOUT_INFO = {
  appName: 'Peek-a-Piece',
  version: '0.0.1',
  credit: 'Created by ToroidSystems / ToroidArcade',
  starterArt: 'Generated with imagetocartoon.com using our family photos',
  // Pixabay Content License attribution for the bundled background track
  // (resources/the_mountain-children.mp3). utm params are the referral
  // attribution Pixabay asks linkers to keep.
  music: {
    artist: 'Dmitrii Kolesnikov',
    artistUrl:
      'https://pixabay.com/users/the_mountain-3616498/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=522447',
    sourceName: 'Pixabay',
    sourceUrl:
      'https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=522447',
  },
  sourceCode: {
    label: 'Source code on GitHub',
    url: 'https://github.com/nandor1992/ToroidArcade-Peek-a-Piece',
  },
};

export interface SettingsScreenProps {
  soundVolume: number;
  onChangeSoundVolume: (value: number) => void;
  soundMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  timerMinutes: number | null;
  onChangeTimerMinutes: (minutes: number | null) => void;
  puzzleSize: PuzzleSize;
  onChangePuzzleSize: (size: PuzzleSize) => void;
  onBack?: () => void;
}

export function SettingsScreen({
  soundVolume,
  onChangeSoundVolume,
  soundMuted,
  onToggleMute,
  timerMinutes,
  onChangeTimerMinutes,
  puzzleSize,
  onChangePuzzleSize,
  onBack,
}: SettingsScreenProps) {
  const [aboutVisible, setAboutVisible] = useState(false);

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
          <Icon name="back" size={26} color={colors.navy} />
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
            <Icon
              name={soundMuted ? 'volumeOff' : 'volumeOn'}
              size={24}
              color={colors.navy}
            />
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

      <View style={[styles.section, styles.sectionCentered]}>
        <Text style={styles.sectionLabel}>Puzzle Size</Text>
        <View style={[styles.presetsRow, styles.presetsRowCentered]}>
          {PUZZLE_SIZES.map(size => {
            const selected = size.label === puzzleSize.label;
            return (
              <Pressable
                key={size.label}
                accessibilityRole="button"
                accessibilityLabel={size.label}
                accessibilityState={{ selected }}
                onPress={() => onChangePuzzleSize(size)}
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
                  {size.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, styles.sectionCentered]}>
        <Text style={styles.sectionLabel}>Screen Time Limit</Text>
        <View style={[styles.presetsRow, styles.presetsRowCentered]}>
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

      <View style={[styles.section, styles.sectionCentered]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About"
          onPress={() => setAboutVisible(true)}
          style={({ pressed }) => [
            styles.aboutButton,
            pressed && styles.aboutButtonPressed,
          ]}>
          <Text style={styles.aboutButtonLabel}>About</Text>
        </Pressable>
      </View>

      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{ABOUT_INFO.appName}</Text>
            <Text style={styles.modalDedication}>{DEDICATION}</Text>
            <View style={styles.modalRule} />
            <Text style={styles.modalBody}>{ABOUT_INFO.credit}</Text>
            <Text style={styles.modalBody}>{ABOUT_INFO.starterArt}</Text>
            <Text style={styles.modalBody}>
              Music by{' '}
              <Text
                accessibilityRole="link"
                style={styles.modalLink}
                onPress={() => Linking.openURL(ABOUT_INFO.music.artistUrl)}>
                {ABOUT_INFO.music.artist}
              </Text>{' '}
              from{' '}
              <Text
                accessibilityRole="link"
                style={styles.modalLink}
                onPress={() => Linking.openURL(ABOUT_INFO.music.sourceUrl)}>
                {ABOUT_INFO.music.sourceName}
              </Text>
            </Text>
            <Text
              accessibilityRole="link"
              accessibilityLabel={ABOUT_INFO.sourceCode.label}
              style={[styles.modalBody, styles.modalLink]}
              onPress={() => Linking.openURL(ABOUT_INFO.sourceCode.url)}>
              {ABOUT_INFO.sourceCode.label}
            </Text>
            <Text style={styles.modalVersion}>
              Version {ABOUT_INFO.version}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setAboutVisible(false)}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
              ]}>
              <Text style={styles.submitLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionCentered: {
    alignItems: 'center',
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
  presetsRowCentered: {
    justifyContent: 'center',
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
  aboutButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.navy,
  },
  aboutButtonPressed: {
    opacity: 0.7,
  },
  aboutButtonLabel: {
    color: colors.navy,
    fontWeight: '600',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.cream,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    // Even spacing between every line / element in the card.
    gap: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
  },
  modalDedication: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.navy,
    opacity: 0.75,
    textAlign: 'center',
  },
  modalRule: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.navy,
    opacity: 0.15,
  },
  modalBody: {
    fontSize: 16,
    color: colors.navy,
    textAlign: 'center',
  },
  modalLink: {
    color: colors.teal,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalVersion: {
    fontSize: 14,
    color: colors.navy,
    opacity: 0.6,
    marginTop: 4,
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
    fontSize: 16,
    fontWeight: '700',
  },
});
