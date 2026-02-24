/**
 * AnalyticsScreen — spending insights, charts and category breakdown.
 *
 * Range toggle (1M / 3M / 1Y), summary stats, income vs expense bar chart,
 * month-over-month comparison, expense donut by category.
 * Mirrors web's analytics/page.tsx.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  Layers,
  Activity,
  PieChart as PieIcon,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import { useTransactions, useCategories } from '@/hooks/useLocalData';
import {
  ScreenHeader,
  SegmentedControl,
  GlassCard,
  StatCard,
  SkeletonCard,
  EmptyState,
  DonutChart,
  MiniBarChart,
  HorizontalBar,
  type Segment,
  type DonutSlice,
  type BarGroup,
  type HBarItem,
} from '@/components/ui';

// ─── Range segments ──────────────────────────────────────────────────────────

type RangeKey = 'MONTH' | 'QUARTER' | 'YEAR';

const RANGE_SEGMENTS: Segment<RangeKey>[] = [
  { value: 'MONTH', label: '1M', color: COLORS.primaryLight, bgColor: 'rgba(59,130,246,0.15)' },
  { value: 'QUARTER', label: '3M', color: COLORS.primaryLight, bgColor: 'rgba(59,130,246,0.15)' },
  { value: 'YEAR', label: '1Y', color: COLORS.primaryLight, bgColor: 'rgba(59,130,246,0.15)' },
];

const CHART_COLORS = [
  '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#06b6d4',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmtK = (n: number) => {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return fmt(n);
};

const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(m, 10) - 1] || key;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsScreen() {
  const [range, setRange] = useState<RangeKey>('MONTH');

  const months = range === 'YEAR' ? 12 : range === 'QUARTER' ? 3 : 1;

  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const loading = txLoading || catLoading;

  // ── Date range ─────────────────────────────────────────────────────────────

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [months]);

  // ── Monthly trend data ─────────────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number; investment: number; debt: number }> = {};

    // Seed month keys
    const cur = new Date(dateRange.start);
    while (cur <= dateRange.end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { income: 0, expense: 0, investment: 0, debt: 0 };
      cur.setMonth(cur.getMonth() + 1);
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d < dateRange.start || d > dateRange.end) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) return;
      if (t.type === 'INCOME') map[key].income += t.amount;
      else if (t.type === 'EXPENSE') map[key].expense += t.amount;
      else if (t.type === 'INVESTMENT') map[key].investment += t.amount;
      else if (t.type === 'DEBT') map[key].debt += t.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, stats]) => ({ month: key, ...stats }));
  }, [transactions, dateRange]);

  // ── Summary stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expense: acc.expense + m.expense,
        investment: acc.investment + m.investment,
        debt: acc.debt + m.debt,
        net: acc.net + (m.income - m.expense),
      }),
      { income: 0, expense: 0, investment: 0, debt: 0, net: 0 },
    );
  }, [monthlyData]);

  const savingsRate = stats.income > 0 ? ((stats.net / stats.income) * 100) : 0;

  // ── Category breakdown (expenses only) ─────────────────────────────────────

  const categoryData = useMemo(() => {
    const catLookup = new Map(categories.map((c) => [c.id, c]));
    const catMap = new Map<string, number>();

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d < dateRange.start || d > dateRange.end) return;
      if (t.type !== 'EXPENSE') return;

      const processEntry = (catId: string, amount: number) => {
        const cat = catLookup.get(catId);
        if (cat && (cat.type === 'INVESTMENT' || cat.type === 'DEBT')) return;
        const name = cat?.name || 'Uncategorized';
        catMap.set(name, (catMap.get(name) || 0) + amount);
      };

      if (t.isSplit && t.splits) {
        t.splits.forEach((s) => processEntry(s.categoryId, s.amount));
      } else {
        processEntry(t.categoryId || '', t.amount);
      }
    });

    return Array.from(catMap.entries())
      .map(([name, value], i) => {
        const cat = categories.find((c) => c.name === name);
        return { name, value, color: cat?.color || CHART_COLORS[i % CHART_COLORS.length] };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, dateRange]);

  const totalExpenseFromCats = categoryData.reduce((s, d) => s + d.value, 0);

  // ── Month comparison ───────────────────────────────────────────────────────

  const comparison = useMemo((): HBarItem[] => {
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;

    let thisMonth = 0;
    let lastMonth = 0;

    transactions.forEach((t) => {
      if (t.type !== 'EXPENSE') return;
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k === thisKey) thisMonth += t.amount;
      else if (k === lastKey) lastMonth += t.amount;
    });

    return [
      { label: 'Last', value: lastMonth, color: '#6b7280' },
      { label: 'This', value: thisMonth, color: thisMonth > lastMonth ? COLORS.expense : COLORS.income },
    ];
  }, [transactions]);

  // ── Bar chart data ─────────────────────────────────────────────────────────

  const barGroups: BarGroup[] = useMemo(
    () =>
      monthlyData.map((m) => ({
        label: monthLabel(m.month),
        bars: [
          { value: m.income, color: COLORS.income },
          { value: m.expense, color: COLORS.expense },
        ],
      })),
    [monthlyData],
  );

  // ── Donut slices ───────────────────────────────────────────────────────────

  const donutSlices: DonutSlice[] = useMemo(
    () => categoryData.map((d) => ({ label: d.name, value: d.value, color: d.color })),
    [categoryData],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Analytics" />
        <View style={styles.content}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Analytics" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Range toggle */}
        <SegmentedControl<RangeKey>
          segments={RANGE_SEGMENTS}
          selected={range}
          onSelect={setRange}
          size="sm"
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Summary grid (2×3) */}
        <View style={styles.statGrid}>
          <StatCard
            label="Income"
            value={fmtK(stats.income)}
            icon={<TrendingUp size={14} color={COLORS.income} />}
            style={styles.statHalf}
          />
          <StatCard
            label="Expense"
            value={fmtK(stats.expense)}
            icon={<TrendingDown size={14} color={COLORS.expense} />}
            style={styles.statHalf}
          />
          <StatCard
            label="Investments"
            value={fmtK(stats.investment)}
            icon={<PiggyBank size={14} color={COLORS.investment} />}
            style={styles.statHalf}
          />
          <StatCard
            label="Debt Paid"
            value={fmtK(stats.debt)}
            icon={<Landmark size={14} color={COLORS.debt} />}
            style={styles.statHalf}
          />
          <StatCard
            label="Net Savings"
            value={fmtK(stats.net)}
            icon={<Layers size={14} color={stats.net >= 0 ? COLORS.primaryLight : COLORS.warning} />}
            style={styles.statHalf}
          />
          <GlassCard padding="md" style={styles.statHalf}>
            <Text style={styles.savingsLabel}>Savings Rate</Text>
            <Text style={[styles.savingsValue, { color: COLORS.debt }]}>
              {savingsRate.toFixed(0)}%
            </Text>
          </GlassCard>
        </View>

        {/* Income vs Expense bar chart */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.chartHeader}>
            <Activity size={14} color={COLORS.primaryLight} />
            <Text style={styles.chartTitle}>Income vs Expense</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.income }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
          </View>
          {barGroups.length > 0 ? (
            <MiniBarChart data={barGroups} height={160} />
          ) : (
            <Text style={styles.noData}>No transactions</Text>
          )}
        </GlassCard>

        {/* Month comparison */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.chartHeader}>
            <Activity size={14} color={COLORS.debt} />
            <Text style={styles.chartTitle}>vs Last Month</Text>
          </View>
          <HorizontalBar items={comparison} />
        </GlassCard>

        {/* Category donut */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.chartHeader}>
            <PieIcon size={14} color="#ec4899" />
            <Text style={styles.chartTitle}>Expense Breakdown</Text>
          </View>

          {donutSlices.length > 0 ? (
            <>
              <DonutChart
                data={donutSlices}
                size={180}
                strokeWidth={24}
                centerValue={fmtK(totalExpenseFromCats)}
                centerLabel="Total"
              />

              {/* Category list */}
              <View style={styles.catList}>
                {categoryData.map((cat, i) => {
                  const pct = totalExpenseFromCats > 0 ? ((cat.value / totalExpenseFromCats) * 100).toFixed(0) : '0';
                  return (
                    <View key={cat.name} style={styles.catRow}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                      <Text style={styles.catAmount}>{fmt(cat.value)}</Text>
                      <Text style={styles.catPct}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <EmptyState
              title="No expense data"
              icon={<PieIcon size={ICON_SIZE.xl} color={COLORS.textTertiary} />}
            />
          )}
        </GlassCard>

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 120 },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statHalf: {
    width: '48%',
    flexGrow: 1,
  },

  savingsLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  savingsValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.xs,
    textAlign: 'right',
  },

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  legendRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },

  noData: {
    textAlign: 'center',
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.sm,
    paddingVertical: SPACING.xl,
  },

  catList: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  catAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catPct: {
    width: 36,
    textAlign: 'right',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    backgroundColor: COLORS.white5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
});
