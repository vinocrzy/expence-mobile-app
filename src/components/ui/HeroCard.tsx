/**
 * HeroCard — gradient balance card for the dashboard.
 *
 * Matches web: gradient blue-600→purple-600, rounded-3xl, decorative blur circle.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface HeroCardProps {
  label: string;
  amount: string;
  subtitle?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function HeroCard({
  label,
  amount,
  subtitle,
  icon,
  style,
}: HeroCardProps) {
  return (
    <LinearGradient
      colors={[COLORS.heroGradientStart, COLORS.heroGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {/* Decorative circle */}
      <View style={styles.decor} />

      {/* Icon badge */}
      {icon && (
        <View style={styles.iconBadge}>{icon}</View>
      )}

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Amount */}
      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </Text>

      {/* Subtitle pill */}
      {subtitle && (
        <View style={styles.subtitleWrap}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS['3xl'],
    padding: SPACING['2xl'],
    minHeight: 180,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  decor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconBadge: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  amount: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: '700',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    marginTop: SPACING.xs,
  },
  subtitleWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
});
