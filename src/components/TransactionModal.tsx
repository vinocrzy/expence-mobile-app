/**
 * TransactionModal — full CRUD bottom-sheet form for creating/editing transactions.
 *
 * Type toggle (5 types), amount, description, account, category, date, notes.
 * Mirrors web's TransactionModal.tsx.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Transaction, TransactionType, Category, Account } from '@/types/db-types';
import {
  useCategories,
  useAccounts,
  useCreditCards,
} from '@/hooks/useLocalData';
import {
  BottomSheetModal,
  SegmentedControl,
  AmountInput,
  TextInputField,
  SelectField,
  Button,
  ErrorBanner,
  type Segment,
  type SelectOption,
} from '@/components/ui';

// ─── Segment definitions ─────────────────────────────────────────────────────

const TYPE_SEGMENTS: Segment<TransactionType>[] = [
  { value: 'EXPENSE', label: 'Expense', color: COLORS.expense, bgColor: COLORS.expenseBg },
  { value: 'INCOME', label: 'Income', color: COLORS.income, bgColor: COLORS.incomeBg },
  { value: 'TRANSFER', label: 'Transfer', color: COLORS.transfer, bgColor: COLORS.transferBg },
  { value: 'INVESTMENT', label: 'Investment', color: COLORS.investment, bgColor: COLORS.investmentBg },
  { value: 'DEBT', label: 'Debt', color: COLORS.debt, bgColor: COLORS.debtBg },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  /** Pass a transaction object to enter edit mode */
  initialData?: Transaction | null;
  /** Pre-select a type when creating */
  initialType?: TransactionType;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  initialType = 'EXPENSE',
}: TransactionModalProps) {
  const isEdit = !!initialData;

  // Data hooks
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();

  // Form state
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transferAccountId, setTransferAccountId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Reset / hydrate form ──────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setType(initialData.type);
      setAmount(String(initialData.amount));
      setDescription(initialData.description || '');
      setAccountId(initialData.accountId);
      setCategoryId(initialData.categoryId || '');
      setTransferAccountId(initialData.transferAccountId || '');
      setDate(new Date(initialData.date));
    } else {
      setType(initialType);
      setAmount('');
      setDescription('');
      setAccountId('');
      setCategoryId('');
      setTransferAccountId('');
      setDate(new Date());
    }
    setError('');
    setLoading(false);
  }, [visible, initialData, initialType]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const allAccounts = useMemo(() => {
    const list: (Account & { _ccFlag?: boolean })[] = [...accounts];
    creditCards.forEach((cc) => {
      list.push({
        id: cc.id,
        name: cc.bankName || cc.name,
        type: 'CREDIT_CARD',
        currency: 'INR',
        householdId: cc.householdId,
        _ccFlag: true,
      });
    });
    return list;
  }, [accounts, creditCards]);

  const accountOptions: SelectOption[] = useMemo(
    () => allAccounts.map((a) => ({ value: a.id, label: a.name })),
    [allAccounts],
  );

  const transferAccountOptions: SelectOption[] = useMemo(
    () => allAccounts.filter((a) => a.id !== accountId).map((a) => ({ value: a.id, label: a.name })),
    [allAccounts, accountId],
  );

  const filteredCategories = useMemo(() => {
    if (type === 'TRANSFER') return [];
    return categories.filter((c) => !c.type || c.type === type);
  }, [categories, type]);

  const categoryOptions: SelectOption[] = useMemo(
    () => filteredCategories.map((c) => ({ value: c.id, label: c.name })),
    [filteredCategories],
  );

  // Currency from selected account
  const selectedAccount = allAccounts.find((a) => a.id === accountId);
  const currencySymbol = useMemo(() => {
    const c = selectedAccount?.currency;
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    return '₹';
  }, [selectedAccount]);

  // ── Validation & Submit ───────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!accountId) {
      setError('Select an account');
      return;
    }
    if (type === 'TRANSFER' && !transferAccountId) {
      setError('Select a destination account');
      return;
    }
    if (type === 'TRANSFER' && transferAccountId === accountId) {
      setError('Source and destination cannot be the same');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        type,
        description: description.trim(),
        date: date.toISOString(),
        accountId,
        categoryId: type === 'TRANSFER' ? undefined : categoryId || undefined,
        transferAccountId: type === 'TRANSFER' ? transferAccountId : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  }, [amount, accountId, type, transferAccountId, categoryId, description, date, onSubmit, onClose]);

  // ── Date picker handler ───────────────────────────────────────────────────

  const onDateChange = useCallback((_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction'}
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
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
      maxHeightRatio={0.92}
      footer={footer}
    >
      {/* Error */}
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      {/* Type selector */}
      <SegmentedControl<TransactionType>
        segments={TYPE_SEGMENTS}
        selected={type}
        onSelect={setType}
        columns={3}
        style={{ marginBottom: SPACING.lg }}
      />

      {/* Amount */}
      <AmountInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        currency={currencySymbol}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Description */}
      <TextInputField
        label="Description"
        placeholder="What is this for?"
        value={description}
        onChangeText={setDescription}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Account */}
      <SelectField
        label={type === 'TRANSFER' ? 'From Account' : 'Account'}
        placeholder="Select account"
        options={accountOptions}
        value={accountId}
        onSelect={setAccountId}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Transfer destination */}
      {type === 'TRANSFER' && (
        <SelectField
          label="To Account"
          placeholder="Select destination"
          options={transferAccountOptions}
          value={transferAccountId}
          onSelect={setTransferAccountId}
          containerStyle={{ marginBottom: SPACING.lg }}
        />
      )}

      {/* Category (hidden for transfers) */}
      {type !== 'TRANSFER' && categoryOptions.length > 0 && (
        <SelectField
          label="Category"
          placeholder="Select category"
          options={categoryOptions}
          value={categoryId}
          onSelect={setCategoryId}
          containerStyle={{ marginBottom: SPACING.lg }}
        />
      )}

      {/* Date */}
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
