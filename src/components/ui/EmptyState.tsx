/**
 * EmptyState — centered empty/placeholder view.
 *
 * Icon → title → description → optional action button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionWrap}>
          <Button title={actionLabel} onPress={onAction} size="md" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
    minHeight: 200,
  },
  iconWrap: {
    marginBottom: SPACING.lg,
    opacity: 0.5,
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  actionWrap: {
    marginTop: SPACING.xl,
  },
});
