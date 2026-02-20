/**
 * DonutChart — pure react-native-svg donut/pie chart.
 *
 * Used in Analytics for category breakdown. Renders arcs with optional
 * center label and tappable slices.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  onSlicePress?: (slice: DonutSlice, index: number) => void;
}

// ─── Arc math ────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DonutChart({
  data,
  size = 200,
  strokeWidth = 28,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;
  const gap = 2; // degrees gap between slices

  let currentAngle = 0;

  const arcs = data.map((slice) => {
    const sliceAngle = (slice.value / total) * 360;
    const start = currentAngle + gap / 2;
    const end = currentAngle + sliceAngle - gap / 2;
    currentAngle += sliceAngle;

    // For very small slices, skip rendering
    if (sliceAngle < 1) return null;

    // Handle full circle (single slice)
    if (sliceAngle >= 359) {
      const path = describeArc(cx, cy, radius, 0, 359.99);
      return { path, color: slice.color, label: slice.label };
    }

    const path = describeArc(cx, cy, radius, start, end);
    return { path, color: slice.color, label: slice.label };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {arcs.map((arc, i) =>
            arc ? (
              <Path
                key={i}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            ) : null,
          )}
        </G>
      </Svg>

      {/* Center label */}
      {(centerLabel || centerValue) && (
        <View style={styles.center}>
          {centerValue && <Text style={styles.centerValue}>{centerValue}</Text>}
          {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  centerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
