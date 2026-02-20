/**
 * SegmentedControl — type toggle matching web's transaction-type selector.
 *
 * Two rows: primary (2-col EXPENSE/INCOME) and secondary (3-col TRANSFER/INVESTMENT/DEBT).
 * Active state: colored bg + ring, Inactive: dark bg + gray text.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Segment<T extends string = string> {
  value: T;
  label: string;
  color?: string;       // active text/ring color
  bgColor?: string;     // active background color
}

interface SegmentedControlProps<T extends string = string> {
  segments: Segment<T>[];
  selected: T;
  onSelect: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  /** Number of columns (auto-detected if not set) */
  columns?: number;
  size?: 'sm' | 'md';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SegmentedControl<T extends string = string>({
  segments,
  selected,
  onSelect,
  style,
  columns,
  size = 'md',
}: SegmentedControlProps<T>) {
  const cols = columns ?? segments.length;

  const handleSelect = (value: T) => {
    if (value !== selected) {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      onSelect(value);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {segments.map((seg) => {
          const isActive = seg.value === selected;
          const activeColor = seg.color ?? COLORS.primaryLight;
          const activeBg = seg.bgColor ?? 'rgba(59,130,246,0.2)';

          return (
            <AnimatedPressable
              key={seg.value}
              onPress={() => handleSelect(seg.value)}
              scaleDown={0.95}
              style={[
                styles.segment,
                { width: `${100 / cols}%` as any },
                size === 'sm' && styles.segmentSm,
                isActive && {
                  backgroundColor: activeBg,
                  borderColor: activeColor + '80', // 50% opacity ring
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  size === 'sm' && styles.segmentTextSm,
                  { color: isActive ? activeColor : COLORS.textMuted },
                ]}
              >
                {seg.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(24,24,27,0.5)', // zinc-900/50
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
  },
  segment: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentSm: {
    paddingVertical: SPACING.sm,
  },
  segmentText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  segmentTextSm: {
    fontSize: FONT_SIZE.xs,
  },
});
