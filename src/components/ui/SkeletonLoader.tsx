/**
 * SkeletonLoader — pulsing skeleton placeholder matching web's `animate-pulse`.
 *
 * Provides primitive shapes: line, circle, rect.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Animated } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '@/constants';

// ─── Pulse wrapper ───────────────────────────────────────────────────────────

function Pulse({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

// ─── Shape primitives ────────────────────────────────────────────────────────

interface ShapeProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLine({
  width = '100%',
  height = 14,
  borderRadius = BORDER_RADIUS.full,
  style,
}: ShapeProps) {
  return (
    <Pulse>
      <View
        style={[
          styles.base,
          { width: width as any, height, borderRadius },
          style,
        ]}
      />
    </Pulse>
  );
}

export function SkeletonCircle({
  width = 44,
  height,
  style,
}: Omit<ShapeProps, 'borderRadius'>) {
  const size = typeof width === 'number' ? width : 44;
  const h = height ?? size;
  return (
    <Pulse>
      <View
        style={[
          styles.base,
          { width: size, height: h, borderRadius: size / 2 },
          style,
        ]}
      />
    </Pulse>
  );
}

export function SkeletonRect({
  width = '100%',
  height = 80,
  borderRadius = BORDER_RADIUS['3xl'],
  style,
}: ShapeProps) {
  return (
    <Pulse>
      <View
        style={[
          styles.base,
          { width: width as any, height, borderRadius },
          style,
        ]}
      />
    </Pulse>
  );
}

// ─── Preset: Card skeleton (hero balance card placeholder) ───────────────────

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <Pulse>
        <View style={[styles.base, { width: 120, height: 14, borderRadius: BORDER_RADIUS.full }]} />
      </Pulse>
      <View style={{ height: SPACING.md }} />
      <Pulse>
        <View style={[styles.base, { width: 180, height: 36, borderRadius: BORDER_RADIUS.lg }]} />
      </Pulse>
      <View style={{ height: SPACING.sm }} />
      <Pulse>
        <View style={[styles.base, { width: 100, height: 20, borderRadius: BORDER_RADIUS.full }]} />
      </Pulse>
    </View>
  );
}

// ─── Preset: List row skeleton ───────────────────────────────────────────────

export function SkeletonRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      <SkeletonCircle width={44} />
      <View style={styles.rowText}>
        <SkeletonLine width="60%" height={14} />
        <View style={{ height: 6 }} />
        <SkeletonLine width="40%" height={10} />
      </View>
      <SkeletonLine width={64} height={16} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.white10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS['3xl'],
    padding: SPACING['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  rowText: {
    flex: 1,
  },
});
