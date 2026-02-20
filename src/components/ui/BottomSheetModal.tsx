/**
 * BottomSheetModal — reusable bottom sheet matching web's modal/sheet pattern.
 *
 * Backdrop: black/60, blur.
 * Sheet: bg-gray-950, rounded-t-[40px], handle bar, scrollable body.
 * Uses React Native Modal for simplicity (Phase 5). Can be upgraded to
 * @gorhom/bottom-sheet with gesture drag in later phases.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, ICON_SIZE, HIT_SLOP } from '@/constants';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Optional footer (action buttons) – rendered below scroll */
  footer?: React.ReactNode;
  /** Max height as percentage 0-1, default 0.85 */
  maxHeightRatio?: number;
  style?: StyleProp<ViewStyle>;
}

export function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
  footer,
  maxHeightRatio = 0.85,
  style,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}
      >
        <View
          style={[
            styles.sheet,
            { maxHeight: `${Math.round(maxHeightRatio * 100)}%` as any },
            style,
          ]}
        >
          {/* ── Handle ── */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* ── Header ── */}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={HIT_SLOP}
                activeOpacity={0.7}
              >
                <X size={ICON_SIZE.lg} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Body ── */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.bodyContent}
          >
            {children}
          </ScrollView>

          {/* ── Footer ── */}
          {footer && (
            <View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom + SPACING.lg },
              ]}
            >
              {footer}
            </View>
          )}

          {/* Safe-area padding when no footer */}
          {!footer && <View style={{ height: insets.bottom + SPACING.lg }} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  wrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0a0a0a', // gray-950
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(55,65,81,0.5)',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(55,65,81,0.5)',
  },
});
