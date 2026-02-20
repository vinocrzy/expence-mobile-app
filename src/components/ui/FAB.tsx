/**
 * FAB (Floating Action Button) — center tab bar button.
 * Gradient circle with a plus icon. Triggers the QuickActionSheet.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants';

interface FABProps {
  onPress: () => void;
  size?: number;
}

export function FAB({ onPress, size = 56 }: FABProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.heroGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // Shadow for iOS
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 8,
    marginTop: -28, // lift above tab bar
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
