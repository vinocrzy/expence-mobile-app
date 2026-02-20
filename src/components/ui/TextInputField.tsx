/**
 * TextInput — styled text field matching web's input pattern.
 *
 * bg-gray-900, border border-white/10, rounded-xl, focus ring purple.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

export interface TextInputFieldProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function TextInputField({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  ...rest
}: TextInputFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);
  const borderProgress = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: borderProgress.value === 1
      ? 'rgba(147,51,234,0.5)' // purple-500/50 focus ring
      : error
        ? 'rgba(239,68,68,0.5)'
        : 'rgba(255,255,255,0.1)',
  }));

  const handleFocus = (e: any) => {
    setFocused(true);
    borderProgress.value = withTiming(1, { duration: 150 });
    rest.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    borderProgress.value = withTiming(0, { duration: 150 });
    rest.onBlur?.(e);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <AnimatedView style={[styles.inputContainer, animatedBorder, error && styles.errorBorder]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <RNTextInput
          ref={inputRef}
          placeholderTextColor={COLORS.textMuted}
          selectionColor={COLORS.heroGradientEnd}
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : undefined,
            rightIcon ? { paddingRight: 0 } : undefined,
          ]}
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </AnimatedView>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827', // gray-900
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.base,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2, // ~10px — matches web py-2
    minHeight: 44,
  },
  leftIcon: {
    paddingLeft: SPACING.md,
  },
  rightIcon: {
    paddingRight: SPACING.md,
  },
  errorBorder: {
    borderColor: 'rgba(239,68,68,0.5)',
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: 2,
  },
  helperText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
