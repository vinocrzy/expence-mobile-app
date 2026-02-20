/**
 * AccountModal — create/edit account bottom-sheet form.
 *
 * Fields: name, type, balance, currency.
 * Mirrors web's AccountModal.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { COLORS, SPACING } from '@/constants';
import type { Account } from '@/types/db-types';
import {
  BottomSheetModal,
  TextInputField,
  AmountInput,
  SelectField,
  Button,
  ErrorBanner,
  type SelectOption,
} from '@/components/ui';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: SelectOption[] = [
  { value: 'BANK', label: 'Bank' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CHECKING', label: 'Checking' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'CASH_RESERVE', label: 'Cash Reserve' },
];

const CURRENCIES: SelectOption[] = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  initialData?: Account | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AccountModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: AccountModalProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type || 'BANK');
      setBalance(String(initialData.balance || 0));
      setCurrency(initialData.currency || 'INR');
    } else {
      setName('');
      setType('BANK');
      setBalance('');
      setCurrency('INR');
    }
    setError('');
    setLoading(false);
  }, [visible, initialData]);

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        currency,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  }, [name, type, balance, currency, onSubmit, onClose]);

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
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
      title={isEdit ? 'Edit Account' : 'New Account'}
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      <TextInputField
        label="Account Name"
        placeholder="e.g. HDFC Savings"
        value={name}
        onChangeText={setName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <SelectField
        label="Account Type"
        placeholder="Select type"
        options={ACCOUNT_TYPES}
        value={type}
        onSelect={setType}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <AmountInput
        label="Initial Balance"
        value={balance}
        onChangeText={setBalance}
        currency={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹'}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <SelectField
        label="Currency"
        placeholder="Select currency"
        options={CURRENCIES}
        value={currency}
        onSelect={setCurrency}
        containerStyle={{ marginBottom: SPACING.lg }}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
