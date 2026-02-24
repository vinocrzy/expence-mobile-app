/**
 * ListItem — generic row for settings / menu lists.
 *
 * Icon (optional) → title + subtitle → right element / chevron.
 * Matches web's grouped list row pattern.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { COLORS, FONT_SIZE, SPACING, ICON_SIZE } from '@/constants';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ListItem = React.memo(function ListItem({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = true,
  onPress,
  destructive = false,
  style,
}: ListItemProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleDown={0.99}
      style={[styles.container, style]}
    >
      {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}

      <View style={styles.content}>
        <Text
          style={[styles.title, destructive && styles.destructive]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement}
      {showChevron && !rightElement && (
        <ChevronRight size={ICON_SIZE.sm} color={COLORS.textTertiary} />
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  destructive: {
    color: COLORS.error,
  },
});

ListItem.displayName = 'ListItem';
