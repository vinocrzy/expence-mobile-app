/**
 * AccountDetailScreen — balance details, linked transactions, edit/archive/delete.
 *
 * Hero card with balance, quick-action row, recent transactions list.
 * Mirrors web's accounts page detail view.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  Wallet,
  Pencil,
  Trash2,
  Archive,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  TrendingUp,
  Banknote,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import type { Transaction } from '@/types/db-types';
import { accountService, transactionService } from '@/lib/localdb-services';
import {
  ScreenHeader,
  HeroCard,
  GlassCard,
  IconCircle,
  EmptyState,
  SkeletonCard,
  SkeletonRow,
  TransactionRow,
  SectionHeader,
  AnimatedPressable,
} from '@/components/ui';
import { AccountModal } from '@/components/AccountModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Component ───────────────────────────────────────────────────────────────

export function AccountDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const acc = await accountService.getById(id);
      if (!acc) return;
      setAccount(acc);

      const txs = await transactionService.getByAccount(id);
      setTransactions(txs.slice(0, 50));
    } catch (e) {
      console.error('[AccountDetail] fetch failed', e);
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

  // ── Derived stats ──────────────────────────────────────────────────────────

  const { income, expense } = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);
    return { income: inc, expense: exp };
  }, [transactions]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleEdit = () => {
    Haptics.selectionAsync();
    setEditModalVisible(true);
  };

  const handleArchive = () => {
    Alert.alert('Archive Account?', 'This account will be hidden from your main list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          await accountService.archive(id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Account?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const hasTx = await accountService.hasTransactions(id);
            if (hasTx) {
              Alert.alert(
                'Cannot Delete',
                'This account has linked transactions. Would you like to archive it instead?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Archive', onPress: () => accountService.archive(id).then(() => navigation.goBack()) },
                ],
              );
            } else {
              await accountService.delete(id);
              navigation.goBack();
            }
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const handleEditSubmit = async (data: any) => {
    await accountService.update(id, data);
    setEditModalVisible(false);
    await fetchData();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Account Details" showBack />
        <View style={styles.content}>
          <SkeletonCard style={{ marginBottom: SPACING.lg }} />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Account Details" showBack />
        <EmptyState
          title="Account not found"
          description="It may have been deleted"
          icon={<Wallet size={ICON_SIZE.xl} color={COLORS.textTertiary} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={account.name} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />
        }
      >
        {/* Balance Hero */}
        <HeroCard
          label="Current Balance"
          amount={fmt(account.balance || 0)}
          subtitle={(account.type || '').replace(/_/g, ' ')}
          icon={<Wallet size={ICON_SIZE.lg} color="#fff" />}
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Income / Expense summary */}
        <View style={styles.twoCol}>
          <GlassCard padding="lg" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <IconCircle variant="income" size={36}>
                <ArrowDownLeft size={16} color={COLORS.income} />
              </IconCircle>
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryValue, { color: COLORS.income }]}>{fmt(income)}</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard padding="lg" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <IconCircle variant="expense" size={36}>
                <ArrowUpRight size={16} color={COLORS.expense} />
              </IconCircle>
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{fmt(expense)}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <AnimatedPressable style={styles.actionBtn} onPress={handleEdit}>
            <Pencil size={18} color={COLORS.primaryLight} />
            <Text style={styles.actionLabel}>Edit</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.actionBtn} onPress={handleArchive}>
            <Archive size={18} color={COLORS.warning} />
            <Text style={styles.actionLabel}>Archive</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.actionBtn} onPress={handleDelete}>
            <Trash2 size={18} color={COLORS.error} />
            <Text style={styles.actionLabel}>Delete</Text>
          </AnimatedPressable>
        </View>

        {/* Recent Transactions */}
        <SectionHeader title="Recent Transactions" style={{ marginTop: SPACING.xl }} />

        {transactions.length === 0 ? (
          <GlassCard padding="lg">
            <Text style={styles.emptyText}>No transactions yet</Text>
          </GlassCard>
        ) : (
          <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
            {transactions.slice(0, 20).map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                title={tx.description || 'Transaction'}
                amount={fmt(tx.amount)}
                type={tx.type as any}
                date={new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                listMode
                style={
                  idx < Math.min(transactions.length, 20) - 1
                    ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }
                    : undefined
                }
              />
            ))}
          </GlassCard>
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* Edit Modal */}
      <AccountModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        initialData={account}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  twoCol: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  summaryCard: { flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  summaryText: { flex: 1 },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, fontWeight: '500' },
  summaryValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.lg },
  actionBtn: { alignItems: 'center', gap: 6, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  actionLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: 'center' },
});
