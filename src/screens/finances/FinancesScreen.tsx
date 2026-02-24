/**
 * FinancesScreen — accounts, credit cards, loans overview.
 *
 * Hero available-balance card, cash/debt summary, sectioned lists.
 * Mirrors web's finances/page.tsx.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Wallet,
  CreditCard,
  Landmark,
  ChevronRight,
  Plus,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, ICON_SIZE, BORDER_RADIUS } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import {
  useAccounts,
  useCreditCards,
  useLoans,
} from '@/hooks/useLocalData';
import { AccountModal } from '@/components/AccountModal';
import { CreditCardModal } from '@/components/CreditCardModal';
import { LoanModal } from '@/components/LoanModal';
import {
  calculateTotalLiquidCash,
  calculateTotalCreditCardDebt,
  calculateAvailableBalance,
  calculateTotalLoanOutstanding,
} from '@/lib/financial-math';
import {
  HeroCard,
  GlassCard,
  SectionHeader,
  ListItem,
  IconCircle,
  ScreenHeader,
  SkeletonCard,
  SkeletonRow,
  EmptyState,
} from '@/components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Component ───────────────────────────────────────────────────────────────

export function FinancesScreen() {
  const navigation = useNavigation<Nav>();
  const { accounts, loading: accLoading, addAccount } = useAccounts();
  const { creditCards, loading: ccLoading, addCreditCard } = useCreditCards();
  const { loans, loading: loanLoading, addLoan } = useLoans();

  const [refreshing, setRefreshing] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCCModal, setShowCCModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const loading = accLoading || ccLoading || loanLoading;

  // ── Derived ───────────────────────────────────────────────────────────────

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
  const totalLoanOutstanding = useMemo(
    () => calculateTotalLoanOutstanding(activeLoans),
    [activeLoans],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Finances" showBack={false} />

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

      {/* Hero Balance */}
      {loading ? (
        <SkeletonCard style={{ marginBottom: SPACING.lg }} />
      ) : (
        <HeroCard
          label="Available Balance"
          amount={fmt(availableBalance)}
          subtitle="Total Cash − Credit Card Due"
          icon={<Wallet size={ICON_SIZE.lg} color="#ffffff" />}
          style={{ marginBottom: SPACING.lg }}
        />
      )}

      {/* Cash vs CC Due summary */}
      <View style={styles.twoCol}>
        <GlassCard padding="lg" style={styles.summaryCard}>
          <IconCircle variant="income" size={36}>
            <Landmark size={18} color={COLORS.income} />
          </IconCircle>
          <Text style={styles.summaryLabel}>Total Cash</Text>
          <Text style={[styles.summaryValue, { color: COLORS.income }]}>
            {fmt(totalCash)}
          </Text>
        </GlassCard>

        <GlassCard padding="lg" style={styles.summaryCard}>
          <IconCircle variant="expense" size={36}>
            <CreditCard size={18} color={COLORS.expense} />
          </IconCircle>
          <Text style={styles.summaryLabel}>CC Due</Text>
          <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
            {fmt(totalCCDebt)}
          </Text>
        </GlassCard>
      </View>

      {/* ── Bank Accounts ── */}
      <SectionHeader
        title="Accounts"
        actionLabel="+ Add Account"
        onAction={() => setShowAccountModal(true)}
        style={{ marginTop: SPACING['2xl'] }}
      />
      {loading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : bankAccounts.length === 0 ? (
        <GlassCard padding="lg">
          <Text style={styles.emptyText}>No bank accounts added</Text>
        </GlassCard>
      ) : (
        <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
          {bankAccounts.map((acc, idx) => (
            <ListItem
              key={acc.id}
              title={acc.name}
              subtitle={(acc.type || '').toLowerCase().replace(/_/g, ' ')}
              leftIcon={
                <IconCircle variant="primary" size={32}>
                  <Wallet size={16} color={COLORS.primaryLight} />
                </IconCircle>
              }
              rightElement={
                <Text style={styles.amount}>{fmt(acc.balance || 0)}</Text>
              }
              onPress={() =>
                navigation.navigate('AccountDetail', { id: acc.id })
              }
              style={
                idx < bankAccounts.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }
                  : undefined
              }
            />
          ))}
        </GlassCard>
      )}

      {/* ── Credit Cards ── */}
      <SectionHeader
        title="Credit Cards"
        actionLabel="+ Add Card"
        onAction={() => setShowCCModal(true)}
        style={{ marginTop: SPACING['2xl'] }}
      />
      {loading ? (
        <SkeletonRow />
      ) : activeCards.length === 0 ? (
        <GlassCard padding="lg">
          <Text style={styles.emptyText}>No credit cards added</Text>
        </GlassCard>
      ) : (
        <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
          {activeCards.map((card, idx) => (
            <ListItem
              key={card.id}
              title={card.bankName || card.name}
              subtitle={card.name}
              leftIcon={
                <IconCircle variant="debt" size={32}>
                  <CreditCard size={16} color={COLORS.debt} />
                </IconCircle>
              }
              rightElement={
                <View style={{ alignItems: 'flex-end' as const }}>
                  <Text style={styles.dueLabel}>Due</Text>
                  <Text style={[styles.amount, { color: COLORS.expense }]}>
                    {fmt(card.currentOutstanding || 0)}
                  </Text>
                </View>
              }
              onPress={() =>
                navigation.navigate('CreditCardDetail', { id: card.id })
              }
              style={
                idx < activeCards.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }
                  : undefined
              }
            />
          ))}
        </GlassCard>
      )}

      {/* ── Loans ── */}
      <SectionHeader
        title="Loans"
        actionLabel="+ Add Loan"
        onAction={() => setShowLoanModal(true)}
        style={{ marginTop: SPACING['2xl'] }}
      />
      {loading ? (
        <SkeletonRow />
      ) : activeLoans.length === 0 ? (
        <GlassCard padding="lg">
          <Text style={styles.emptyText}>No active loans</Text>
        </GlassCard>
      ) : (
        <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
          {activeLoans.map((loan, idx) => (
            <ListItem
              key={loan.id}
              title={loan.name}
              subtitle={loan.lender || ''}
              leftIcon={
                <IconCircle variant="warning" size={32}>
                  <Landmark size={16} color={COLORS.warning} />
                </IconCircle>
              }
              rightElement={
                <View style={{ alignItems: 'flex-end' as const }}>
                  <Text style={styles.dueLabel}>Outstanding</Text>
                  <Text style={[styles.amount, { color: COLORS.warning }]}>
                    {fmt(loan.outstandingPrincipal || 0)}
                  </Text>
                </View>
              }
              onPress={() =>
                navigation.navigate('LoanDetail', { id: loan.id })
              }
              style={
                idx < activeLoans.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }
                  : undefined
              }
            />
          ))}
        </GlassCard>
      )}

      {/* Bottom spacer */}
      <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Account Modal */}
      <AccountModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSubmit={async (data) => {
          await addAccount(data);
        }}
      />

      {/* Add Credit Card Modal */}
      <CreditCardModal
        visible={showCCModal}
        onClose={() => setShowCCModal(false)}
        onSubmit={async (data) => {
          await addCreditCard(data);
        }}
      />

      {/* Add Loan Modal */}
      <LoanModal
        visible={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        onSubmit={async (data) => {
          await addLoan(data);
        }}
        accounts={bankAccounts}
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
  twoCol: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    gap: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginTop: SPACING.sm,
  },
  summaryValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  amount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  dueLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginBottom: 1,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
