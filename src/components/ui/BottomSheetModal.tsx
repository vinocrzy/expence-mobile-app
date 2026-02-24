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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

function normalizeNode(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === 'boolean') {
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return <Text style={styles.inlineText}>{String(node)}</Text>;
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => <React.Fragment key={index}>{normalizeNode(child)}</React.Fragment>);
  }

  return node;
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
  const footerBottomPadding = Math.max(insets.bottom, SPACING.lg) + SPACING.md;
  const sheetBottomSpacer = Math.max(insets.bottom, SPACING.lg);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            contentContainerStyle={[
              styles.bodyContent,
              footer ? styles.bodyContentWithFooter : null,
            ]}
          >
            {normalizeNode(children)}
          </ScrollView>

          {/* ── Footer ── */}
          {footer && (
            <View
              style={[
                styles.footer,
                { paddingBottom: footerBottomPadding },
              ]}
            >
              <View style={styles.footerContent}>{normalizeNode(footer)}</View>
            </View>
          )}

            {/* Safe-area padding when no footer */}
            {!footer && <View style={{ height: sheetBottomSpacer }} />}
          </View>
        </KeyboardAvoidingView>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  wrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
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
  inlineText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.base,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  bodyContentWithFooter: {
    paddingBottom: SPACING.lg,
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
  footerContent: {
    width: '100%',
  },
});
