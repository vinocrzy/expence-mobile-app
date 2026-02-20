/**
 * Button — design-system button with multiple variants.
 *
 * Variants:
 *   primary   – gradient (blue-500 → purple-600)
 *   secondary – transparent with gray text, hover bg
 *   danger    – solid red-600
 *   outline   – border only
 *   ghost     – no bg, no border
 *   pill      – small rounded-full filter chip
 *
 * Sizes: sm, md (default), lg
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedPressable } from './AnimatedPressable';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from '@/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'pill';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  active?: boolean; // for pill variant
}

// ─── Size map ────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<Size, { paddingV: number; paddingH: number; fontSize: number; iconGap: number }> = {
  sm: { paddingV: 6, paddingH: 12, fontSize: FONT_SIZE.xs, iconGap: 4 },
  md: { paddingV: 10, paddingH: 16, fontSize: FONT_SIZE.sm, iconGap: 8 },
  lg: { paddingV: 14, paddingH: 20, fontSize: FONT_SIZE.base, iconGap: 10 },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  active = false,
}: ButtonProps) {
  const s = SIZE_MAP[size];

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress?.();
  };

  // ── Inner content ──────────────────────────────────────────────────────────
  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : COLORS.textSecondary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize: s.fontSize },
              icon ? { marginLeft: s.iconGap } : undefined,
              iconRight ? { marginRight: s.iconGap } : undefined,
              variant === 'primary' && styles.textPrimary,
              variant === 'secondary' && styles.textSecondary,
              variant === 'danger' && styles.textDanger,
              variant === 'outline' && styles.textOutline,
              variant === 'ghost' && styles.textGhost,
              variant === 'pill' && (active ? styles.textPillActive : styles.textPillInactive),
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight}
        </>
      )}
    </>
  );

  // ── Container style ────────────────────────────────────────────────────────
  const containerBase: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.paddingV,
    paddingHorizontal: s.paddingH,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  // ── Primary uses gradient wrapper ──────────────────────────────────────────
  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        disabled={disabled || loading}
        haptic
        style={[{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }, style]}
      >
        <LinearGradient
          colors={[COLORS.primaryLight, COLORS.heroGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            containerBase,
            styles.radiusLg,
            styles.shadowPrimary,
            disabled && styles.disabled,
          ]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // ── Other variants ─────────────────────────────────────────────────────────
  const variantStyle: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: 'transparent' }
      : variant === 'danger'
        ? { backgroundColor: COLORS.error, ...styles.shadowDanger }
        : variant === 'outline'
          ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.borderMedium }
          : variant === 'ghost'
            ? { backgroundColor: 'transparent' }
            : // pill
              active
              ? { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.white }
              : { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border };

  const radiusStyle =
    variant === 'pill'
      ? { borderRadius: BORDER_RADIUS.full }
      : { borderRadius: BORDER_RADIUS.lg };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      haptic={variant === 'danger'}
      style={[containerBase, radiusStyle, variantStyle, disabled && styles.disabled, style]}
    >
      {content}
    </AnimatedPressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  text: {
    fontWeight: FONT_WEIGHT.bold,
  },
  textPrimary: { color: '#ffffff' },
  textSecondary: { color: COLORS.textSecondary },
  textDanger: { color: '#ffffff' },
  textOutline: { color: COLORS.textPrimary },
  textGhost: { color: COLORS.textSecondary },
  textPillActive: { color: '#000000' },
  textPillInactive: { color: COLORS.textSecondary },
  radiusLg: {
    borderRadius: BORDER_RADIUS.lg,
  },
  shadowPrimary: {
    shadowColor: COLORS.heroGradientEnd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shadowDanger: {
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
