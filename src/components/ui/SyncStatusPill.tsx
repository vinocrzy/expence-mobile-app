/**
 * SyncStatusPill — colored pill indicating PouchDB sync state.
 *
 * Status: SYNCING, ERROR, OFFLINE, DISABLED, COMPLETED
 * Matches web's SyncStatus component.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  RefreshCw,
  AlertTriangle,
  WifiOff,
  Pause,
  CheckCircle,
  Smartphone,
} from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SyncState = 'SYNCING' | 'ERROR' | 'OFFLINE' | 'DISABLED' | 'COMPLETED' | 'LOCAL_ONLY';

interface SyncStatusPillProps {
  status: SyncState;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SyncState,
  { icon: React.ReactNode; color: string; bg: string; defaultLabel: string }
> = {
  SYNCING: {
    icon: <RefreshCw size={ICON_SIZE.sm} color={COLORS.info} />,
    color: COLORS.info,
    bg: 'rgba(59,130,246,0.1)',
    defaultLabel: 'Syncing…',
  },
  ERROR: {
    icon: <AlertTriangle size={ICON_SIZE.sm} color={COLORS.warning} />,
    color: COLORS.warning,
    bg: 'rgba(245,158,11,0.1)',
    defaultLabel: 'Sync Error',
  },
  OFFLINE: {
    icon: <WifiOff size={ICON_SIZE.sm} color={COLORS.textTertiary} />,
    color: COLORS.textTertiary,
    bg: 'rgba(107,114,128,0.1)',
    defaultLabel: 'Offline',
  },
  DISABLED: {
    icon: <Pause size={ICON_SIZE.sm} color={COLORS.textTertiary} />,
    color: COLORS.textTertiary,
    bg: 'rgba(156,163,175,0.1)',
    defaultLabel: 'Sync Off',
  },
  COMPLETED: {
    icon: <CheckCircle size={ICON_SIZE.sm} color={COLORS.success} />,
    color: COLORS.success,
    bg: 'rgba(34,197,94,0.1)',
    defaultLabel: 'Synced',
  },
  LOCAL_ONLY: {
    icon: <Smartphone size={ICON_SIZE.sm} color={COLORS.primaryLight} />,
    color: COLORS.primaryLight,
    bg: 'rgba(139,92,246,0.1)',
    defaultLabel: 'Local Only',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SyncStatusPill({
  status,
  label,
  style,
}: SyncStatusPillProps) {
  const cfg = STATUS_CONFIG[status];
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (status === 'SYNCING') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [status, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }, style]}>
      <Animated.View style={status === 'SYNCING' ? spinStyle : undefined}>
        {cfg.icon}
      </Animated.View>
      <Text style={[styles.label, { color: cfg.color }]}>
        {label ?? cfg.defaultLabel}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});
