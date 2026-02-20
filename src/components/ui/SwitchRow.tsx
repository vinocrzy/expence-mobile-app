/**
 * SwitchRow — labeled toggle switch matching web's sync toggle.
 * Pill shape with animated knob.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useSharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

interface SwitchRowProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

const TRACK_W = 44;
const TRACK_H = 24;
const KNOB_SZ = 18;
const KNOB_PAD = 3;
const SPRING_CFG = { damping: 18, stiffness: 300, mass: 0.8 };

export function SwitchRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: SwitchRowProps) {
  const progress = useDerivedValue(() => (value ? 1 : 0));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#374151', COLORS.success], // gray-700 → green-500
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(progress.value * (TRACK_W - KNOB_SZ - KNOB_PAD * 2), SPRING_CFG) },
    ],
  }));

  const handleToggle = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onValueChange(!value);
  };

  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <Pressable onPress={handleToggle} hitSlop={8}>
        <Animated.View style={[styles.track, trackStyle]}>
          <Animated.View style={[styles.knob, knobStyle]} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  disabled: {
    opacity: 0.5,
  },
  labelWrap: {
    flex: 1,
    marginRight: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: KNOB_PAD,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SZ,
    height: KNOB_SZ,
    borderRadius: KNOB_SZ / 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
