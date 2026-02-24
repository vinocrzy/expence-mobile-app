/**
 * AnimatedPressable — touchable with scale-down animation on press.
 * Mirrors the web's `active:scale-95` / framer `whileTap={{ scale: 0.95 }}`.
 */

import React, { useRef } from 'react';
import { Platform, Pressable, type ViewStyle, type StyleProp, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
  haptic?: boolean;
  disabled?: boolean;
  childStyle?: StyleProp<ViewStyle>;
}

const SPRING_CFG = { damping: 15, stiffness: 400, mass: 0.3, useNativeDriver: true };

export function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  scaleDown = 0.97,
  haptic = false,
  disabled = false,
  childStyle = {},
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, ...SPRING_CFG }).start();

  const handlePressIn = () => animateTo(scaleDown);
  const handlePressOut = () => animateTo(1);

  const handlePress = () => {
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const handleLongPress = () => {
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={400}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={{ transform: [{ scale }], opacity: disabled ? 0.5 : 1, ...(childStyle as object) } as ViewStyle}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
