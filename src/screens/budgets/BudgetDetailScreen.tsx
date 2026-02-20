/**
 * BudgetDetailScreen — category breakdown, spending vs budget, month navigation.
 *
 * Mirrors web's budgets/[id] page: multi-category support, date-range analytics.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Pencil,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import type { Transaction, Budget, Category } from '@/types/db-types';
import {
  budgetService,
  transactionService,
  categoryService,
  getHouseholdId,
} from '@/lib/localdb-services';
import {
  ScreenHeader,
  HeroCard,
  GlassCard,
  SectionHeader,
  EmptyState,
  SkeletonCard,
  SkeletonRow,
  AnimatedPressable,
  Badge,
} from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetDetail'>;

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Component ───────────────────────────────────────────────────────────────

export function BudgetDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const [b, txs, cats] = await Promise.all([
        budgetService.getById(id),
        transactionService.getAll(householdId),
        categoryService.getAll(householdId),
      ]);
      if (!b) return;
      setBudget(b);
      setAllTransactions(txs);
      setCategories(cats);

      if (b.budgetMode === 'EVENT' && b.startDate) {
        setViewDate(new Date(b.startDate));
      }
    } catch (e) {
      console.error('[BudgetDetail] fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ── Derived analytics ──────────────────────────────────────────────────────

  const analytics = useMemo(() => {
    if (!budget) return null;

    let start: Date;
    let end: Date;

    if (budget.budgetMode === 'EVENT' && budget.startDate && budget.endDate) {
      start = new Date(budget.startDate);
      end = new Date(budget.endDate);
    } else {
      start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const expenses = allTransactions.filter((t) => {
      if (t.type !== 'EXPENSE') return false;
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);

    // Category breakdown
    const breakdownMap = new Map<
      string,
      { id: string; name: string; color: string; limit: number; spent: number }
    >();

    if (budget.budgetLimitConfig?.length) {
      budget.budgetLimitConfig.forEach((lim) => {
        const cat = categories.find((c) => c.id === lim.categoryId);
        breakdownMap.set(lim.categoryId, {
          id: lim.categoryId,
          name: cat?.name || 'Unknown',
          color: cat?.color || '#64748b',
          limit: lim.amount,
          spent: 0,
        });
      });
    }

    expenses.forEach((t) => {
      const catId = t.categoryId || 'uncategorized';
      if (!breakdownMap.has(catId)) {
        const cat = categories.find((c) => c.id === catId);
        breakdownMap.set(catId, {
          id: catId,
          name: cat?.name || 'Uncategorized',
          color: cat?.color || '#94a3b8',
          limit: 0,
          spent: 0,
        });
      }
      breakdownMap.get(catId)!.spent += t.amount;
    });

    const breakdown = Array.from(breakdownMap.values()).sort(
      (a, b) => b.spent - a.spent,
    );

    const totalBudget = budget.totalBudget || 0;
    const remaining = totalBudget - totalSpent;
    const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { totalSpent, totalBudget, remaining, pct, breakdown, start, end };
  }, [budget, allTransactions, categories, viewDate]);

  // ── Month nav ──────────────────────────────────────────────────────────────

  const prevMonth = () => {
    Haptics.selectionAsync();
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    Haptics.selectionAsync();
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const isEvent = budget?.budgetMode === 'EVENT';

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Budget" showBack />
        <View style={styles.content}>
          <SkeletonCard style={{ marginBottom: SPACING.lg }} />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  if (!budget || !analytics) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Budget" showBack />
        <EmptyState
          title="Budget not found"
          icon={<Target size={ICON_SIZE.xl} color={COLORS.textTertiary} />}
        />
      </View>
    );
  }

  const overBudget = analytics.remaining < 0;
  const heroColor = overBudget ? COLORS.error : COLORS.income;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={budget.name}
        showBack
        rightAction={
          <AnimatedPressable
            onPress={() => navigation.navigate('BudgetPlan', { id })}
            style={{ padding: SPACING.xs }}
          >
            <Pencil size={20} color={COLORS.primaryLight} />
          </AnimatedPressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />
        }
      >
        {/* Month Navigation (not for EVENT budgets) */}
        {!isEvent && (
          <View style={styles.monthNav}>
            <AnimatedPressable onPress={prevMonth}>
              <ChevronLeft size={24} color={COLORS.textSecondary} />
            </AnimatedPressable>
            <Text style={styles.monthLabel}>
              {viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
            <AnimatedPressable onPress={nextMonth}>
              <ChevronRight size={24} color={COLORS.textSecondary} />
            </AnimatedPressable>
          </View>
        )}

        {/* Hero */}
        <HeroCard
          label="Spent"
          amount={fmt(analytics.totalSpent)}
          subtitle={`of ${fmt(analytics.totalBudget)} budget`}
          icon={<Target size={ICON_SIZE.lg} color="#fff" />}
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Progress bar */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {overBudget ? 'Over budget' : 'Remaining'}
            </Text>
            <Text style={[styles.progressPct, { color: heroColor }]}>
              {overBudget ? `−${fmt(Math.abs(analytics.remaining))}` : fmt(analytics.remaining)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, analytics.pct)}%` as any,
                  backgroundColor: overBudget ? COLORS.error : COLORS.income,
                },
              ]}
            />
          </View>
          <Text style={styles.progressSub}>{analytics.pct.toFixed(0)}% used</Text>

          {overBudget && (
            <View style={styles.warningRow}>
              <AlertTriangle size={14} color={COLORS.error} />
              <Text style={styles.warningText}>
                Over by {fmt(Math.abs(analytics.remaining))}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Category Breakdown */}
        <SectionHeader title="Category Breakdown" />
        {analytics.breakdown.length === 0 ? (
          <GlassCard padding="lg">
            <Text style={styles.emptyText}>No spending recorded</Text>
          </GlassCard>
        ) : (
          <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
            {analytics.breakdown.map((cat, idx) => {
              const catPct = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
              const catOver = cat.limit > 0 && cat.spent > cat.limit;
              return (
                <View
                  key={cat.id}
                  style={[
                    styles.catRow,
                    idx < analytics.breakdown.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: COLORS.border,
                    },
                  ]}
                >
                  <View style={styles.catHeader}>
                    <View style={styles.catNameRow}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.catName}>{cat.name}</Text>
                    </View>
                    <Text style={styles.catSpent}>
                      {fmt(cat.spent)}
                      {cat.limit > 0 ? ` / ${fmt(cat.limit)}` : ''}
                    </Text>
                  </View>
                  {cat.limit > 0 && (
                    <View style={styles.catBar}>
                      <View
                        style={[
                          styles.catBarFill,
                          {
                            width: `${Math.min(100, catPct)}%` as any,
                            backgroundColor: catOver ? COLORS.error : cat.color,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </GlassCard>
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  monthLabel: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.textPrimary },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  progressPct: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: COLORS.white5, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: SPACING.xs },

  warningRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  warningText: { fontSize: FONT_SIZE.xs, color: COLORS.error, fontWeight: '600' },

  catRow: { padding: SPACING.lg },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  catNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  catSpent: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '600' },
  catBar: { height: 6, backgroundColor: COLORS.white5, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  catBarFill: { height: '100%', borderRadius: 3 },

  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: 'center' },
});
