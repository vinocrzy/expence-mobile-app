/**
 * AnimatedAmount — spring-animated number display.
 *
 * Mirrors web's framer-motion useSpring: mass 0.8, stiffness 75, damping 15.
 * Uses reanimated shared value → derived formatted text.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Text, StyleSheet, type TextStyle, type StyleProp } from 'react-native';
import { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { COLORS, FONT_SIZE } from '@/constants';

interface AnimatedAmountProps {
  value: number;
  currency?: string;
  fractionDigits?: number;
  style?: StyleProp<TextStyle>;
}

const SPRING_CONFIG = {
  mass: 0.8,
  stiffness: 75,
  damping: 15,
};

/**
 * Format number with Indian-style grouping: 1,23,456
 */
function formatAmount(num: number, currency: string, digits: number): string {
  const rounded = Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
  const parts = rounded.toFixed(digits).split('.');
  const intPart = parts[0];
  const negative = intPart.startsWith('-');
  const raw = negative ? intPart.slice(1) : intPart;
  let grouped = '';
  if (raw.length <= 3) {
    grouped = raw;
  } else {
    grouped = raw.slice(-3);
    let rest = raw.slice(0, -3);
    while (rest.length > 2) {
      grouped = rest.slice(-2) + ',' + grouped;
      rest = rest.slice(0, -2);
    }
    if (rest.length > 0) grouped = rest + ',' + grouped;
  }
  return `${currency}${negative ? '-' : ''}${grouped}${parts[1] ? '.' + parts[1] : ''}`;
}

export function AnimatedAmount({
  value,
  currency = '₹',
  fractionDigits = 0,
  style,
}: AnimatedAmountProps) {
  const [display, setDisplay] = useState(() => formatAmount(value, currency, fractionDigits));
  const animVal = useSharedValue(value);

  const updateDisplay = useCallback(
    (v: number) => {
      setDisplay(formatAmount(v, currency, fractionDigits));
    },
    [currency, fractionDigits],
  );

  useEffect(() => {
    animVal.value = withSpring(value, SPRING_CONFIG, (finished) => {
      'worklet';
      if (finished) runOnJS(updateDisplay)(value);
    });
    // Also tick the display via a JS interval for smooth visual updates
    const start = animVal.value;
    const diff = value - start;
    const steps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        clearInterval(interval);
        setDisplay(formatAmount(value, currency, fractionDigits));
        return;
      }
      const t = step / steps;
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(formatAmount(start + diff * eased, currency, fractionDigits));
    }, 16);
    return () => clearInterval(interval);
  }, [value, currency, fractionDigits, animVal, updateDisplay]);

  return (
    <Text style={[styles.text, style]}>
      {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
});
