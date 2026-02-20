/**
 * DashboardScreen — main home screen.
 *
 * Hero balance card, horizontal stats row, recent transactions,
 * upcoming payments. Mirrors web's dashboard/page.tsx.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CalendarClock,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, ICON_SIZE, BORDER_RADIUS } from '@/constants';
import { getTransactionColor } from '@/constants/colors';
import type { RootStackParamList } from '@/navigation/types';
import type { Transaction, Account, CreditCard, Loan } from '@/types/db-types';
import {
  useTransactions,
  useAccounts,
  useCreditCards,
  useLoans,
  useCategories,
} from '@/hooks/useLocalData';
import {
  calculateAvailableBalance,
  calculateTotalLiquidCash,
  calculateTotalCreditCardDebt,
  calculateTotalLoanOutstanding,
  calculateTransactionTotal,
} from '@/lib/financial-math';
import {
  HeroCard,
  StatCard,
  SectionHeader,
  TransactionRow,
  GlassCard,
  SkeletonCard,
  SkeletonRow,
  IconCircle,
} from '@/components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const fmtFull = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { transactions, loading: txLoading } = useTransactions();
  const { accounts, loading: accLoading } = useAccounts();
  const { creditCards, loading: ccLoading } = useCreditCards();
  const { loans, loading: loanLoading } = useLoans();
  const { categories } = useCategories();

  const [refreshing, setRefreshing] = useState(false);

  const loading = txLoading || accLoading || ccLoading || loanLoading;

  // ── Derived data ──────────────────────────────────────────────────────────

  const bankAccounts = useMemo(
    () => accounts.filter((a) => a.type !== 'CREDIT_CARD' && !a.isArchived),
    [accounts],
  );

  const activeCards = useMemo(
    () => creditCards.filter((c) => !c.isArchived),
    [creditCards],
  );

  const activeLoans = useMemo(
    () => loans.filter((l) => !l.isArchived),
    [loans],
  );

  const totalCash = useMemo(() => calculateTotalLiquidCash(bankAccounts), [bankAccounts]);
  const totalCCDebt = useMemo(() => calculateTotalCreditCardDebt(activeCards), [activeCards]);
  const availableBalance = useMemo(
    () => calculateAvailableBalance(bankAccounts, activeCards),
    [bankAccounts, activeCards],
  );
  const totalLoanDebt = useMemo(
    () => calculateTotalLoanOutstanding(activeLoans),
    [activeLoans],
  );

  // Last 30 day totals
  const last30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return transactions.filter((t) => new Date(t.date) >= cutoff);
  }, [transactions]);

  const totalIncome = useMemo(() => calculateTransactionTotal(last30, 'INCOME'), [last30]);
  const totalExpense = useMemo(() => calculateTransactionTotal(last30, 'EXPENSE'), [last30]);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Recent transactions (latest 8)
  const recentTxs = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [transactions],
  );

  // Category & account maps
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach((a) => m.set(a.id, a.name));
    creditCards.forEach((c) => m.set(c.id, c.bankName || c.name));
    return m;
  }, [accounts, creditCards]);

  // ── Refresh handler ───────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // hooks auto-reload via events, just wait a beat
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
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
      {/* ── Hero Balance Card ── */}
      {loading ? (
        <SkeletonCard style={{ marginBottom: SPACING.lg }} />
      ) : (
        <HeroCard
          label="Available Balance"
          amount={fmtFull(availableBalance)}
          subtitle="Total Cash − Credit Card Due"
          icon={<Wallet size={ICON_SIZE.lg} color="#ffffff" />}
          style={{ marginBottom: SPACING.lg }}
        />
      )}

      {/* ── Stats Row (horizontal scroll) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
        style={{ marginBottom: SPACING['2xl'] }}
      >
        <StatCard
          label="Income (30d)"
          value={fmt(totalIncome)}
          icon={<TrendingUp size={ICON_SIZE.md} color={COLORS.income} />}
          iconBg={COLORS.incomeBg}
          iconBorder="rgba(16,185,129,0.2)"
          trendColor={COLORS.income}
          style={styles.statCard}
        />
        <StatCard
          label="Expenses (30d)"
          value={fmt(totalExpense)}
          icon={<TrendingDown size={ICON_SIZE.md} color={COLORS.expense} />}
          iconBg={COLORS.expenseBg}
          iconBorder="rgba(244,63,94,0.2)"
          trendColor={COLORS.expense}
          style={styles.statCard}
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          icon={<PiggyBank size={ICON_SIZE.md} color={COLORS.investment} />}
          iconBg={COLORS.investmentBg}
          iconBorder="rgba(245,158,11,0.2)"
          trend={savingsRate >= 20 ? 'On track' : 'Low'}
          trendColor={savingsRate >= 20 ? COLORS.income : COLORS.warning}
          style={styles.statCard}
        />
        <StatCard
          label="Total Debt"
          value={fmt(totalCCDebt + totalLoanDebt)}
          icon={<TrendingDown size={ICON_SIZE.md} color={COLORS.debt} />}
          iconBg={COLORS.debtBg}
          iconBorder="rgba(168,85,247,0.2)"
          style={styles.statCard}
        />
      </ScrollView>

      {/* ── Assets vs Liabilities summary ── */}
      <View style={styles.twoCol}>
        <GlassCard padding="lg" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <IconCircle variant="income" size={36}>
              <PiggyBank size={18} color={COLORS.income} />
            </IconCircle>
            <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
              <Text style={styles.summaryLabel}>Total Cash</Text>
              <Text style={[styles.summaryValue, { color: COLORS.income }]}>
                {fmt(totalCash)}
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard padding="lg" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <IconCircle variant="expense" size={36}>
              <TrendingDown size={18} color={COLORS.expense} />
            </IconCircle>
            <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
              <Text style={styles.summaryLabel}>CC Due</Text>
              <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
                {fmt(totalCCDebt)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* ── Recent Transactions ── */}
      <SectionHeader
        title="Recent Transactions"
        actionLabel="See All"
        onAction={() => navigation.navigate('MainTabs', { screen: 'Transactions' } as any)}
        style={{ marginTop: SPACING['2xl'] }}
      />

      {loading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : recentTxs.length === 0 ? (
        <GlassCard padding="2xl" style={{ alignItems: 'center' as const }}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </GlassCard>
      ) : (
        recentTxs.map((tx) => (
          <TransactionRow
            key={tx.id}
            title={tx.description || 'Untitled'}
            amount={fmtFull(tx.amount)}
            type={tx.type}
            category={tx.categoryId ? categoryMap.get(tx.categoryId) : undefined}
            account={accountMap.get(tx.accountId)}
            date={new Date(tx.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
            style={{ marginBottom: SPACING.sm }}
          />
        ))
      )}

      {/* Bottom spacer for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  statsRow: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  statCard: {
    width: 160,
  },
  twoCol: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
});
