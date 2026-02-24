/**
 * MiniBarChart — animated line chart for Analytics income vs expense trends.
 *
 * Uses react-native-chart-kit LineChart with bezier curves and a fade+slide
 * entry animation via React Native's Animated API.
 * Supports multiple series (e.g. income + expense per month as two lines).
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BarGroup {
  label: string;
  bars: { value: number; color: string }[];
}

interface MiniBarChartProps {
  data: BarGroup[];
  height?: number;
  /** @deprecated kept for API compatibility — no longer used */
  barWidth?: number;
  /** @deprecated kept for API compatibility — no longer used */
  gap?: number;
  showLabels?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MiniBarChart({
  data,
  height = 160,
}: MiniBarChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  // screen padding (16×2) + card padding (16×2)
  const chartWidth = screenWidth - SPACING.lg * 4;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  if (data.length === 0) return null;

  // Build one dataset per bar index (e.g. index 0 = income, index 1 = expense)
  const numSeries = Math.max(...data.map((g) => g.bars.length), 1);
  const labels = data.map((g) => g.label);

  const datasets = Array.from({ length: numSeries }, (_, di) => {
    const seriesColor = data.find((g) => g.bars[di] != null)?.bars[di]?.color ?? COLORS.primaryLight;
    return {
      data: data.map((g) => Math.max(g.bars[di]?.value ?? 0, 0)),
      color: (opacity = 1) => {
        const hex = seriesColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${opacity})`;
      },
      strokeWidth: 2,
    };
  });

  const chartConfig = {
    backgroundGradientFrom: '#1c1c1e',
    backgroundGradientTo: '#1c1c1e',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(255,255,255,${opacity * 0.15})`,
    labelColor: () => COLORS.textTertiary,
    strokeWidth: 2,
    propsForLabels: {
      fontSize: String(FONT_SIZE.xs),
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
    },
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LineChart
        data={{ labels, datasets }}
        width={chartWidth}
        height={height}
        chartConfig={chartConfig}
        bezier
        withInnerLines={false}
        withOuterLines={false}
        withShadow={false}
        fromZero
        style={styles.chart}
      />
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginHorizontal: -SPACING.sm,
  },
  chart: {
    borderRadius: 8,
  },
});
