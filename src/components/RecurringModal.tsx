/**
 * RecurringModal — create/edit recurring transaction (subscription, EMI, etc.)
 *
 * Follows the same BottomSheetModal pattern as TransactionModal.
 * Fields: name, amount, type, frequency, account, category, start date.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import type { RecurringTransaction } from '@/types/db-types';
import { useCategories, useAccounts, useCreditCards } from '@/hooks/useLocalData';
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

// ─── Type segments (4 applicable types for recurring) ────────────────────────

type RecurringType = RecurringTransaction['type'];

const TYPE_SEGMENTS: Segment<RecurringType>[] = [
  { value: 'EXPENSE', label: 'Expense', color: COLORS.expense, bgColor: COLORS.expenseBg },
  { value: 'INCOME', label: 'Income', color: COLORS.income, bgColor: COLORS.incomeBg },
  { value: 'INVESTMENT', label: 'Invest', color: COLORS.investment, bgColor: COLORS.investmentBg },
  { value: 'DEBT', label: 'Debt', color: COLORS.debt, bgColor: COLORS.debtBg },
];

// ─── Frequency segments ──────────────────────────────────────────────────────

type Frequency = RecurringTransaction['frequency'];

const FREQ_SEGMENTS: Segment<Frequency>[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'WEEKLY', label: 'Weekly' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface RecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  initialData?: RecurringTransaction | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecurringModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: RecurringModalProps) {
  const isEdit = !!initialData;

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<RecurringType>('EXPENSE');
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset / hydrate
  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name);
      setAmount(String(initialData.amount));
      setType(initialData.type);
      setFrequency(initialData.frequency);
      setAccountId(initialData.accountId || '');
      setCategoryId(initialData.categoryId || '');
      setStartDate(new Date(initialData.startDate || initialData.nextDueDate));
    } else {
      setName('');
      setAmount('');
      setType('EXPENSE');
      setFrequency('MONTHLY');
      setAccountId('');
      setCategoryId('');
      setStartDate(new Date());
    }
    setError('');
    setLoading(false);
  }, [visible, initialData]);

  // Derived
  const allAccounts = useMemo(() => {
    const list = [...accounts];
    creditCards.forEach((cc) => {
      list.push({
        id: cc.id,
        name: cc.bankName || cc.name,
        type: 'CREDIT_CARD',
        currency: 'INR',
        householdId: cc.householdId,
      });
    });
    return list;
  }, [accounts, creditCards]);

  const accountOptions: SelectOption[] = useMemo(
    () => allAccounts.map((a) => ({ value: a.id, label: a.name })),
    [allAccounts],
  );

  const filteredCategories = useMemo(
    () => categories.filter((c) => !c.type || c.type === type),
    [categories, type],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => filteredCategories.map((c) => ({ value: c.id, label: c.name })),
    [filteredCategories],
  );

  // Submit
  const handleSubmit = useCallback(async () => {
    setError('');
    if (!name.trim()) { setError('Enter a name'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        frequency,
        startDate: startDate.toISOString(),
        nextDueDate: startDate.toISOString(),
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        status: 'ACTIVE',
      } as any);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [name, amount, type, frequency, startDate, accountId, categoryId, onSubmit, onClose]);

  const onDateChange = useCallback((_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setStartDate(selected);
  }, []);

  // Footer
  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Recurring'}
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
      title={isEdit ? 'Edit Recurring' : 'New Recurring'}
      maxHeightRatio={0.92}
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      {/* Name */}
      <TextInputField
        label="Name"
        placeholder="Netflix, Rent, EMI…"
        value={name}
        onChangeText={setName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Type */}
      <SegmentedControl<RecurringType>
        segments={TYPE_SEGMENTS}
        selected={type}
        onSelect={setType}
        columns={4}
        style={{ marginBottom: SPACING.lg }}
      />

      {/* Frequency */}
      <SegmentedControl<Frequency>
        segments={FREQ_SEGMENTS}
        selected={frequency}
        onSelect={setFrequency}
        columns={4}
        style={{ marginBottom: SPACING.lg }}
      />

      {/* Amount */}
      <AmountInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        currency="₹"
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Account */}
      <SelectField
        label="Account"
        placeholder="Select account"
        options={accountOptions}
        value={accountId}
        onSelect={setAccountId}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Category */}
      {categoryOptions.length > 0 && (
        <SelectField
          label="Category"
          placeholder="Select category"
          options={categoryOptions}
          value={categoryId}
          onSelect={setCategoryId}
          containerStyle={{ marginBottom: SPACING.lg }}
        />
      )}

      {/* Start / Next Due Date */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.dateLabel}>
          {isEdit ? 'Next Due Date' : 'Start Date'}
        </Text>
        <Button
          title={startDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
          variant="outline"
          onPress={() => setShowDatePicker(true)}
        />
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
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
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
