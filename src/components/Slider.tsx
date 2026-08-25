import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { colors } from '../theme/colors';

const THUMB_SIZE = 28;

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  accessibilityLabel?: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function Slider({
  value,
  onValueChange,
  accessibilityLabel,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTouch = (event: GestureResponderEvent) => {
    if (trackWidth <= 0) {
      return;
    }
    onValueChange(clamp01(event.nativeEvent.locationX / trackWidth));
  };

  const percent = `${clamp01(value) * 100}%` as const;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={styles.track}
      onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}>
      <View style={styles.trackBackground} />
      <View style={[styles.fill, { width: percent }]} />
      <View
        style={[
          styles.thumb,
          { left: percent, marginLeft: -THUMB_SIZE / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 44,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00000022',
  },
  fill: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.teal,
    borderWidth: 3,
    borderColor: 'white',
  },
});
