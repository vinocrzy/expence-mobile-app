/**
 * GlassCard — glassmorphism card matching web's `.glass-panel`.
 *
 * bg: rgba(28,28,30,0.8)  border: rgba(255,255,255,0.05)
 * rounded-3xl (24px)
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof SPACING | number;
  noBorder?: boolean;
}

export function GlassCard({
  children,
  style,
  padding = 'lg',
  noBorder = false,
}: GlassCardProps) {
  const pad = typeof padding === 'number' ? padding : SPACING[padding];

  return (
    <View
      style={[
        styles.card,
        { padding: pad },
        noBorder && styles.noBorder,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: BORDER_RADIUS['3xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noBorder: {
    borderWidth: 0,
  },
});
