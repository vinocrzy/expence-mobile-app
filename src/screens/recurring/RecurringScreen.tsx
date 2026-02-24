/**
 * RecurringScreen — full list of recurring payments / subscriptions.
 *
 * Features:
 *  - List sorted by next due date
 *  - Status badges (Overdue, Due Today, Due in X days)
 *  - Pay Now action (opens account picker)
 *  - Edit / Delete via long-press context
 *  - FAB to create new recurring item
 *  - Mirrors web's recurring/page.tsx
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from 'react-native';
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Repeat,
  Plus,
  Banknote,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { RecurringTransaction } from '@/types/db-types';
import { useRecurring, useAccounts, useCreditCards } from '@/hooks/useLocalData';
import {
  ScreenHeader,
  EmptyState,
  Badge,
  IconCircle,
  AnimatedPressable,
  SelectField,
  Button,
  BottomSheetModal,
  type SelectOption,
} from '@/components/ui';
import { RecurringModal } from '@/components/RecurringModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDueDays(nextDueDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDueStatus(days: number): { label: string; color: 'error' | 'warning' | 'success' | 'info' | 'neutral' } {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'error' };
  if (days === 0) return { label: 'Due today', color: 'warning' };
  if (days <= 3) return { label: `Due in ${days}d`, color: 'warning' };
  if (days <= 7) return { label: `Due in ${days}d`, color: 'info' };
  return { label: `Due in ${days}d`, color: 'neutral' };
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  EXPENSE: <TrendingDown size={18} color={COLORS.expense} />,
  INCOME: <TrendingUp size={18} color={COLORS.income} />,
  INVESTMENT: <TrendingUp size={18} color={COLORS.investment} />,
  DEBT: <CreditCard size={18} color={COLORS.debt} />,
  TRANSFER: <RefreshCw size={18} color={COLORS.transfer} />,
};

const TYPE_COLOR: Record<string, string> = {
  EXPENSE: COLORS.expense,
  INCOME: COLORS.income,
  INVESTMENT: COLORS.investment,
  DEBT: COLORS.debt,
  TRANSFER: COLORS.transfer,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RecurringScreen() {
  const { recurring, loading, addRecurring, updateRecurring, deleteRecurring, processPayment } = useRecurring();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();

  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<RecurringTransaction | null>(null);
  const [payItem, setPayItem] = useState<RecurringTransaction | null>(null);
  const [payAccountId, setPayAccountId] = useState('');

  // Account options for payment picker
  const accountOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = accounts.map((a) => ({ value: a.id, label: a.name }));
    creditCards.forEach((cc) => {
      list.push({ value: cc.id, label: cc.bankName || cc.name });
    });
    return list;
  }, [accounts, creditCards]);

  // Monthly total
  const monthlyTotal = useMemo(() => {
    return recurring.reduce((sum, r) => {
      if (r.type !== 'INCOME') {
        let monthly = r.amount;
        if (r.frequency === 'YEARLY') monthly /= 12;
        if (r.frequency === 'QUARTERLY') monthly /= 3;
        if (r.frequency === 'WEEKLY') monthly *= 4.33;
        return sum + monthly;
      }
      return sum;
    }, 0);
  }, [recurring]);

  // Handlers
  const handleCreate = useCallback(() => {
    setEditItem(null);
    setModalVisible(true);
  }, []);

  const handleEdit = useCallback((item: RecurringTransaction) => {
    setEditItem(item);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (item: RecurringTransaction) => {
      Alert.alert(
        'Delete Recurring',
        `Delete "${item.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteRecurring(item.id),
          },
        ],
      );
    },
    [deleteRecurring],
  );

  const handlePayNow = useCallback((item: RecurringTransaction) => {
    setPayItem(item);
    setPayAccountId(item.accountId || '');
  }, []);

  const confirmPayment = useCallback(async () => {
    if (!payItem || !payAccountId) return;
    try {
      await processPayment(payItem.id, payAccountId);
      setPayItem(null);
      setPayAccountId('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Payment failed');
    }
  }, [payItem, payAccountId, processPayment]);

  const handleSubmit = useCallback(
    async (data: any) => {
      if (editItem) {
        await updateRecurring(editItem.id, data);
      } else {
        await addRecurring(data);
      }
    },
    [editItem, addRecurring, updateRecurring],
  );

  // ── Render item ────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: RecurringTransaction }) => {
      const days = getDueDays(item.nextDueDate);
      const status = getDueStatus(days);
      const color = TYPE_COLOR[item.type] || COLORS.textPrimary;

      return (
        <AnimatedPressable
          onPress={() => handleEdit(item)}
          onLongPress={() =>
            Alert.alert(item.name, 'Choose an action', [
              { text: 'Edit', onPress: () => handleEdit(item) },
              { text: 'Pay Now', onPress: () => handlePayNow(item) },
              { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          scaleDown={0.98}
          style={styles.card}
        >
          {/* Left: icon */}
          <IconCircle variant="muted" size={44}>
            {TYPE_ICON[item.type] || <Repeat size={18} color={COLORS.textSecondary} />}
          </IconCircle>

          {/* Middle: name + meta */}
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.cardAmount, { color }]}>
                ₹{item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.cardBottomRow}>
              <Badge color={status.color} label={status.label} />
              <Text style={styles.cardFreq}>{item.frequency}</Text>
            </View>
          </View>

          {/* Right: pay button for overdue / due today */}
          {days <= 0 && (
            <Pressable
              style={styles.payBtn}
              onPress={() => handlePayNow(item)}
              hitSlop={8}
            >
              <Banknote size={16} color={COLORS.primary} />
            </Pressable>
          )}
        </AnimatedPressable>
      );
    },
    [handleEdit, handleDelete, handlePayNow],
  );

  // ── Main ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Subscriptions & EMIs"
        showBack
        rightAction={
          <Pressable onPress={handleCreate} hitSlop={8}>
            <Plus size={24} color={COLORS.primaryLight} />
          </Pressable>
        }
      />

      {/* Summary */}
      {recurring.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Monthly outflow</Text>
          <Text style={styles.summaryValue}>
            ₹{Math.round(monthlyTotal).toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={recurring}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={<Repeat size={48} color={COLORS.textTertiary} />}
              title="No Recurring Payments"
              description="Tap + to add subscriptions, EMIs, or other recurring expenses."
            />
          ) : null
        }
      />

      {/* Create / Edit modal */}
      <RecurringModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialData={editItem}
      />

      {/* Pay Now modal */}
      <BottomSheetModal
        visible={!!payItem}
        onClose={() => setPayItem(null)}
        title={`Pay: ${payItem?.name ?? ''}`}
        maxHeightRatio={0.45}
        footer={
          <View style={styles.payFooter}>
            <Button title="Cancel" variant="secondary" onPress={() => setPayItem(null)} style={{ flex: 1 }} />
            <Button
              title="Confirm Payment"
              variant="primary"
              onPress={confirmPayment}
              disabled={!payAccountId}
              style={{ flex: 2 }}
            />
          </View>
        }
      >
        <Text style={styles.payAmount}>
          ₹{payItem?.amount.toLocaleString('en-IN')}
        </Text>
        <SelectField
          label="Pay from account"
          placeholder="Select account"
          options={accountOptions}
          value={payAccountId}
          onSelect={setPayAccountId}
          containerStyle={{ marginTop: SPACING.lg }}
        />
      </BottomSheetModal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.expense,
    fontVariant: ['tabular-nums'],
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceAlpha,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardAmount: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  cardFreq: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textTransform: 'capitalize',
  },
  payBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white5,
    borderRadius: BORDER_RADIUS.md,
  },
  payFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  payAmount: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
