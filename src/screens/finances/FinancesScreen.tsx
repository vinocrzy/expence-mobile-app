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

import { COLORS, FONT_SIZE, SPACING, ICON_SIZE } from '@/constants';
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
  AnimatedPressable,
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
          <View style={styles.summaryRow}>
            <IconCircle variant="income" size={36}>
              <Landmark size={18} color={COLORS.income} />
            </IconCircle>
            <View style={styles.summaryText}>
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
              <CreditCard size={18} color={COLORS.expense} />
            </IconCircle>
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>CC Due</Text>
              <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
                {fmt(totalCCDebt)}
              </Text>
            </View>
          </View>
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
        <View style={styles.cardList}>
          {bankAccounts.map((acc) => {
            const balance = acc.balance || 0;
            const balanceColor = balance >= 0 ? COLORS.income : COLORS.expense;
            return (
              <AnimatedPressable
                key={acc.id}
                scaleDown={0.98}
                onPress={() => navigation.navigate('AccountDetail', { id: acc.id })}
              >
                <GlassCard padding="lg">
                  <View style={styles.itemRow}>
                    <IconCircle variant="primary" size={44}>
                      <Wallet size={ICON_SIZE.md} color={COLORS.primaryLight} />
                    </IconCircle>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{acc.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        {(acc.type || 'Account').replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemRightLabel}>Balance</Text>
                      <Text style={[styles.itemRightAmount, { color: balanceColor }]}>
                        {fmt(balance)}
                      </Text>
                    </View>
                    <ChevronRight size={ICON_SIZE.sm} color={COLORS.textTertiary} />
                  </View>
                </GlassCard>
              </AnimatedPressable>
            );
          })}
        </View>
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
        <View style={styles.cardList}>
          {activeCards.map((card) => {
            const outstanding = card.currentOutstanding || 0;
            const limit = card.creditLimit || 0;
            const utilPct = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
            const subtitle = card.lastFourDigits
              ? `•••• ${card.lastFourDigits}`
              : card.name;
            return (
              <AnimatedPressable
                key={card.id}
                scaleDown={0.98}
                onPress={() => navigation.navigate('CreditCardDetail', { id: card.id })}
              >
                <GlassCard padding="lg">
                  <View style={styles.itemRow}>
                    <IconCircle variant="debt" size={44}>
                      <CreditCard size={ICON_SIZE.md} color={COLORS.debt} />
                    </IconCircle>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {card.bankName || card.name}
                      </Text>
                      <Text style={styles.itemSubtitle}>{subtitle}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemRightLabel}>Outstanding</Text>
                      <Text style={[styles.itemRightAmount, { color: COLORS.expense }]}>
                        {fmt(outstanding)}
                      </Text>
                      {limit > 0 && (
                        <Text style={styles.itemRightMeta}>{utilPct}% used</Text>
                      )}
                    </View>
                    <ChevronRight size={ICON_SIZE.sm} color={COLORS.textTertiary} />
                  </View>
                </GlassCard>
              </AnimatedPressable>
            );
          })}
        </View>
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
        <View style={styles.cardList}>
          {activeLoans.map((loan) => (
            <AnimatedPressable
              key={loan.id}
              scaleDown={0.98}
              onPress={() => navigation.navigate('LoanDetail', { id: loan.id })}
            >
              <GlassCard padding="lg">
                <View style={styles.itemRow}>
                  <IconCircle variant="warning" size={44}>
                    <Landmark size={ICON_SIZE.md} color={COLORS.warning} />
                  </IconCircle>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{loan.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {loan.lender || 'Loan'}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemRightLabel}>Outstanding</Text>
                    <Text style={[styles.itemRightAmount, { color: COLORS.warning }]}>
                      {fmt(loan.outstandingPrincipal || 0)}
                    </Text>
                    {loan.emiAmount ? (
                      <Text style={styles.itemRightMeta}>EMI {fmt(loan.emiAmount)}/mo</Text>
                    ) : null}
                  </View>
                  <ChevronRight size={ICON_SIZE.sm} color={COLORS.textTertiary} />
                </View>
              </GlassCard>
            </AnimatedPressable>
          ))}
        </View>
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
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryText: {
    flex: 1,
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
    textAlign: 'center',
  },
  /** Per-item card list */
  cardList: {
    gap: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemRightLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  itemRightAmount: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  itemRightMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
