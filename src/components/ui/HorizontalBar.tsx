/**
 * HorizontalBar — simple horizontal bar pair for comparison.
 *
 * Used in Analytics for "This Month vs Last Month".
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

export interface HBarItem {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarProps {
  items: HBarItem[];
  formatValue?: (v: number) => string;
}

const defaultFmt = (v: number) =>
  `₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function HorizontalBar({ items, formatValue = defaultFmt }: HorizontalBarProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <View style={styles.container}>
      {items.map((item, idx) => {
        const pct = Math.min((item.value / max) * 100, 100);
        return (
          <View key={idx} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(pct, 2)}%`, backgroundColor: item.color },
                ]}
              />
            </View>
            <Text style={styles.value}>{formatValue(item.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    width: 36,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  track: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.white5,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  value: {
    width: 72,
    textAlign: 'right',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
