/**
 * LoadingScreen — full-screen branded loading state.
 * Matches web's LoadingScreen: centered logo + app name + spinner.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet } from 'lucide-react-native';
import { Animated, Easing } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

export function LoadingScreen() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotation]);

  const spinStyle = {
    transform: [{
      rotateZ: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
    }],
  };

  return (
    <View style={styles.container}>
      {/* ── Logo ── */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.heroGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logo}
      >
        <View style={styles.logoInner}>
          <Wallet size={36} color="#fff" />
        </View>
      </LinearGradient>

      {/* ── App name ── */}
      <Text style={styles.appName}>Expence</Text>

      {/* ── Spinner (simple rotating border trick) ── */}
      <Animated.View style={[styles.spinner, spinStyle]}>
        <View style={styles.spinnerArc} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.heroGradientEnd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoInner: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS['2xl'] - 2,
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  spinnerArc: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: COLORS.heroGradientEnd,
  },
});
