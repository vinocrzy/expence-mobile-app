/**
 * Loan Detail Screen — placeholder
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDetail'>;

export function LoanDetailScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Loan Details" showBack />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Loan: {route.params.id}</Text>
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
