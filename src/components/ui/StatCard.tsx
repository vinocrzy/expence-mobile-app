/**
 * StatCard — small stat card for the dashboard horizontal scroller.
 *
 * Matches web's StatCard: glass-panel, top-right icon badge, label + value.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { GlassCard } from './GlassCard';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconBorder?: string;
  style?: StyleProp<ViewStyle>;
  /** Optional trend indicator */
  trend?: string;
  trendColor?: string;
}

export const StatCard = React.memo(function StatCard({
  label,
  value,
  icon,
  iconBg = COLORS.white5,
  iconBorder = COLORS.border,
  style,
  trend,
  trendColor = COLORS.textTertiary,
}: StatCardProps) {
  return (
    <GlassCard padding="lg" style={[styles.card, style]}>
      {/* Icon badge — top right */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }} />
        <View style={[styles.iconBadge, { backgroundColor: iconBg, borderColor: iconBorder }]}>
          {icon}
        </View>
      </View>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Value */}
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      {/* Trend */}
      {trend && (
        <Text style={[styles.trend, { color: trendColor }]}>{trend}</Text>
      )}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    minHeight: 140,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: SPACING.xs,
  },
  trend: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    marginTop: 2,
  },
});

StatCard.displayName = 'StatCard';
