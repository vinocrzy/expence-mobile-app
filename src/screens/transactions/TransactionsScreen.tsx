/**
 * TransactionsScreen — filterable transaction list.
 *
 * Search bar, type filter pills (horizontal scroll), date-grouped SectionList.
 * Mirrors web's transactions/page.tsx (list view).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Search, SlidersHorizontal } from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import {
  useTransactions,
  useAccounts,
  useCreditCards,
  useCategories,
} from '@/hooks/useLocalData';
import type { Transaction, TransactionType } from '@/types/db-types';
import {
  TransactionRow,
  FilterChip,
  EmptyState,
  SkeletonRow,
  TextInputField,
  ScreenHeader,
} from '@/components/ui';

// ─── Filter types ────────────────────────────────────────────────────────────

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'DEBT', label: 'Debt' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtAmount = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function groupByDate(
  txs: Transaction[],
): { title: string; data: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>();
  txs.forEach((tx) => {
    const d = new Date(tx.date);
    const key = d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  });
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, loading, deleteTransaction, refresh } = useTransactions();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();
  const { categories } = useCategories();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Maps
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

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (filterType !== 'ALL') {
      list = list.filter((t) => t.type === filterType);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.description || '').toLowerCase().includes(q) ||
          (accountMap.get(t.accountId) || '').toLowerCase().includes(q) ||
          (t.categoryId ? (categoryMap.get(t.categoryId) || '').toLowerCase().includes(q) : false),
      );
    }

    return list;
  }, [transactions, filterType, search, accountMap, categoryMap]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete Transaction', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]);
    },
    [deleteTransaction],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleTypeFilter = useCallback((type: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setFilterType(type);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <ScreenHeader title="Transactions" showBack={false} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInputField
          placeholder="Search transactions…"
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={ICON_SIZE.md} color={COLORS.textTertiary} />}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* Type filter pills */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            selected={filterType === f.value}
            onPress={() => handleTypeFilter(f.value)}
            color="blue"
          />
        ))}
      </View>

      {/* Transaction list */}
      {loading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primaryLight}
              colors={[COLORS.primaryLight]}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TransactionRow
              title={item.description || 'Untitled'}
              amount={fmtAmount(item.amount)}
              type={item.type}
              category={item.categoryId ? categoryMap.get(item.categoryId) : undefined}
              account={accountMap.get(item.accountId)}
              date={new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
              onLongPress={() => handleDelete(item.id)}
              style={{ marginBottom: SPACING.sm }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<SlidersHorizontal size={40} color={COLORS.textTertiary} />}
              title="No transactions found"
              description={
                filterType !== 'ALL' || search
                  ? 'Try adjusting your filters'
                  : 'Add your first transaction with the + button'
              }
            />
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  skeletons: {
    paddingHorizontal: SPACING.lg,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});
