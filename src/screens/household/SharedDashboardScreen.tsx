/**
 * SharedDashboardScreen — household aggregate view (read-only).
 *
 * User filter pills, overview cards (income/expense), account balances,
 * transaction list. All data comes from sharedDB published snapshots.
 * Mirrors web shared-dashboard/page.tsx.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { Inbox, Wifi } from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { SharedTransaction, SharedAccountBalance } from '@/types/db-types';
import { useSharedView } from '@/hooks/useSharedView';
import {
  ScreenHeader,
  GlassCard,
  AnimatedPressable,
  EmptyState,
  LoadingScreen,
} from '@/components/ui';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SharedDashboardScreen() {
  const { transactions, accounts, loading } = useSharedView();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Unique users from transactions
  const users = useMemo(() => {
    const set = new Set(transactions.map((t) => t.user));
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(
    () => (selectedUser ? transactions.filter((t) => t.user === selectedUser) : transactions),
    [transactions, selectedUser],
  );

  // Totals
  const income = useMemo(
    () => filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
    [filtered],
  );
  const expense = useMemo(
    () => filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    [filtered],
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Shared Dashboard"
        showBack
        rightAction={
          <View style={styles.liveBadge}>
            <Wifi size={12} color={COLORS.income} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User filter pills */}
        {users.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={{ marginBottom: SPACING.md }}
          >
            <AnimatedPressable
              style={[styles.filterChip, !selectedUser && styles.filterChipActive]}
              onPress={() => setSelectedUser(null)}
            >
              <Text style={[styles.filterText, !selectedUser && styles.filterTextActive]}>All</Text>
            </AnimatedPressable>
            {users.map((u) => (
              <AnimatedPressable
                key={u}
                style={[styles.filterChip, selectedUser === u && styles.filterChipActive]}
                onPress={() => setSelectedUser(u === selectedUser ? null : u)}
              >
                <Text style={[styles.filterText, selectedUser === u && styles.filterTextActive]}>
                  {u}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        )}

        {/* Overview cards */}
        <View style={styles.overviewRow}>
          <GlassCard padding="lg" style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Total Income</Text>
            <Text style={[styles.cardValue, { color: COLORS.income }]}>{formatCurrency(income)}</Text>
          </GlassCard>
          <GlassCard padding="lg" style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Total Expense</Text>
            <Text style={[styles.cardValue, { color: COLORS.expense }]}>{formatCurrency(expense)}</Text>
          </GlassCard>
        </View>

        {/* Account balances */}
        {accounts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Account Balances</Text>
            <GlassCard padding={0} style={styles.accountsCard}>
              {accounts.map((a, i) => (
                <View
                  key={a.id}
                  style={[
                    styles.accountRow,
                    i < accounts.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: COLORS.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName}>{a.name}</Text>
                    <Text style={styles.accountType}>{a.type}</Text>
                  </View>
                  <Text
                    style={[
                      styles.accountBalance,
                      { color: a.balance >= 0 ? COLORS.income : COLORS.expense },
                    ]}
                  >
                    {formatCurrency(a.balance)}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* Transactions */}
        <Text style={styles.sectionTitle}>
          Transactions ({filtered.length})
        </Text>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox size={32} color={COLORS.textTertiary} />}
            title="No Transactions"
            description="No shared data yet. Ask the owner to publish a snapshot."
          />
        ) : (
          <GlassCard padding={0} style={styles.txCard}>
            {filtered.map((tx, i) => (
              <View
                key={tx.id}
                style={[
                  styles.txRow,
                  i < filtered.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: COLORS.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>
                    {tx.description || tx.categoryName}
                  </Text>
                  <Text style={styles.txMeta}>
                    {tx.categoryName} · {tx.accountName} · {formatDate(tx.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color:
                        tx.type === 'INCOME'
                          ? COLORS.income
                          : tx.type === 'EXPENSE'
                          ? COLORS.expense
                          : COLORS.textSecondary,
                    },
                  ]}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(Math.abs(tx.amount))}
                </Text>
              </View>
            ))}
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

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  liveText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.income,
  },

  filterRow: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34,211,238,0.1)',
  },
  filterText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  filterTextActive: { color: '#22d3ee' },

  overviewRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },

  accountsCard: { marginBottom: SPACING.md, overflow: 'hidden' },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  accountName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  accountType: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  accountBalance: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  txCard: { marginBottom: SPACING.md, overflow: 'hidden' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  txDesc: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  txMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
