/**
 * Shared Dashboard Screen — placeholder
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

export function SharedDashboardScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Shared Dashboard" showBack />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Household shared view</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  placeholder: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textTertiary,
  },
});
