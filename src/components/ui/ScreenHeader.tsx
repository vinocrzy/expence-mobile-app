/**
 * ScreenHeader — reusable header component for all screens.
 *
 * Variants:
 *   - default: title + optional subtitle, left back button (if canGoBack)
 *   - action:  adds right-side action button (icon or text)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZE, ICON_SIZE, HIT_SLOP } from '@/constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  large?: boolean;
  transparent?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack,
  rightAction,
  onBack,
  large = false,
  transparent = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const canGoBack = showBack ?? navigation.canGoBack();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.sm },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.row}>
        {/* Left: back button */}
        <View style={styles.left}>
          {canGoBack && (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={HIT_SLOP}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={ICON_SIZE.lg} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: title (only for non-large variant) */}
        {!large && (
          <View style={styles.center}>
            <Text style={styles.titleSmall} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}

        {/* Right: action */}
        <View style={styles.right}>{rightAction}</View>
      </View>

      {/* Large title (below the row) */}
      {large && (
        <View style={styles.largeContainer}>
          <Text style={styles.titleLarge}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSmall: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  largeContainer: {
    paddingTop: SPACING.xs,
  },
  titleLarge: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
