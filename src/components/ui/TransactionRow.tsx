/**
 * TransactionRow — single transaction list item.
 *
 * Matches web TransactionCard:
 *   glass-panel, icon circle, title + amount, meta line (account • category • date).
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { IconCircle } from './IconCircle';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  TrendingUp,
  CreditCard,
} from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT' | 'DEBT';

interface TransactionRowProps {
  title: string;
  amount: string;
  type: TransactionType;
  category?: string;
  account?: string;
  date?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ─── Icon + color map ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  TransactionType,
  { icon: React.ReactNode; color: string; variant: 'income' | 'expense' | 'transfer' | 'investment' | 'debt'; prefix: string }
> = {
  INCOME: {
    icon: <ArrowDownLeft size={ICON_SIZE.lg} color={COLORS.income} />,
    color: COLORS.income,
    variant: 'income',
    prefix: '+',
  },
  EXPENSE: {
    icon: <ArrowUpRight size={ICON_SIZE.lg} color={COLORS.expense} />,
    color: COLORS.textPrimary,
    variant: 'expense',
    prefix: '-',
  },
  TRANSFER: {
    icon: <ArrowRightLeft size={ICON_SIZE.lg} color={COLORS.transfer} />,
    color: COLORS.transfer,
    variant: 'transfer',
    prefix: '',
  },
  INVESTMENT: {
    icon: <TrendingUp size={ICON_SIZE.lg} color={COLORS.investment} />,
    color: COLORS.investment,
    variant: 'investment',
    prefix: '-',
  },
  DEBT: {
    icon: <CreditCard size={ICON_SIZE.lg} color={COLORS.debt} />,
    color: COLORS.debt,
    variant: 'debt',
    prefix: '-',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const TransactionRow = React.memo(function TransactionRow({
  title,
  amount,
  type,
  category,
  account,
  date,
  onPress,
  onLongPress,
  style,
}: TransactionRowProps) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.EXPENSE;

  // Build meta parts: account • category • date
  const meta = [account, category, date].filter(Boolean).join(' • ');

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      scaleDown={0.98}
      style={[styles.container, style]}
    >
      {/* Icon */}
      <IconCircle variant={cfg.variant} size={48}>
        {cfg.icon}
      </IconCircle>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.amount, { color: cfg.color }]}>
            {cfg.prefix}
            {amount}
          </Text>
        </View>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 3,
  },
});

TransactionRow.displayName = 'TransactionRow';
