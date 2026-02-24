/**
 * CategoryModal — create/edit category bottom-sheet form.
 *
 * Name, type (INCOME/EXPENSE/INVESTMENT/DEBT), color picker grid,
 * subcategories CRUD. Mirrors web's CategoryModal.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { v4 as uuid } from 'uuid';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Category } from '@/types/db-types';
import {
  BottomSheetModal,
  TextInputField,
  SegmentedControl,
  Button,
  ErrorBanner,
  AnimatedPressable,
  GlassCard,
  SectionHeader,
  type Segment,
} from '@/components/ui';

// ─── Constants ───────────────────────────────────────────────────────────────

type CategoryType = 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'DEBT';

const TYPE_SEGMENTS: Segment<CategoryType>[] = [
  { value: 'EXPENSE', label: 'Expense', color: COLORS.expense, bgColor: COLORS.expenseBg },
  { value: 'INCOME', label: 'Income', color: COLORS.income, bgColor: COLORS.incomeBg },
  { value: 'INVESTMENT', label: 'Invest', color: COLORS.investment, bgColor: COLORS.investmentBg },
  { value: 'DEBT', label: 'Debt', color: COLORS.debt, bgColor: COLORS.debtBg },
];

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#64748b', '#6b7280',
];

const safeId = (): string => {
  try {
    return uuid();
  } catch {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => Promise<void>;
  initialData?: Category | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CategoryModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: CategoryModalProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [subCategories, setSubCategories] = useState<{ id: string; name: string }[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name);
      setType((initialData.type as CategoryType) || 'EXPENSE');
      setColor(initialData.color || COLOR_PALETTE[0]);
      setSubCategories(initialData.subCategories || []);
    } else {
      setName('');
      setType('EXPENSE');
      setColor(COLOR_PALETTE[0]);
      setSubCategories([]);
    }
    setNewSubName('');
    setError('');
    setLoading(false);
  }, [visible, initialData]);

  const addSubCategory = () => {
    if (!newSubName.trim()) return;
    setSubCategories([...subCategories, { id: safeId(), name: newSubName.trim() }]);
    setNewSubName('');
  };

  const removeSubCategory = (id: string) => {
    setSubCategories(subCategories.filter((s) => s.id !== id));
  };

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        color,
        subCategories: subCategories.length > 0 ? subCategories : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  }, [name, type, color, subCategories, onSubmit, onClose]);

  const footer = (
    <View style={styles.footer}>
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button
        title={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
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
      title={isEdit ? 'Edit Category' : 'New Category'}
      maxHeightRatio={0.9}
      footer={footer}
    >
      {error ? <ErrorBanner message={error} style={{ marginBottom: SPACING.md }} /> : null}

      {/* Name */}
      <TextInputField
        label="Category Name"
        placeholder="e.g. Groceries"
        value={name}
        onChangeText={setName}
        containerStyle={{ marginBottom: SPACING.lg }}
      />

      {/* Type */}
      <Text style={styles.sectionLabel}>Type</Text>
      <SegmentedControl<CategoryType>
        segments={TYPE_SEGMENTS}
        selected={type}
        onSelect={setType}
        columns={2}
        style={{ marginBottom: SPACING.lg }}
      />

      {/* Color Picker */}
      <Text style={styles.sectionLabel}>Color</Text>
      <View style={styles.colorGrid}>
        {COLOR_PALETTE.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && styles.colorSwatchSelected,
            ]}
          />
        ))}
      </View>

      {/* Subcategories */}
      <SectionHeader
        title={`Subcategories (${subCategories.length})`}
        style={{ marginTop: SPACING.md }}
      />

      {subCategories.length > 0 && (
        <GlassCard padding={0} style={{ marginBottom: SPACING.md, overflow: 'hidden' as const }}>
          {subCategories.map((sub, idx) => (
            <View
              key={sub.id}
              style={[
                styles.subRow,
                idx < subCategories.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: COLORS.border,
                },
              ]}
            >
              <View style={[styles.subDot, { backgroundColor: color }]} />
              <Text style={styles.subName}>{sub.name}</Text>
              <AnimatedPressable onPress={() => removeSubCategory(sub.id)}>
                <X size={16} color={COLORS.error} />
              </AnimatedPressable>
            </View>
          ))}
        </GlassCard>
      )}

      <View style={styles.addSubRow}>
        <View style={{ flex: 1 }}>
          <TextInputField
            placeholder="New subcategory name"
            value={newSubName}
            onChangeText={setNewSubName}
          />
        </View>
        <Button
          title="Add"
          variant="secondary"
          size="sm"
          icon={<Plus size={14} color={COLORS.textPrimary} />}
          onPress={addSubCategory}
          disabled={!newSubName.trim()}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  subDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  addSubRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
});
