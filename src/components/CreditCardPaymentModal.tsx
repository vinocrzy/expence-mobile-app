/**
 * CreditCardPaymentModal — record a payment against a credit card.
 *
 * Amount input with quick-fill buttons (min due / total due), source account,
 * date picker. Mirrors web's CreditCardPaymentModal.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Account } from '@/types/db-types';
import {
  BottomSheetModal,
  AmountInput,
  SelectField,
  Button,
  ErrorBanner,
  AnimatedPressable,
  type SelectOption,
} from '@/components/ui';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreditCardPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; accountId: string; date: string }) => Promise<void>;
  accounts: Account[];
  minDue?: number;
  totalDue?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Component ───────────────────────────────────────────────────────────────

export function CreditCardPaymentModal({
  visible,
  onClose,
  onSubmit,
  accounts,
  minDue = 0,
  totalDue = 0,
}: CreditCardPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setAccountId('');
    setDate(new Date());
    setError('');
    setLoading(false);
  }, [visible]);

  const accountOptions: SelectOption[] = accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const handleSubmit = useCallback(async () => {
    setError('');
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    if (!accountId) {
      setError('Select a source account');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ amount: num, accountId, date: date.toISOString() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }, [amount, accountId, date, onSubmit, onClose]);

  const onDateChange = useCallback((_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  }, []);

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Processing…' : 'Record Payment'}
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
      title="Record Payment"
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      {/* Quick amount buttons */}
      {(minDue > 0 || totalDue > 0) && (
        <View style={styles.quickRow}>
          {minDue > 0 && (
            <AnimatedPressable
              style={styles.quickBtn}
              onPress={() => setAmount(String(minDue))}
            >
              <Text style={styles.quickLabel}>Min Due</Text>
              <Text style={styles.quickValue}>{fmt(minDue)}</Text>
            </AnimatedPressable>
          )}
          {totalDue > 0 && (
            <AnimatedPressable
              style={styles.quickBtn}
              onPress={() => setAmount(String(totalDue))}
            >
              <Text style={styles.quickLabel}>Total Due</Text>
              <Text style={styles.quickValue}>{fmt(totalDue)}</Text>
            </AnimatedPressable>
          )}
        </View>
      )}

      {/* Amount */}
      <AmountInput
        label="Payment Amount"
        value={amount}
        onChangeText={setAmount}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Source Account */}
      <SelectField
        label="From Account"
        placeholder="Select source account"
        options={accountOptions}
        value={accountId}
        onSelect={setAccountId}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Date */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.dateLabel}>Payment Date</Text>
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
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  quickLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  quickValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
