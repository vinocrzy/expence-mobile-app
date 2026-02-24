/**
 * LoanDetailScreen — amortization overview, EMI info, prepayment, payment recording.
 *
 * Hero: principal / outstanding / EMI. Progress ring. EMI schedule list.
 * Mirrors web's loans/[id] page.
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
  Landmark,
  Percent,
  Calendar,
  TrendingDown,
  CheckCircle,
  Clock,
  Trash2,
  DollarSign,
  ArrowRight,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import { loanService } from '@/lib/localdb-services';
import {
  ScreenHeader,
  GlassCard,
  HeroCard,
  IconCircle,
  Button,
  StatCard,
  EmptyState,
  SkeletonCard,
  SkeletonRow,
  SectionHeader,
  AnimatedPressable,
  Badge,
} from '@/components/ui';
import { PrepaymentModal } from '@/components/PrepaymentModal';

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDetail'>;

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── EMI schedule generator ──────────────────────────────────────────────────

interface EMI {
  id: string;
  number: number;
  dueDate: string;
  total: number;
  principal: number;
  interest: number;
  status: 'PAID' | 'PENDING';
}

function generateEMIs(loan: any): EMI[] {
  const emis: EMI[] = [];
  const p = loan.principal;
  const r = loan.interestRate / 12 / 100;
  const n = loan.tenureMonths;
  const emiAmount =
    loan.emiAmount || (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = p;
  const start = new Date(loan.startDate);

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const principalComp = emiAmount - interest;
    const due = new Date(start);
    due.setMonth(start.getMonth() + i);

    const totalPaid = (loan.initialPaidEmis || 0) + (loan.paidEmis || 0);
    emis.push({
      id: `emi_${i}`,
      number: i,
      dueDate: due.toISOString(),
      total: emiAmount,
      principal: principalComp,
      interest,
      status: i <= totalPaid ? 'PAID' : 'PENDING',
    });
    balance -= principalComp;
  }
  return emis;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LoanDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prepaymentVisible, setPrepaymentVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await loanService.getById(id);
      if (data) setLoan(data);
    } catch (e) {
      console.error('[LoanDetail] fetch failed', e);
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

  const emis = useMemo(() => (loan ? generateEMIs(loan) : []), [loan]);

  const paidCount = emis.filter((e) => e.status === 'PAID').length;
  const pendingCount = emis.length - paidCount;
  const totalInterest = emis.reduce((s, e) => s + e.interest, 0);
  const totalPrincipal = emis.reduce((s, e) => s + e.principal, 0);
  const progressPct = emis.length > 0 ? (paidCount / emis.length) * 100 : 0;

  const handlePayEMI = async () => {
    Haptics.selectionAsync();
    if (!loan) return;
    Alert.alert('Record EMI Payment', `Record payment of ${fmt(loan.emiAmount || 0)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Record',
        onPress: async () => {
          await loanService.recordPayment(id, loan.emiAmount || 0);
          await fetchData();
        },
      },
    ]);
  };

  const handlePrepayment = async (data: { amount: number; date: string; strategy: string }) => {
    await loanService.recordPayment(id, data.amount);
    setPrepaymentVisible(false);
    await fetchData();
  };

  const handleDelete = () => {
    Alert.alert('Delete Loan?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await loanService.delete(id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loan Details" showBack />
        <View style={styles.content}>
          <SkeletonCard style={{ marginBottom: SPACING.lg }} />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loan Details" showBack />
        <EmptyState
          title="Loan not found"
          description="It may have been deleted"
          icon={<Landmark size={ICON_SIZE.xl} color={COLORS.textTertiary} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={loan.name} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />
        }
      >
        {/* Hero */}
        <HeroCard
          label="Outstanding Principal"
          amount={fmt(loan.outstandingPrincipal || 0)}
          subtitle={loan.lender || 'Loan'}
          icon={<Landmark size={ICON_SIZE.lg} color="#fff" />}
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Stats row */}
        <View style={styles.threeCol}>
          <StatCard
            label="EMI"
            value={fmt(loan.emiAmount || 0)}
            icon={<DollarSign size={14} color={COLORS.primaryLight} />}
            style={{ flex: 1 }}
          />
          <StatCard
            label="Rate"
            value={`${loan.interestRate}%`}
            icon={<Percent size={14} color={COLORS.warning} />}
            style={{ flex: 1 }}
          />
          <StatCard
            label="Tenure"
            value={`${loan.tenureMonths}m`}
            icon={<Calendar size={14} color={COLORS.info} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Progress */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Repayment Progress</Text>
            <Text style={[styles.progressPct, { color: COLORS.income }]}>{progressPct.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressSub}>
              {paidCount} of {emis.length} EMIs paid
            </Text>
            <Text style={styles.progressSub}>{pendingCount} remaining</Text>
          </View>
        </GlassCard>

        {/* Interest breakdown */}
        <View style={styles.twoCol}>
          <GlassCard padding="lg" style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Total Principal</Text>
            <Text style={[styles.breakdownValue, { color: COLORS.income }]}>{fmt(totalPrincipal)}</Text>
          </GlassCard>
          <GlassCard padding="lg" style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Total Interest</Text>
            <Text style={[styles.breakdownValue, { color: COLORS.warning }]}>{fmt(totalInterest)}</Text>
          </GlassCard>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <AnimatedPressable style={styles.actionBtn} onPress={handlePayEMI}>
            <ArrowRight size={18} color={COLORS.income} />
            <Text style={styles.actionLabel}>Pay EMI</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setPrepaymentVisible(true);
            }}
          >
            <TrendingDown size={18} color={COLORS.primaryLight} />
            <Text style={styles.actionLabel}>Prepay</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.actionBtn} onPress={handleDelete}>
            <Trash2 size={18} color={COLORS.error} />
            <Text style={styles.actionLabel}>Delete</Text>
          </AnimatedPressable>
        </View>

        {/* EMI Schedule */}
        <SectionHeader title="EMI Schedule" style={{ marginTop: SPACING.md }} />
        <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
          {emis.slice(0, 24).map((emi, idx) => (
            <View
              key={emi.id}
              style={[
                styles.emiRow,
                idx < Math.min(emis.length, 24) - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: COLORS.border,
                },
              ]}
            >
              <View style={styles.emiLeft}>
                {emi.status === 'PAID' ? (
                  <CheckCircle size={18} color={COLORS.income} />
                ) : (
                  <Clock size={18} color={COLORS.textTertiary} />
                )}
                <View>
                  <Text style={styles.emiNum}>EMI #{emi.number}</Text>
                  <Text style={styles.emiDate}>
                    {new Date(emi.dueDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' as const }}>
                <Text style={styles.emiAmount}>{fmt(emi.total)}</Text>
                <Text style={styles.emiBreak}>
                  P: {fmt(emi.principal)} · I: {fmt(emi.interest)}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      <PrepaymentModal
        visible={prepaymentVisible}
        onClose={() => setPrepaymentVisible(false)}
        onSubmit={handlePrepayment}
        maxAmount={loan.outstandingPrincipal || 0}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  threeCol: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  twoCol: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  progressPct: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: COLORS.white5, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.income },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  progressSub: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary },

  breakdownCard: { flex: 1, alignItems: 'flex-start', gap: SPACING.xs },
  breakdownLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, fontWeight: '500' },
  breakdownValue: { fontSize: FONT_SIZE.lg, fontWeight: '700' },

  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.lg },
  actionBtn: { alignItems: 'center', gap: 6, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  actionLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },

  emiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  emiLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  emiNum: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '600' },
  emiDate: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 1 },
  emiAmount: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.textPrimary },
  emiBreak: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 1 },
});
