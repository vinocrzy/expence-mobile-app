/**
 * AnimatedPressable — touchable with scale-down animation on press.
 * Mirrors the web's `active:scale-95` / framer `whileTap={{ scale: 0.95 }}`.
 */

import React, { useRef } from 'react';
import { Platform, type ViewStyle, type StyleProp, Animated } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
  haptic?: boolean;
  disabled?: boolean;
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
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, ...SPRING_CFG }).start();

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => animateTo(scaleDown))
    .onFinalize(() => animateTo(1))
    .onEnd(() => {
      if (haptic && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (onPress) onPress();
    });

  const longPress = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(400)
    .onBegin(() => animateTo(scaleDown))
    .onEnd((_e, success) => {
      animateTo(1);
      if (success) {
        if (haptic && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        if (onLongPress) onLongPress();
      }
    })
    .onFinalize(() => animateTo(1));

  const gesture = onLongPress ? Gesture.Race(longPress, tap) : tap;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          style,
          { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
