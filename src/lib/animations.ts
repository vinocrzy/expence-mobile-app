/**
 * Animation presets — spring configs and entering/exiting animations
 * for use with react-native-reanimated.
 *
 * Mirrors web's framer-motion transitions.
 */

import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  type WithSpringConfig,
  type WithTimingConfig,
  Easing,
} from 'react-native-reanimated';

// ─── Spring configs ──────────────────────────────────────────────────────────

/** Button press — snappy */
export const SPRING_PRESS: WithSpringConfig = {
  damping: 15,
  stiffness: 400,
  mass: 0.3,
};

/** Sheet slide — bouncy */
export const SPRING_SHEET: WithSpringConfig = {
  damping: 30,
  stiffness: 300,
  mass: 1,
};

/** Number spring (AnimatedAmount) */
export const SPRING_NUMBER: WithSpringConfig = {
  mass: 0.8,
  stiffness: 75,
  damping: 15,
};

/** Smooth transition */
export const SPRING_SMOOTH: WithSpringConfig = {
  damping: 20,
  stiffness: 90,
  mass: 1,
};

// ─── Timing configs ──────────────────────────────────────────────────────────

export const TIMING_FAST: WithTimingConfig = {
  duration: 150,
  easing: Easing.out(Easing.cubic),
};

export const TIMING_NORMAL: WithTimingConfig = {
  duration: 250,
  easing: Easing.out(Easing.cubic),
};

export const TIMING_SLOW: WithTimingConfig = {
  duration: 400,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};

// ─── Entering / Exiting presets ──────────────────────────────────────────────

/** Modal enter: fade-in + zoom-in (200ms) */
export const MODAL_ENTER = FadeIn.duration(200).withInitialValues({ opacity: 0 });
export const MODAL_EXIT = FadeOut.duration(150);

/** Content card: fade-in slide-up (500ms) */
export const CARD_ENTER = FadeInDown.duration(500).springify().damping(20);

/** List row: stagger-friendly fade-in from bottom */
export const ROW_ENTER = (index: number) =>
  FadeInDown.delay(index * 50)
    .duration(300)
    .springify()
    .damping(18);

/** Sheet enter: slide from bottom */
export const SHEET_ENTER = SlideInDown.springify().damping(30).stiffness(300);
export const SHEET_EXIT = SlideOutDown.duration(200);

/** Zoom-in for modals */
export const ZOOM_ENTER = ZoomIn.duration(200);

/** Fade up for headers */
export const HEADER_ENTER = FadeInUp.duration(400).springify().damping(20);
