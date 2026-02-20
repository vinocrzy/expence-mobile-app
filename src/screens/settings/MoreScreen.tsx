import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BarChart3,
  FileText,
  Settings,
  User,
  Users,
  ChevronRight,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  screen: keyof RootStackParamList;
}

const menuItems: MenuItem[] = [
  {
    label: 'Analytics',
    icon: <BarChart3 size={ICON_SIZE.lg} color={COLORS.primaryLight} />,
    screen: 'Analytics',
  },
  {
    label: 'Reports',
    icon: <FileText size={ICON_SIZE.lg} color={COLORS.income} />,
    screen: 'Reports' as keyof RootStackParamList,
  },
  {
    label: 'Household',
    icon: <Users size={ICON_SIZE.lg} color={COLORS.investment} />,
    screen: 'Household' as keyof RootStackParamList,
  },
  {
    label: 'Profile',
    icon: <User size={ICON_SIZE.lg} color={COLORS.transfer} />,
    screen: 'Profile',
  },
  {
    label: 'Settings',
    icon: <Settings size={ICON_SIZE.lg} color={COLORS.textSecondary} />,
    screen: 'Settings',
  },
];

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>More</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              {item.icon}
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <ChevronRight size={ICON_SIZE.md} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  list: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});
