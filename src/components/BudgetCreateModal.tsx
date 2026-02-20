/**
 * BudgetCreateModal — create/edit budget bottom sheet.
 *
 * Fields: name, mode (EVENT / RECURRING), dates, category allocations.
 * Dynamic category → amount rows with auto-computed total.
 * Mirrors web's budgets/create/page.tsx as a bottom-sheet modal.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, Trash2 } from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { Budget, BudgetCategoryLimit } from '@/types/db-types';
import { useCategories } from '@/hooks/useLocalData';
import {
  BottomSheetModal,
  SegmentedControl,
  TextInputField,
  AmountInput,
  SelectField,
  Button,
  ErrorBanner,
  type Segment,
  type SelectOption,
} from '@/components/ui';

// ─── Mode segments ───────────────────────────────────────────────────────────

type BudgetMode = 'RECURRING' | 'EVENT';

const MODE_SEGMENTS: Segment<BudgetMode>[] = [
  { value: 'RECURRING', label: 'Monthly' },
  { value: 'EVENT', label: 'Event' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  initialData?: Budget | null;
}

// ─── Allocation row type ─────────────────────────────────────────────────────

interface AllocationRow {
  key: string;
  categoryId: string;
  amount: string;
}

let rowCounter = 0;

// ─── Component ───────────────────────────────────────────────────────────────

export function BudgetCreateModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: BudgetCreateModalProps) {
  const isEdit = !!initialData;
  const { categories } = useCategories();

  // Form state
  const [name, setName] = useState('');
  const [mode, setMode] = useState<BudgetMode>('RECURRING');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset / hydrate
  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name);
      setMode((initialData.budgetMode as BudgetMode) || 'RECURRING');
      if (initialData.startDate) setStartDate(new Date(initialData.startDate));
      if (initialData.endDate) setEndDate(new Date(initialData.endDate));
      if (initialData.budgetLimitConfig?.length) {
        setAllocations(
          initialData.budgetLimitConfig.map((a) => ({
            key: `row_${++rowCounter}`,
            categoryId: a.categoryId,
            amount: String(a.amount),
          })),
        );
      } else {
        setAllocations([]);
      }
    } else {
      setName('');
      setMode('RECURRING');
      setStartDate(new Date());
      const future = new Date();
      future.setMonth(future.getMonth() + 1);
      setEndDate(future);
      setAllocations([]);
    }
    setError('');
    setLoading(false);
  }, [visible, initialData]);

  // Category options (expense categories only)
  const expenseCategories = useMemo(
    () => categories.filter((c) => !c.type || c.type === 'EXPENSE'),
    [categories],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => expenseCategories.map((c) => ({ value: c.id, label: c.name })),
    [expenseCategories],
  );

  // Used category IDs (to avoid duplicates)
  const usedCategoryIds = useMemo(
    () => new Set(allocations.map((a) => a.categoryId).filter(Boolean)),
    [allocations],
  );

  // Total
  const total = useMemo(
    () => allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0),
    [allocations],
  );

  // Add / remove allocation rows
  const addRow = useCallback(() => {
    setAllocations((prev) => [
      ...prev,
      { key: `row_${++rowCounter}`, categoryId: '', amount: '' },
    ]);
  }, []);

  const removeRow = useCallback((key: string) => {
    setAllocations((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const updateRow = useCallback((key: string, field: 'categoryId' | 'amount', value: string) => {
    setAllocations((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }, []);

  // Submit
  const handleSubmit = useCallback(async () => {
    setError('');
    if (!name.trim()) { setError('Enter a budget name'); return; }
    if (allocations.length === 0) { setError('Add at least one category allocation'); return; }
    if (allocations.some((a) => !a.categoryId || !a.amount || parseFloat(a.amount) <= 0)) {
      setError('Fix empty or invalid allocations');
      return;
    }

    setLoading(true);
    try {
      const budgetLimitConfig: BudgetCategoryLimit[] = allocations.map((a) => ({
        categoryId: a.categoryId,
        amount: parseFloat(a.amount),
      }));

      await onSubmit({
        name: name.trim(),
        budgetMode: mode,
        status: 'ACTIVE',
        startDate: startDate.toISOString(),
        endDate: mode === 'EVENT' ? endDate.toISOString() : undefined,
        totalBudget: total,
        totalSpent: initialData?.totalSpent ?? 0,
        budgetLimitConfig,
      } as any);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  }, [name, mode, startDate, endDate, allocations, total, initialData, onSubmit, onClose]);

  // Date handlers
  const onStartChange = useCallback((_: any, d?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (d) setStartDate(d);
  }, []);

  const onEndChange = useCallback((_: any, d?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (d) setEndDate(d);
  }, []);

  // Footer
  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Budget'}
        variant="primary"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ flex: 2 }}
      />
    </View>
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit Budget' : 'Create Budget'}
      maxHeightRatio={0.92}
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      {/* Name */}
      <TextInputField
        label="Budget Name"
        placeholder="Groceries, Paris Trip…"
        value={name}
        onChangeText={setName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Mode */}
      <SegmentedControl<BudgetMode>
        segments={MODE_SEGMENTS}
        selected={mode}
        onSelect={setMode}
        columns={2}
        style={{ marginBottom: SPACING.lg }}
      />

      {/* Dates */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.dateLabel}>Start Date</Text>
        <Button title={fmt(startDate)} variant="outline" onPress={() => setShowStartPicker(true)} />
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartChange}
            themeVariant="dark"
          />
        )}
      </View>

      {mode === 'EVENT' && (
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={styles.dateLabel}>End Date</Text>
          <Button title={fmt(endDate)} variant="outline" onPress={() => setShowEndPicker(true)} />
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndChange}
              minimumDate={startDate}
              themeVariant="dark"
            />
          )}
        </View>
      )}

      {/* Category allocations header */}
      <View style={styles.allocHeader}>
        <Text style={styles.allocTitle}>Category Allocations</Text>
        <Pressable style={styles.addBtn} onPress={addRow} hitSlop={8}>
          <Plus size={16} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {/* Allocation rows */}
      {allocations.map((row) => (
        <View key={row.key} style={styles.allocRow}>
          <View style={{ flex: 2 }}>
            <SelectField
              placeholder="Category"
              options={categoryOptions.filter(
                (o) => !usedCategoryIds.has(o.value) || o.value === row.categoryId,
              )}
              value={row.categoryId}
              onSelect={(v) => updateRow(row.key, 'categoryId', v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AmountInput
              value={row.amount}
              onChangeText={(v) => updateRow(row.key, 'amount', v)}
              currency="₹"
            />
          </View>
          <Pressable onPress={() => removeRow(row.key)} hitSlop={8} style={styles.deleteBtn}>
            <Trash2 size={16} color={COLORS.error} />
          </Pressable>
        </View>
      ))}

      {/* Total */}
      {allocations.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Budget</Text>
          <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
      )}
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
  allocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  allocTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white5,
  },
  addBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.primary,
  },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  totalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
});
