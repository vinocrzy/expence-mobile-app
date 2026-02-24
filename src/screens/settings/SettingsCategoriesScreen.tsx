/**
 * SettingsCategoriesScreen — CRUD for expense/income categories.
 *
 * Filter bar (ALL/EXPENSE/INCOME/INVESTMENT/DEBT), grouped list with
 * color dot + name + chevron, FAB to add new. CategoryModal for create/edit.
 * Mirrors web settings/categories/page.tsx.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Alert,
} from 'react-native';
import { Plus, ChevronRight, Tag } from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { Category } from '@/types/db-types';
import { useCategories } from '@/hooks/useLocalData';
import { CategoryModal } from '@/components/CategoryModal';
import {
  ScreenHeader,
  GlassCard,
  AnimatedPressable,
  SegmentedControl,
  EmptyState,
  SkeletonRow,
  type Segment,
} from '@/components/ui';

// ─── Filters ─────────────────────────────────────────────────────────────────

type FilterValue = 'ALL' | 'EXPENSE' | 'INCOME' | 'INVESTMENT' | 'DEBT';

const FILTER_SEGMENTS: Segment<FilterValue>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EXPENSE', label: 'Expense', color: COLORS.expense },
  { value: 'INCOME', label: 'Income', color: COLORS.income },
  { value: 'INVESTMENT', label: 'Invest', color: COLORS.investment },
  { value: 'DEBT', label: 'Debt', color: COLORS.debt },
];

const GROUP_TITLES: Record<string, string> = {
  EXPENSE: 'Expenses',
  INCOME: 'Income',
  INVESTMENT: 'Investments',
  DEBT: 'Debt / Loans',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsCategoriesScreen() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  // Group categories by type, then filter
  const sections = useMemo(() => {
    const filtered =
      filter === 'ALL' ? categories : categories.filter((c) => c.type === filter);

    const groups: Record<string, Category[]> = {};
    filtered.forEach((cat) => {
      const key = cat.type || 'EXPENSE';
      if (!groups[key]) groups[key] = [];
      groups[key].push(cat);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => {
        const order = ['EXPENSE', 'INCOME', 'INVESTMENT', 'DEBT'];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map(([type, data]) => ({
        title: GROUP_TITLES[type] || type,
        data,
      }));
  }, [categories, filter]);

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmit = useCallback(
    async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      if (editing) {
        await updateCategory(editing.id, data);
      } else {
        await addCategory(data);
      }
    },
    [editing, addCategory, updateCategory],
  );

  const handleDelete = (cat: Category) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCategory(cat.id),
      },
    ]);
  };

  // ── Row renderer ────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Category }) => (
    <AnimatedPressable
      style={styles.row}
      onPress={() => handleEdit(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.colorDot, { backgroundColor: item.color || COLORS.textTertiary }]} />
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{item.name}</Text>
        {item.subCategories && item.subCategories.length > 0 && (
          <Text style={styles.rowSub}>
            {item.subCategories.length} subcategor{item.subCategories.length === 1 ? 'y' : 'ies'}
          </Text>
        )}
      </View>
      <ChevronRight size={16} color={COLORS.textTertiary} />
    </AnimatedPressable>
  );

  const renderHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Manage Categories" showBack />

      {/* Filter */}
      <View style={styles.filterWrap}>
        <SegmentedControl
          segments={FILTER_SEGMENTS}
          selected={filter}
          onSelect={setFilter}
          columns={5}
          size="sm"
        />
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : sections.length === 0 ? (
        <EmptyState
          icon={<Tag size={32} color={COLORS.textTertiary} />}
          title="No Categories"
          description="Tap + to create your first category."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          SectionSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}

      <AnimatedPressable style={styles.fab} onPress={handleAdd}>
        <Plus size={22} color="#fff" />
      </AnimatedPressable>

      <CategoryModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  skeletonWrap: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  rowContent: { flex: 1 },
  rowName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 42,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
