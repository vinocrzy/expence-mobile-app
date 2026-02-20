/**
 * CreditCardModal — create/edit credit card bottom sheet.
 *
 * Fields: name, bank/issuer, credit limit, billing cycle day,
 *         payment due day, APR, last four digits.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { COLORS, SPACING } from '@/constants';
import type { CreditCard } from '@/types/db-types';
import {
  BottomSheetModal,
  TextInputField,
  AmountInput,
  Button,
  ErrorBanner,
} from '@/components/ui';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreditCardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  initialData?: CreditCard | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreditCardModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: CreditCardModalProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billingCycle, setBillingCycle] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [apr, setApr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset / hydrate
  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name || '');
      setBankName(initialData.bankName || '');
      setLastFourDigits(initialData.lastFourDigits || '');
      setCreditLimit(initialData.creditLimit ? String(initialData.creditLimit) : '');
      setBillingCycle(initialData.billingCycle ? String(initialData.billingCycle) : '');
      setPaymentDueDay(initialData.paymentDueDay ? String(initialData.paymentDueDay) : '');
      setApr(initialData.apr ? String(initialData.apr) : '');
    } else {
      setName('');
      setBankName('');
      setLastFourDigits('');
      setCreditLimit('');
      setBillingCycle('');
      setPaymentDueDay('');
      setApr('');
    }
    setError('');
    setLoading(false);
  }, [visible, initialData]);

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!name.trim()) { setError('Enter a card name'); return; }
    if (!creditLimit || parseFloat(creditLimit) <= 0) { setError('Enter a valid credit limit'); return; }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        bankName: bankName.trim() || undefined,
        lastFourDigits: lastFourDigits.trim() || undefined,
        creditLimit: parseFloat(creditLimit),
        currentOutstanding: initialData?.currentOutstanding ?? 0,
        billingCycle: billingCycle ? parseInt(billingCycle, 10) : undefined,
        paymentDueDay: paymentDueDay ? parseInt(paymentDueDay, 10) : undefined,
        apr: apr ? parseFloat(apr) : undefined,
        statements: initialData?.statements ?? [],
      } as any);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [name, bankName, lastFourDigits, creditLimit, billingCycle, paymentDueDay, apr, initialData, onSubmit, onClose]);

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Card'}
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
      title={isEdit ? 'Edit Credit Card' : 'New Credit Card'}
      maxHeightRatio={0.88}
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      <TextInputField
        label="Card Name"
        placeholder="My Visa Gold"
        value={name}
        onChangeText={setName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <TextInputField
        label="Bank / Issuer"
        placeholder="HDFC, ICICI, SBI…"
        value={bankName}
        onChangeText={setBankName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <TextInputField
        label="Last 4 Digits"
        placeholder="1234"
        value={lastFourDigits}
        onChangeText={(t) => setLastFourDigits(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <AmountInput
        label="Credit Limit"
        value={creditLimit}
        onChangeText={setCreditLimit}
        currency="₹"
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <View style={styles.row}>
        <TextInputField
          label="Statement Day"
          placeholder="1-28"
          value={billingCycle}
          onChangeText={(t) => setBillingCycle(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={2}
          containerStyle={{ flex: 1 }}
        />
        <TextInputField
          label="Due Day"
          placeholder="1-28"
          value={paymentDueDay}
          onChangeText={(t) => setPaymentDueDay(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={2}
          containerStyle={{ flex: 1 }}
        />
      </View>

      <TextInputField
        label="APR (%)"
        placeholder="36"
        value={apr}
        onChangeText={(t) => setApr(t.replace(/[^\d.]/g, ''))}
        keyboardType="decimal-pad"
        containerStyle={{ marginTop: SPACING.lg, marginBottom: SPACING.lg }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
