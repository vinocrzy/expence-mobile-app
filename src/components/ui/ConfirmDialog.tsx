/**
 * ConfirmDialog — confirmation modal matching web's ConfirmationModal.
 *
 * Icon + title + message, cancel/confirm footer.
 * Danger variant: red icon/button. Normal variant: blue icon/button.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { AlertTriangle, Info } from 'lucide-react-native';
import { Button } from './Button';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onClose,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.centered}>
          <Pressable style={styles.panel} onPress={() => {}}>
            {/* ── Icon + Title ── */}
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.iconWrap,
                  isDangerous ? styles.iconDanger : styles.iconInfo,
                ]}
              >
                {isDangerous ? (
                  <AlertTriangle size={ICON_SIZE.lg} color={COLORS.error} />
                ) : (
                  <Info size={ICON_SIZE.lg} color={COLORS.info} />
                )}
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
              </View>
            </View>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Button
                title={cancelText}
                variant="secondary"
                onPress={onClose}
                size="md"
              />
              <Button
                title={confirmText}
                variant={isDangerous ? 'danger' : 'primary'}
                onPress={onConfirm}
                loading={loading}
                size="md"
              />
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  centered: {
    width: '100%',
    maxWidth: 400,
  },
  panel: {
    backgroundColor: '#1f2937', // gray-800
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(55,65,81,0.5)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    padding: SPACING['2xl'],
    gap: SPACING.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  iconInfo: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  headerText: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(17,24,39,0.5)', // gray-900/50
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(55,65,81,0.5)',
  },
});
