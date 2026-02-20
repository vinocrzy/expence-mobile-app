/**
 * LoanModal — create/edit loan bottom-sheet form.
 *
 * Fields: name, lender, type, principal, rate, tenure, start date,
 * initial paid EMIs, linked account, live EMI preview.
 * Mirrors web's LoanModal.tsx.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Loan, Account } from '@/types/db-types';
import {
  BottomSheetModal,
  TextInputField,
  AmountInput,
  SelectField,
  Button,
  ErrorBanner,
  GlassCard,
  type SelectOption,
} from '@/components/ui';

// ─── Constants ───────────────────────────────────────────────────────────────

const LOAN_TYPES: SelectOption[] = [
  { value: 'HOME', label: 'Home Loan' },
  { value: 'CAR', label: 'Car Loan' },
  { value: 'PERSONAL', label: 'Personal Loan' },
  { value: 'EDUCATION', label: 'Education Loan' },
  { value: 'BUSINESS', label: 'Business Loan' },
  { value: 'OTHER', label: 'Other' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface LoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  initialData?: Loan | null;
  accounts?: Account[];
}

// ─── EMI Calculator ──────────────────────────────────────────────────────────

function calcEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LoanModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  accounts = [],
}: LoanModalProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [type, setType] = useState('HOME');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [initialPaidEmis, setInitialPaidEmis] = useState('0');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name);
      setLender(initialData.lender || '');
      setType(initialData.type || 'HOME');
      setPrincipal(String(initialData.principal));
      setRate(String(initialData.interestRate));
      setTenure(String(initialData.tenureMonths));
      setStartDate(new Date(initialData.startDate));
      setInitialPaidEmis(String(initialData.initialPaidEmis || 0));
      setLinkedAccountId(initialData.linkedAccountId || '');
    } else {
      setName('');
      setLender('');
      setType('HOME');
      setPrincipal('');
      setRate('');
      setTenure('');
      setStartDate(new Date());
      setInitialPaidEmis('0');
      setLinkedAccountId('');
    }
    setError('');
    setLoading(false);
  }, [visible, initialData]);

  const emiPreview = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const t = parseInt(tenure) || 0;
    return calcEMI(p, r, t);
  }, [principal, rate, tenure]);

  const accountOptions: SelectOption[] = useMemo(
    () => [{ value: '', label: 'None' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))],
    [accounts],
  );

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!name.trim()) { setError('Loan name is required'); return; }
    if (!parseFloat(principal)) { setError('Enter a valid principal amount'); return; }
    if (!parseFloat(rate)) { setError('Enter interest rate'); return; }
    if (!parseInt(tenure)) { setError('Enter tenure in months'); return; }

    setLoading(true);
    try {
      const p = parseFloat(principal);
      const paidEmis = parseInt(initialPaidEmis) || 0;
      await onSubmit({
        name: name.trim(),
        lender: lender.trim() || undefined,
        type,
        principal: p,
        interestRate: parseFloat(rate),
        tenureMonths: parseInt(tenure),
        startDate: startDate.toISOString(),
        initialPaidEmis: paidEmis,
        paidEmis: paidEmis,
        emiAmount: emiPreview,
        outstandingPrincipal: p, // will be recalculated by service
        linkedAccountId: linkedAccountId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save loan');
    } finally {
      setLoading(false);
    }
  }, [name, lender, type, principal, rate, tenure, startDate, initialPaidEmis, linkedAccountId, emiPreview, onSubmit, onClose]);

  const onDateChange = useCallback((_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setStartDate(selected);
  }, []);

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Loan'}
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
      title={isEdit ? 'Edit Loan' : 'New Loan'}
      maxHeightRatio={0.92}
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      <TextInputField
        label="Loan Name"
        placeholder="e.g. Home Loan – SBI"
        value={name}
        onChangeText={setName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <TextInputField
        label="Lender"
        placeholder="e.g. State Bank of India"
        value={lender}
        onChangeText={setLender}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <SelectField
        label="Loan Type"
        placeholder="Select type"
        options={LOAN_TYPES}
        value={type}
        onSelect={setType}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <AmountInput
        label="Principal Amount"
        value={principal}
        onChangeText={setPrincipal}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextInputField
            label="Rate (%)"
            placeholder="e.g. 8.5"
            value={rate}
            onChangeText={setRate}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInputField
            label="Tenure (months)"
            placeholder="e.g. 240"
            value={tenure}
            onChangeText={setTenure}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* EMI Preview */}
      {emiPreview > 0 && (
        <GlassCard padding="md" style={styles.emiPreview}>
          <Text style={styles.emiLabel}>Estimated EMI</Text>
          <Text style={styles.emiValue}>
            ₹{emiPreview.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </GlassCard>
      )}

      {/* Start Date */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.dateLabel}>Start Date</Text>
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

      <TextInputField
        label="Initially Paid EMIs"
        placeholder="0"
        value={initialPaidEmis}
        onChangeText={setInitialPaidEmis}
        keyboardType="numeric"
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {accounts.length > 0 && (
        <SelectField
          label="Linked Account"
          placeholder="Select account (optional)"
          options={accountOptions}
          value={linkedAccountId}
          onSelect={setLinkedAccountId}
          containerStyle={{ marginBottom: SPACING.lg }}
        />
      )}
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
    marginBottom: SPACING.lg,
  },
  emiPreview: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  emiLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  emiValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.income,
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
