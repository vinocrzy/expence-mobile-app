/**
 * BudgetsScreen — budget list with progress bars.
 *
 * Active budgets with spent-vs-total progress, over-budget warnings.
 * Mirrors web's budgets/page.tsx.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Target,
  Flag,
  AlertTriangle,
  Plus,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, ICON_SIZE, BORDER_RADIUS } from '@/constants';
import type { MoreStackParamList } from '@/navigation/types';
import type { Transaction, Budget } from '@/types/db-types';
import { useBudgets, useTransactions } from '@/hooks/useLocalData';
import { BudgetCreateModal } from '@/components/BudgetCreateModal';
import {
  GlassCard,
  Badge,
  ScreenHeader,
  EmptyState,
  SkeletonCard,
  AnimatedPressable,
  IconCircle,
} from '@/components/ui';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Calculate spent for a budget ────────────────────────────────────────────

function calculateSpent(budget: Budget, transactions: Transaction[]): number {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (budget.budgetMode === 'EVENT') {
    start = budget.startDate ? new Date(budget.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    end = budget.endDate ? new Date(budget.endDate) : now;
  } else {
    // Monthly: current month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const categoryIds = budget.budgetLimitConfig?.map((c) => c.categoryId) || [];

  return transactions
    .filter((t) => {
      if (t.type !== 'EXPENSE') return false;
      const d = new Date(t.date);
      if (d < start || d > end) return false;
      if (categoryIds.length > 0 && !categoryIds.includes(t.categoryId || '')) return false;
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BudgetsScreen() {
  const navigation = useNavigation<Nav>();
  const { budgets, loading: budgetsLoading, refresh: refreshBudgets, addBudget } = useBudgets();
  const { transactions, loading: txLoading } = useTransactions();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const loading = budgetsLoading || txLoading;

  // Active budgets with spent calculation
  const activeBudgets = useMemo(() => {
    return budgets
      .filter((b) => !b.isArchived && b.status === 'ACTIVE')
      .map((b) => ({
        ...b,
        spent: calculateSpent(b, transactions),
      }));
  }, [budgets, transactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBudgets();
    setRefreshing(false);
  }, [refreshBudgets]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Budgets"
        subtitle="Spending limits & goals"
        rightAction={
          <Pressable onPress={() => setShowCreateModal(true)} hitSlop={8}>
            <Plus size={24} color={COLORS.primaryLight} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryLight}
            colors={[COLORS.primaryLight]}
          />
        }
      >
      {/* Loading */}
      {loading ? (
        <>
          <SkeletonCard style={{ marginBottom: SPACING.md }} />
          <SkeletonCard />
        </>
      ) : activeBudgets.length === 0 ? (
        /* Empty */
        <EmptyState
          icon={<Target size={48} color={COLORS.textTertiary} />}
          title="No active budgets"
          description="Create a budget to start tracking your spending limits."
        />
      ) : (
        /* Budget Cards */
        activeBudgets.map((budget) => {
          const total = budget.totalBudget || 0;
          const percent = total > 0 ? (budget.spent / total) * 100 : 0;
          const isOver = percent > 100;
          const excess = budget.spent - total;

          return (
            <AnimatedPressable
              key={budget.id}
              onPress={() =>
                navigation.navigate('BudgetDetail', { id: budget.id })
              }
              scaleDown={0.98}
              style={{ marginBottom: SPACING.md }}
            >
              <GlassCard padding="lg">
                {/* Header */}
                <View style={styles.cardHeader}>
                  <IconCircle
                    variant={budget.budgetMode === 'EVENT' ? 'warning' : 'primary'}
                    size={40}
                  >
                    {budget.budgetMode === 'EVENT' ? (
                      <Flag size={20} color={COLORS.warning} />
                    ) : (
                      <Target size={20} color={COLORS.primaryLight} />
                    )}
                  </IconCircle>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.budgetName}>{budget.name}</Text>
                    <Badge
                      label={budget.budgetMode === 'EVENT' ? 'One-time Event' : 'Monthly'}
                      color="info"
                    />
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.percentText}>
                      {Math.round(percent)}%
                    </Text>
                    <Text style={styles.spentText}>
                      {fmt(budget.spent)} / {fmt(total)}
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={
                        isOver
                          ? [COLORS.error, '#dc2626']
                          : [COLORS.heroGradientStart, COLORS.heroGradientEnd]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(percent, 100)}%` as any },
                      ]}
                    />
                  </View>

                  {/* Over budget warning */}
                  {isOver && (
                    <View style={styles.overBudget}>
                      <AlertTriangle size={14} color={COLORS.error} />
                      <Text style={styles.overBudgetText}>
                        Exceeded by {fmt(excess)}
                      </Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            </AnimatedPressable>
          );
        })
      )}

      {/* Bottom spacer */}
      <View style={{ height: 120 }} />
      </ScrollView>

      {/* Create Budget Modal */}
      <BudgetCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          await addBudget(data);
        }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardHeaderText: {
    flex: 1,
    gap: SPACING.xs,
  },
  budgetName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressSection: {
    gap: SPACING.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  percentText: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  spentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.white5,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  overBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  overBudgetText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    fontWeight: '600',
  },
});
