/**
 * QuickActionSheet — bottom sheet for "Add" FAB,
 * matching web's QuickActionSheet.
 *
 * 3-col grid of icon buttons: Expense, Income, Transfer, Pay EMI, Pay Card, Subscribe.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CalendarClock,
  CreditCard,
  RotateCcw,
} from 'lucide-react-native';
import { BottomSheetModal } from './BottomSheetModal';
import { AnimatedPressable } from './AnimatedPressable';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuickAction =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'PAY_EMI'
  | 'PAY_CARD'
  | 'SUBSCRIBE';

interface Action {
  key: QuickAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: QuickAction) => void;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

const ACTIONS: Action[] = [
  {
    key: 'EXPENSE',
    label: 'Expense',
    icon: <ArrowUpRight size={ICON_SIZE.xl} color={COLORS.expense} />,
    color: COLORS.expense,
    bg: 'rgba(244,63,94,0.15)',
  },
  {
    key: 'INCOME',
    label: 'Income',
    icon: <ArrowDownLeft size={ICON_SIZE.xl} color={COLORS.income} />,
    color: COLORS.income,
    bg: 'rgba(16,185,129,0.15)',
  },
  {
    key: 'TRANSFER',
    label: 'Transfer',
    icon: <ArrowRightLeft size={ICON_SIZE.xl} color={COLORS.transfer} />,
    color: COLORS.transfer,
    bg: 'rgba(59,130,246,0.15)',
  },
  {
    key: 'PAY_EMI',
    label: 'Pay EMI',
    icon: <CalendarClock size={ICON_SIZE.xl} color={COLORS.warning} />,
    color: COLORS.warning,
    bg: 'rgba(245,158,11,0.15)',
  },
  {
    key: 'PAY_CARD',
    label: 'Pay Card',
    icon: <CreditCard size={ICON_SIZE.xl} color={COLORS.debt} />,
    color: COLORS.debt,
    bg: 'rgba(168,85,247,0.15)',
  },
  {
    key: 'SUBSCRIBE',
    label: 'Subscribe',
    icon: <RotateCcw size={ICON_SIZE.xl} color="#06b6d4" />, // cyan-500
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.15)',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function QuickActionSheet({
  visible,
  onClose,
  onAction,
}: QuickActionSheetProps) {
  const handleAction = (action: QuickAction) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction(action);
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Quick Actions"
      maxHeightRatio={0.45}
    >
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <AnimatedPressable
            key={action.key}
            onPress={() => handleAction(action.key)}
            scaleDown={0.92}
            style={styles.actionWrap}
          >
            <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
              {action.icon}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </BottomSheetModal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  actionWrap: {
    width: '30%',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
