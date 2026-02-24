/**
 * CreditCardDetailScreen — utilization, statement, payments, recent transactions.
 *
 * Hero: credit limit / outstanding / available. Payment button. Statement section.
 * Mirrors web's credit-cards/[id] page.
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard as CreditCardIcon,
  DollarSign,
  Calendar,
  Upload,
  AlertCircle,
  Trash2,
  FileText,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import type { Transaction } from '@/types/db-types';
import { creditCardService, transactionService } from '@/lib/localdb-services';
import {
  ScreenHeader,
  GlassCard,
  IconCircle,
  Button,
  EmptyState,
  SkeletonCard,
  SkeletonRow,
  TransactionRow,
  SectionHeader,
  StatCard,
  AnimatedPressable,
} from '@/components/ui';
import { CreditCardPaymentModal } from '@/components/CreditCardPaymentModal';
import { useAccounts } from '@/hooks/useLocalData';

type Props = NativeStackScreenProps<RootStackParamList, 'CreditCardDetail'>;

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function CreditCardDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { accounts } = useAccounts();

  const [card, setCard] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const cardData = await creditCardService.getById(id);
      if (!cardData) return;
      setCard(cardData);

      const txs = await transactionService.getByAccount(id);
      setTransactions(txs.slice(0, 50));
    } catch (e) {
      console.error('[CreditCardDetail] fetch failed', e);
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

  // Derived
  const limit = card ? Number(card.creditLimit || 0) : 0;
  const outstanding = card ? Number(card.currentOutstanding || 0) : 0;
  const utilization = limit > 0 ? (outstanding / limit) * 100 : 0;
  const available = limit - outstanding;

  const lastStatement =
    card?.statements?.length > 0 ? card.statements[0] : null;
  const minDue = lastStatement ? Number(lastStatement.minimumDue) : 0;
  const totalDue = lastStatement
    ? Number(lastStatement.closingBalance)
    : outstanding;

  const handlePayment = async (data: {
    amount: number;
    accountId: string;
    date: string;
  }) => {
    await creditCardService.recordPayment(id, data.amount);
    setPaymentVisible(false);
    await fetchData();
  };

  const handleGenerateStatement = () => {
    Alert.alert('Generate Statement', 'Generate statement for the last billing cycle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Generate',
        onPress: async () => {
          try {
            await creditCardService.generateStatement(id);
            await fetchData();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to generate statement');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Credit Card?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await creditCardService.delete(id);
          navigation.goBack();
        },
      },
    ]);
  };

  // Utilization color
  const utilColor =
    utilization > 75 ? COLORS.error : utilization > 50 ? COLORS.warning : COLORS.income;

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Credit Card" showBack />
        <View style={styles.content}>
          <SkeletonCard style={{ marginBottom: SPACING.lg }} />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Credit Card" showBack />
        <EmptyState
          title="Card not found"
          description="It may have been deleted"
          icon={<CreditCardIcon size={ICON_SIZE.xl} color={COLORS.textTertiary} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={card.bankName || card.name} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />
        }
      >
        {/* ── Card Visual ── */}
        <LinearGradient
          colors={['#1e1b4b', '#312e81', '#4338ca']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardVisual}
        >
          <View style={styles.cardTop}>
            <CreditCardIcon size={28} color="#a5b4fc" />
            <Text style={styles.cardBank}>{card.bankName || ''}</Text>
          </View>
          <Text style={styles.cardName}>{card.name}</Text>
          {card.lastFourDigits && (
            <Text style={styles.cardDigits}>•••• {card.lastFourDigits}</Text>
          )}
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardSmallLabel}>Outstanding</Text>
              <Text style={styles.cardAmount}>{fmt(outstanding)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' as const }}>
              <Text style={styles.cardSmallLabel}>Limit</Text>
              <Text style={styles.cardAmount}>{fmt(limit)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Utilization bar ── */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.md }}>
          <View style={styles.utilHeader}>
            <Text style={styles.utilLabel}>Utilization</Text>
            <Text style={[styles.utilPct, { color: utilColor }]}>
              {utilization.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.utilBar}>
            <View
              style={[
                styles.utilFill,
                { width: `${Math.min(100, utilization)}%` as any, backgroundColor: utilColor },
              ]}
            />
          </View>
          <View style={styles.utilRow}>
            <Text style={styles.utilSub}>Available: {fmt(available)}</Text>
          </View>
        </GlassCard>

        {/* ── Quick Stats ── */}
        <View style={styles.twoCol}>
          <StatCard
            label="Min Due"
            value={fmt(minDue)}
            icon={<AlertCircle size={16} color={COLORS.warning} />}
            style={{ flex: 1 }}
          />
          <StatCard
            label="Total Due"
            value={fmt(totalDue)}
            icon={<DollarSign size={16} color={COLORS.expense} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionRow}>
          <AnimatedPressable
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setPaymentVisible(true);
            }}
          >
            <Upload size={18} color={COLORS.income} />
            <Text style={styles.actionLabel}>Pay Bill</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.actionBtn} onPress={handleGenerateStatement}>
            <FileText size={18} color={COLORS.primaryLight} />
            <Text style={styles.actionLabel}>Statement</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.actionBtn} onPress={handleDelete}>
            <Trash2 size={18} color={COLORS.error} />
            <Text style={styles.actionLabel}>Delete</Text>
          </AnimatedPressable>
        </View>

        {/* ── Statements ── */}
        {card.statements && card.statements.length > 0 && (
          <>
            <SectionHeader title="Statements" style={{ marginTop: SPACING.md }} />
            <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
              {card.statements.slice(0, 6).map((stmt: any, idx: number) => (
                <View
                  key={stmt.id}
                  style={[
                    styles.stmtRow,
                    idx < card.statements.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: COLORS.border,
                    },
                  ]}
                >
                  <View>
                    <Text style={styles.stmtDate}>
                      {new Date(stmt.cycleEnd).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.stmtDue}>
                      Due: {new Date(stmt.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' as const }}>
                    <Text style={styles.stmtAmount}>{fmt(stmt.closingBalance)}</Text>
                    <Text
                      style={[
                        styles.stmtStatus,
                        { color: stmt.status === 'PAID' ? COLORS.income : COLORS.warning },
                      ]}
                    >
                      {stmt.status}
                    </Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* ── Recent Transactions ── */}
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

      {/* Payment Modal */}
      <CreditCardPaymentModal
        visible={paymentVisible}
        onClose={() => setPaymentVisible(false)}
        onSubmit={handlePayment}
        accounts={accounts.filter((a) => a.type !== 'CREDIT_CARD' && !a.isArchived)}
        minDue={minDue}
        totalDue={totalDue}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  cardVisual: {
    borderRadius: BORDER_RADIUS['3xl'],
    padding: SPACING['2xl'],
    marginBottom: SPACING.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardBank: { fontSize: FONT_SIZE.sm, color: '#a5b4fc', fontWeight: '600' },
  cardName: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardDigits: { fontSize: FONT_SIZE.sm, color: '#c7d2fe', letterSpacing: 2, marginBottom: SPACING.lg },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardSmallLabel: { fontSize: FONT_SIZE.xs, color: '#a5b4fc', marginBottom: 2 },
  cardAmount: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#fff' },

  utilHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  utilLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  utilPct: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  utilBar: { height: 8, backgroundColor: COLORS.white5, borderRadius: 4, overflow: 'hidden' },
  utilFill: { height: '100%', borderRadius: 4 },
  utilRow: { marginTop: SPACING.xs },
  utilSub: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary },

  twoCol: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },

  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.lg },
  actionBtn: { alignItems: 'center', gap: 6, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  actionLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },

  stmtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  stmtDate: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '600' },
  stmtDue: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2 },
  stmtAmount: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.textPrimary },
  stmtStatus: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 2 },

  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: 'center' },
});
