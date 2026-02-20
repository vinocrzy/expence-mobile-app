/**
 * ErrorBanner — inline error message matching web's error block.
 * bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';

interface ErrorBannerProps {
  message: string;
  style?: StyleProp<ViewStyle>;
}

export function ErrorBanner({ message, style }: ErrorBannerProps) {
  return (
    <View style={[styles.container, style]}>
      <AlertCircle size={ICON_SIZE.md} color={COLORS.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  text: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    lineHeight: 18,
  },
});
