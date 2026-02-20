/**
 * FilterBar — horizontal scrollable filter row.
 *
 * Renders filter toggle button + type pills (All, Income, Expense, etc.)
 * Matches web: overflow-x-auto, rounded-full pills, active=white on black.
 */

import React from 'react';
import { ScrollView, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Button } from './Button';
import { SPACING } from '@/constants';

interface FilterItem {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterItem[];
  selected: string;
  onSelect: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function FilterBar({
  filters,
  selected,
  onSelect,
  style,
}: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, style]}
      style={styles.scroll}
    >
      {filters.map((item) => (
        <Button
          key={item.value}
          title={item.label}
          variant="pill"
          size="sm"
          active={item.value === selected}
          onPress={() => onSelect(item.value)}
          style={styles.pill}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  pill: {
    // pills handle their own styling via Button variant="pill"
  },
});
