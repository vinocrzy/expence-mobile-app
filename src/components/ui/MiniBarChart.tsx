/**
 * MiniBarChart — lightweight SVG bar chart for Analytics.
 *
 * Renders vertical bars with optional labels and Y-axis.
 * Supports grouped bars (e.g. income + expense per month).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BarGroup {
  label: string;
  bars: { value: number; color: string }[];
}

interface MiniBarChartProps {
  data: BarGroup[];
  height?: number;
  barWidth?: number;
  gap?: number;
  showLabels?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MiniBarChart({
  data,
  height = 160,
  barWidth = 10,
  gap = 4,
  showLabels = true,
}: MiniBarChartProps) {
  if (data.length === 0) return null;

  const maxBars = Math.max(...data.map((g) => g.bars.length), 1);
  const groupWidth = maxBars * barWidth + (maxBars - 1) * gap;
  const groupGap = 16;
  const totalWidth = data.length * groupWidth + (data.length - 1) * groupGap;

  const allValues = data.flatMap((g) => g.bars.map((b) => b.value));
  const maxValue = Math.max(...allValues, 1);

  const labelHeight = showLabels ? 20 : 0;
  const chartHeight = height - labelHeight;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={totalWidth} height={height}>
        {/* Baseline */}
        <Line
          x1={0}
          y1={chartHeight}
          x2={totalWidth}
          y2={chartHeight}
          stroke={COLORS.border}
          strokeWidth={1}
        />

        {data.map((group, gi) => {
          const groupX = gi * (groupWidth + groupGap);
          return group.bars.map((bar, bi) => {
            const barH = maxValue > 0 ? (bar.value / maxValue) * (chartHeight - 8) : 0;
            const barX = groupX + bi * (barWidth + gap);
            const barY = chartHeight - barH;
            return (
              <Rect
                key={`${gi}-${bi}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={Math.max(barH, 1)}
                rx={barWidth / 2}
                fill={bar.color}
              />
            );
          });
        })}
      </Svg>

      {/* X labels */}
      {showLabels && (
        <View style={[styles.labelRow, { width: totalWidth }]}>
          {data.map((group, i) => (
            <Text
              key={i}
              style={[
                styles.label,
                { width: groupWidth + (i < data.length - 1 ? groupGap : 0) },
              ]}
              numberOfLines={1}
            >
              {group.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
