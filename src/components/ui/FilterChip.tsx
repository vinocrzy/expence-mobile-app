/**
 * FilterChip — selectable chip for filter drawers.
 *
 * Variants:
 *   selected: bg-purple-500/20 border-purple-500/50 text-purple-300
 *   unselected: bg-gray-800 border-gray-700 text-gray-400
 */

import React from 'react';
import { Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: 'purple' | 'blue';
  style?: StyleProp<ViewStyle>;
}

const CHIP_COLORS = {
  purple: {
    bg: 'rgba(147,51,234,0.2)',
    border: 'rgba(147,51,234,0.5)',
    text: '#d8b4fe', // purple-300
  },
  blue: {
    bg: 'rgba(59,130,246,0.2)',
    border: 'rgba(59,130,246,0.5)',
    text: '#93c5fd', // blue-300
  },
};

export function FilterChip({
  label,
  selected = false,
  onPress,
  color = 'purple',
  style,
}: FilterChipProps) {
  const c = CHIP_COLORS[color];

  return (
    <AnimatedPressable
      onPress={onPress}
      scaleDown={0.95}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: c.bg, borderColor: c.border }
          : styles.chipInactive,
        style,
      ]}
    >
      <Text style={[styles.text, { color: selected ? c.text : COLORS.textTertiary }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: 'rgba(55,65,81,1)', // gray-700
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});
