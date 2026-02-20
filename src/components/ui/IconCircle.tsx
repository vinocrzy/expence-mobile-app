/**
 * IconCircle — colored circle container for icons.
 * Matches web patterns: bg-{color}-500/10 rounded-full
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { COLORS } from '@/constants';

type Variant = 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'primary' | 'warning' | 'info' | 'muted';

interface IconCircleProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Custom bg/border override */
  bg?: string;
  borderColor?: string;
}

const VARIANT_MAP: Record<Variant, { bg: string; border: string }> = {
  income: { bg: COLORS.incomeBg, border: 'rgba(16,185,129,0.2)' },
  expense: { bg: COLORS.expenseBg, border: 'rgba(244,63,94,0.2)' },
  transfer: { bg: COLORS.transferBg, border: 'rgba(59,130,246,0.2)' },
  investment: { bg: COLORS.investmentBg, border: 'rgba(245,158,11,0.2)' },
  debt: { bg: COLORS.debtBg, border: 'rgba(168,85,247,0.2)' },
  primary: { bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  muted: { bg: COLORS.white5, border: COLORS.border },
};

export function IconCircle({
  children,
  variant = 'muted',
  size = 44,
  style,
  bg,
  borderColor,
}: IconCircleProps) {
  const v = VARIANT_MAP[variant];

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg ?? v.bg,
          borderColor: borderColor ?? v.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
