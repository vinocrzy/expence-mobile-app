/**
 * Animation presets — spring configs and timing constants.
 * Replaces react-native-reanimated configs with plain objects for RN Animated API.
 */

// ─── Spring configs ──────────────────────────────────────────────────────────

export const SPRING_PRESS = { damping: 15, stiffness: 400, mass: 0.3, useNativeDriver: true };
export const SPRING_SHEET = { damping: 30, stiffness: 300, mass: 1, useNativeDriver: true };
export const SPRING_NUMBER = { mass: 0.8, stiffness: 75, damping: 15, useNativeDriver: true };
export const SPRING_SMOOTH = { damping: 20, stiffness: 90, mass: 1, useNativeDriver: true };

// ─── Timing configs ──────────────────────────────────────────────────────────

export const TIMING_FAST = { duration: 150, useNativeDriver: true };
export const TIMING_NORMAL = { duration: 250, useNativeDriver: true };
export const TIMING_SLOW = { duration: 400, useNativeDriver: true };
