/**
 * PrepaymentModal — record a loan prepayment.
 *
 * Amount (capped at outstanding), date, strategy (reduce tenure / reduce EMI).
 * Mirrors web's PrepaymentModal.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import {
  BottomSheetModal,
  AmountInput,
  SegmentedControl,
  Button,
  ErrorBanner,
  type Segment,
} from '@/components/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

type Strategy = 'REDUCE_TENURE' | 'REDUCE_EMI';

const STRATEGY_SEGMENTS: Segment<Strategy>[] = [
  { value: 'REDUCE_TENURE', label: 'Reduce Tenure', color: COLORS.income, bgColor: COLORS.incomeBg },
  { value: 'REDUCE_EMI', label: 'Reduce EMI', color: COLORS.transfer, bgColor: COLORS.transferBg },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface PrepaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; date: string; strategy: Strategy }) => Promise<void>;
  maxAmount?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PrepaymentModal({
  visible,
  onClose,
  onSubmit,
  maxAmount = 0,
}: PrepaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('REDUCE_TENURE');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setStrategy('REDUCE_TENURE');
    setDate(new Date());
    setError('');
    setLoading(false);
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    setError('');
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (maxAmount > 0 && num > maxAmount) {
      setError(`Amount cannot exceed outstanding (₹${maxAmount.toLocaleString('en-IN')})`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ amount: num, date: date.toISOString(), strategy });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Prepayment failed');
    } finally {
      setLoading(false);
    }
  }, [amount, strategy, date, maxAmount, onSubmit, onClose]);

  const onDateChange = useCallback((_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  }, []);

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Processing…' : 'Record Prepayment'}
        variant="primary"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ flex: 2 }}
      />
    </View>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Loan Prepayment"
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      {maxAmount > 0 && (
        <Text style={styles.hint}>
          Outstanding: ₹{maxAmount.toLocaleString('en-IN')}
        </Text>
      )}

      <AmountInput
        label="Prepayment Amount"
        value={amount}
        onChangeText={setAmount}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <Text style={styles.sectionLabel}>Strategy</Text>
      <SegmentedControl<Strategy>
        segments={STRATEGY_SEGMENTS}
        selected={strategy}
        onSelect={setStrategy}
        style={{ marginBottom: SPACING.lg }}
      />

      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.dateLabel}>Date</Text>
        <Button
          title={date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
          variant="outline"
          onPress={() => setShowDatePicker(true)}
        />
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            themeVariant="dark"
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
