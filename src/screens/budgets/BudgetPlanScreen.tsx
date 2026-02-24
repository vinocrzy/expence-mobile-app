/**
 * BudgetPlanScreen — plan item editor for event budgets.
 *
 * Add/remove plan items (name, amount, quantity). Total vs budget.
 * Mirrors web's budgets/[id]/plan page.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList, MoreStackParamList } from '@/navigation/types';
import { budgetService } from '@/lib/localdb-services';
import {
  ScreenHeader,
  GlassCard,
  Button,
  TextInputField,
  AmountInput,
  EmptyState,
  SkeletonCard,
  AnimatedPressable,
  SectionHeader,
} from '@/components/ui';

type Props = NativeStackScreenProps<MoreStackParamList, 'BudgetPlan'>;

const fmt = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function BudgetPlanScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [budget, setBudget] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New item form
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const b = await budgetService.getById(id);
      if (b) {
        setBudget(b);
        setItems((b as any).planItems || []);
      }
    } catch (e) {
      console.error('[BudgetPlan] fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPlanned = items.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalBudget = budget?.totalBudget || 0;
  const overBudget = totalBudget > 0 && totalPlanned > totalBudget;

  const handleAddItem = async () => {
    if (!itemName.trim() || !itemAmount.trim()) return;
    setAdding(true);
    try {
      const qty = parseInt(itemQty) || 1;
      const newItem = await budgetService.addPlanItem(id, {
        name: itemName.trim(),
        totalAmount: parseFloat(itemAmount) * qty,
        unitAmount: parseFloat(itemAmount),
        quantity: qty,
      });
      setItems([...items, newItem]);
      setItemName('');
      setItemAmount('');
      setItemQty('1');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Haptics.selectionAsync();
    Alert.alert('Remove Item?', 'This item will be removed from the plan.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setItems(items.filter((i) => i.id !== itemId));
          await budgetService.removePlanItem(id, itemId);
        },
      },
    ]);
  };

  const handleActivate = () => {
    Alert.alert('Activate Budget?', 'This will lock the plan and set the budget as active.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Activate',
        onPress: async () => {
          try {
            await budgetService.activate(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to activate budget');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Budget Plan" showBack />
        <View style={styles.content}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Budget Plan" showBack />
        <EmptyState
          title="Budget not found"
          icon={<ShoppingBag size={ICON_SIZE.xl} color={COLORS.textTertiary} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={budget.name} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Planned</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: overBudget ? COLORS.error : COLORS.income },
                ]}
              >
                {fmt(totalPlanned)}
              </Text>
            </View>
            {totalBudget > 0 && (
              <View style={{ alignItems: 'flex-end' as const }}>
                <Text style={styles.summaryLabel}>Budget</Text>
                <Text style={styles.summaryValue}>{fmt(totalBudget)}</Text>
              </View>
            )}
          </View>
          {overBudget && (
            <View style={styles.warningRow}>
              <AlertTriangle size={14} color={COLORS.error} />
              <Text style={styles.warningText}>
                Over budget by {fmt(totalPlanned - totalBudget)}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Add Item Form */}
        <SectionHeader title="Add Item" />
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <TextInputField
            label="Item Name"
            value={itemName}
            onChangeText={setItemName}
            placeholder="e.g. Decoration"
          />
          <View style={styles.formRow}>
            <View style={{ flex: 2 }}>
              <AmountInput
                label="Unit Price"
                value={itemAmount}
                onChangeText={setItemAmount}
                placeholder="0"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInputField
                label="Qty"
                value={itemQty}
                onChangeText={setItemQty}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Button
            title={adding ? 'Adding…' : 'Add Item'}
            onPress={handleAddItem}
            variant="primary"
            icon={<Plus size={18} color="#fff" />}
            disabled={!itemName.trim() || !itemAmount.trim() || adding}
            style={{ marginTop: SPACING.sm }}
          />
        </GlassCard>

        {/* Items List */}
        <SectionHeader title={`Plan Items (${items.length})`} />
        {items.length === 0 ? (
          <GlassCard padding="lg">
            <Text style={styles.emptyText}>No items yet — add some above</Text>
          </GlassCard>
        ) : (
          <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
            {items.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  idx < items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: COLORS.border,
                  },
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    {item.quantity > 1
                      ? `${fmt(item.unitAmount || 0)} × ${item.quantity}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>{fmt(item.totalAmount || 0)}</Text>
                  <AnimatedPressable onPress={() => handleRemoveItem(item.id)}>
                    <Trash2 size={16} color={COLORS.error} />
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Activate Button */}
        {budget.status !== 'ACTIVE' && items.length > 0 && (
          <Button
            title="Activate Budget"
            onPress={handleActivate}
            variant="primary"
            icon={<CheckCircle size={18} color="#fff" />}
            style={{ marginTop: SPACING.xl }}
          />
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary },

  warningRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  warningText: { fontSize: FONT_SIZE.xs, color: COLORS.error, fontWeight: '600' },

  formRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  itemSub: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  itemAmount: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.textPrimary },

  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: 'center' },
});
