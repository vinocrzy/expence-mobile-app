/**
 * SelectField — dropdown-style selector using a bottom sheet picker.
 * Renders as input-like row that opens a bottom sheet on press.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  type ViewStyle,
  type StyleProp,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface SelectFieldProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onSelect: (value: string) => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  searchable?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SelectField({
  label,
  placeholder = 'Select…',
  options,
  value,
  onSelect,
  error,
  containerStyle,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const handleSelect = (v: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onSelect(v);
    setOpen(false);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.trigger, error && styles.errorBorder]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {selected?.icon}
          <Text
            style={[
              styles.triggerText,
              !selected && styles.placeholder,
              selected?.icon ? { marginLeft: SPACING.sm } : undefined,
            ]}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <ChevronDown size={ICON_SIZE.md} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* ── Bottom sheet picker modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            {/* Handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <Text style={styles.sheetTitle}>{label ?? 'Select'}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionActive]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.optionLeft}>
                      {item.icon}
                      <Text
                        style={[
                          styles.optionText,
                          item.icon ? { marginLeft: SPACING.md } : undefined,
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={ICON_SIZE.md} color={COLORS.primaryLight} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    minHeight: 44,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triggerText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  errorBorder: {
    borderColor: 'rgba(239,68,68,0.5)',
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: 2,
  },

  // Sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0a0a0a', // gray-950
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING['2xl'],
    maxHeight: '60%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  list: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 2,
  },
  optionActive: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
  },
  optionTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
});
