/**
 * Divider — thin horizontal rule, matching web's `border-white/5`.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS, SPACING } from '@/constants';

interface DividerProps {
  style?: StyleProp<ViewStyle>;
  /** Vertical space above and below */
  spacing?: number;
  color?: string;
}

export function Divider({
  style,
  spacing = SPACING.md,
  color = COLORS.border,
}: DividerProps) {
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: color, marginVertical: spacing },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
