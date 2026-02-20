/**
 * AnimatedPressable — touchable with scale-down animation on press.
 * Mirrors the web's `active:scale-95` / framer `whileTap={{ scale: 0.95 }}`.
 */

import React from 'react';
import { Platform, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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

const SPRING_CFG = { damping: 15, stiffness: 400, mass: 0.3 };

export function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  scaleDown = 0.97,
  haptic = false,
  disabled = false,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(scaleDown, SPRING_CFG);
      pressed.value = true;
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SPRING_CFG);
      pressed.value = false;
    })
    .onEnd(() => {
      if (haptic && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (onPress) onPress();
    });

  const longPress = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(400)
    .onBegin(() => {
      scale.value = withSpring(scaleDown, SPRING_CFG);
    })
    .onEnd((_e, success) => {
      scale.value = withSpring(1, SPRING_CFG);
      if (success) {
        if (haptic && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        if (onLongPress) onLongPress();
      }
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SPRING_CFG);
    });

  const gesture = onLongPress ? Gesture.Race(longPress, tap) : tap;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
