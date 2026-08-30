import React from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { colors } from '../theme/colors';

// Semantic name → Material Design Icons glyph. Screens ask for `back` /
// `parents`, not for a specific icon-set glyph, so the icon set can be
// swapped in one place. The font is registered natively:
// Android `android/app/src/main/assets/fonts/MaterialDesignIcons.ttf`,
// iOS via the package's podspec + `UIAppFonts` in Info.plist.
const GLYPHS = {
  back: 'chevron-left',
  next: 'chevron-right',
  parents: 'account-supervisor',
  settings: 'cog',
  volumeOn: 'volume-high',
  volumeOff: 'volume-off',
  close: 'close',
} as const;

export type IconName = keyof typeof GLYPHS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * A single glyph. Purely decorative — every place it's used sits inside an
 * already-labelled `Pressable`, so it's hidden from screen readers here.
 */
export function Icon({ name, size = 24, color = colors.navy }: IconProps) {
  return (
    <MaterialDesignIcons
      name={GLYPHS[name]}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
