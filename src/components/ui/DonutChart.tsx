/**
 * DonutChart — animated pie/donut chart powered by react-native-chart-kit.
 *
 * Renders a PieChart with a center-hole overlay (donut style), spring entry
 * animation, and optional center value + label text.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, FONT_SIZE } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  /** @deprecated kept for API compatibility — no longer used */
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  onSlicePress?: (slice: DonutSlice, index: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DonutChart({
  data,
  size = 200,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const scale = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const total = data.reduce((s, d) => s + d.value, 0);

  useEffect(() => {
    if (total === 0) return;
    scale.setValue(0.65);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (total === 0) return null;

  // The hole diameter sits over the pie center to create the donut ring look
  const holeDiameter = size * 0.52;

  const chartConfig = {
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
  };

  // react-native-chart-kit PieChart data shape
  const pieData = data.map((d) => ({
    name: d.label,
    population: d.value,
    color: d.color,
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 12,
  }));

  // With paddingLeft="0" and hasLegend=false the pie center is (size/2, size/2)
  const holeLeft = size / 2 - holeDiameter / 2;
  const holeTop = size / 2 - holeDiameter / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size, opacity, transform: [{ scale }] },
      ]}
    >
      <PieChart
        data={pieData}
        width={size}
        height={size}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="0"
        hasLegend={false}
        center={[0, 0]}
        absolute={false}
      />

      {/* Donut hole — covers the pie center to produce the ring effect */}
      <View
        style={[
          styles.hole,
          {
            width: holeDiameter,
            height: holeDiameter,
            borderRadius: holeDiameter / 2,
            left: holeLeft,
            top: holeTop,
          },
        ]}
      >
        {centerValue ? (
          <Text style={styles.centerValue}>{centerValue}</Text>
        ) : null}
        {centerLabel ? (
          <Text style={styles.centerLabel}>{centerLabel}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  hole: {
    position: 'absolute',
    // Match the GlassCard background so the hole blends with the card surface
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
});
