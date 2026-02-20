/**
 * Badge — small label chip for status, counts, or tags.
 *
 * Variants:
 *   default  – subtle background
 *   status   – color-coded (success, warning, error, info)
 *   count    – circular number badge
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

type StatusColor = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  color?: StatusColor;
  variant?: 'default' | 'count';
  style?: StyleProp<ViewStyle>;
}

const COLOR_MAP: Record<StatusColor, { bg: string; text: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', text: COLORS.success },
  warning: { bg: 'rgba(245,158,11,0.15)', text: COLORS.warning },
  error: { bg: 'rgba(239,68,68,0.15)', text: COLORS.error },
  info: { bg: 'rgba(59,130,246,0.15)', text: COLORS.info },
  neutral: { bg: COLORS.white5, text: COLORS.textSecondary },
};

export function Badge({
  label,
  color = 'neutral',
  variant = 'default',
  style,
}: BadgeProps) {
  const c = COLOR_MAP[color];

  if (variant === 'count') {
    return (
      <View style={[styles.countBadge, { backgroundColor: c.bg }, style]}>
        <Text style={[styles.countText, { color: c.text }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  countBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
