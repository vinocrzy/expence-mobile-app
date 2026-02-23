/**
 * AmountInput — currency-prefixed number input with monospace display.
 *
 * Matches web: currency symbol absolutely positioned left, pl-8, font-mono, py-3.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AmountInput({
  value,
  onChangeText,
  currency = '₹',
  label,
  error,
  placeholder = '0.00',
  containerStyle,
}: AmountInputProps) {
  const inputRef = useRef<RNTextInput>(null);
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? 'rgba(147,51,234,0.5)'
    : error
      ? 'rgba(239,68,68,0.5)'
      : 'rgba(255,255,255,0.1)';

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  const handleChange = useCallback(
    (text: string) => {
      // Allow only digits and one decimal point
      const cleaned = text.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) return;
      onChangeText(cleaned);
    },
    [onChangeText],
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.container, { borderColor }]}>
        <View style={styles.currencyWrap}>
          <Text style={styles.currency}>{currency}</Text>
        </View>
        <RNTextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          selectionColor={COLORS.heroGradientEnd}
          keyboardType="decimal-pad"
          style={styles.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  currencyWrap: {
    paddingLeft: SPACING.lg,
    justifyContent: 'center',
  },
  currency: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md, // py-3
    minHeight: 48,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: 2,
  },
});
