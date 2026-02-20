/**
 * Avatar — user or entity avatar with image fallback to initials.
 * Matches web pattern: gradient ring → inner circle → image/initials.
 */

import React from 'react';
import { View, Image, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { COLORS } from '@/constants';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  showRing?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, { outer: number; ring: number; inner: number; fontSize: number; iconSize: number }> = {
  sm: { outer: 28, ring: 1, inner: 24, fontSize: 11, iconSize: 14 },
  md: { outer: 36, ring: 1.5, inner: 32, fontSize: 14, iconSize: 18 },
  lg: { outer: 44, ring: 1.5, inner: 40, fontSize: 17, iconSize: 22 },
  xl: { outer: 64, ring: 2, inner: 58, fontSize: 24, iconSize: 30 },
};

export function Avatar({
  uri,
  name,
  size = 'md',
  showRing = false,
  color,
  style,
}: AvatarProps) {
  const s = SIZE_MAP[size];
  const initials = name?.charAt(0).toUpperCase() ?? '';
  const bgColor = color ?? COLORS.primary;

  const inner = (
    <View
      style={[
        styles.inner,
        {
          width: showRing ? s.inner : s.outer,
          height: showRing ? s.inner : s.outer,
          borderRadius: (showRing ? s.inner : s.outer) / 2,
          backgroundColor: COLORS.background,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: showRing ? s.inner : s.outer,
            height: showRing ? s.inner : s.outer,
            borderRadius: (showRing ? s.inner : s.outer) / 2,
          }}
        />
      ) : initials ? (
        <View
          style={[
            styles.fallback,
            {
              width: showRing ? s.inner : s.outer,
              height: showRing ? s.inner : s.outer,
              borderRadius: (showRing ? s.inner : s.outer) / 2,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: s.fontSize }]}>{initials}</Text>
        </View>
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: showRing ? s.inner : s.outer,
              height: showRing ? s.inner : s.outer,
              borderRadius: (showRing ? s.inner : s.outer) / 2,
              backgroundColor: COLORS.white5,
            },
          ]}
        >
          <User size={s.iconSize} color={COLORS.textTertiary} />
        </View>
      )}
    </View>
  );

  if (!showRing) {
    return <View style={style}>{inner}</View>;
  }

  return (
    <LinearGradient
      colors={[COLORS.primaryLight, COLORS.heroGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: s.outer,
          height: s.outer,
          borderRadius: s.outer / 2,
          padding: s.ring,
        },
        styles.ring,
        style,
      ]}
    >
      {inner}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ring: {
    shadowColor: COLORS.heroGradientEnd,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
