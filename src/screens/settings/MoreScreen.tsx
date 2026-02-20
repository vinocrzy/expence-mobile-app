import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import {
  BarChart3,
  FileText,
  Settings,
  User,
  Users,
  ChevronRight,
  Wallet,
  Tag,
  LogOut,
  LogIn,
  LayoutDashboard,
  Repeat,
} from 'lucide-react-native';

import {
  COLORS,
  FONT_SIZE,
  SPACING,
  BORDER_RADIUS,
  ICON_SIZE,
} from '@/constants';
import type { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Menu data ───────────────────────────────────────────────────────────────

interface MenuItem {
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  screen?: keyof RootStackParamList;
  onPress?: () => void;
  destructive?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

function buildSections(onSignOut: () => void, isGuest: boolean, onSignIn: () => void): MenuSection[] {
  const sections: MenuSection[] = [
    {
      title: 'Insights & Reports',
      items: [
        {
          label: 'Analytics',
          subtitle: 'Charts & trends',
          icon: <BarChart3 size={ICON_SIZE.md} color={COLORS.primaryLight} />,
          screen: 'Analytics',
        },
        {
          label: 'Reports',
          subtitle: 'Export & share',
          icon: <FileText size={ICON_SIZE.md} color={COLORS.income} />,
          screen: 'Reports',
        },
      ],
    },
    {
      title: 'Financial',
      items: [
        {
          label: 'Budgets',
          subtitle: 'Monthly budgets & plans',
          icon: <Wallet size={ICON_SIZE.md} color={COLORS.warning} />,
          screen: 'Budgets',
        },
        {
          label: 'Subscriptions & EMIs',
          subtitle: 'Recurring payments',
          icon: <Repeat size={ICON_SIZE.md} color={COLORS.debt} />,
          screen: 'Recurring',
        },
      ],
    },
  ];

  // Household section only for signed-in users
  if (!isGuest) {
    sections.push({
      title: 'Household',
      items: [
        {
          label: 'Shared Dashboard',
          subtitle: 'Family overview',
          icon: <LayoutDashboard size={ICON_SIZE.md} color={COLORS.investment} />,
          screen: 'SharedDashboard',
        },
        {
          label: 'Household Settings',
          subtitle: 'Members & invites',
          icon: <Users size={ICON_SIZE.md} color={COLORS.investment} />,
          screen: 'Household',
        },
      ],
    });
  }

  sections.push({
    title: 'Management',
    items: [
      {
        label: 'Manage Categories',
        subtitle: 'Customize categories',
        icon: <Tag size={ICON_SIZE.md} color={COLORS.info} />,
        screen: 'SettingsCategories',
      },
    ],
  });

  const accountItems: MenuItem[] = [];

  if (!isGuest) {
    accountItems.push(
      {
        label: 'Profile',
        subtitle: 'Your account details',
        icon: <User size={ICON_SIZE.md} color={COLORS.textSecondary} />,
        screen: 'Profile',
      },
    );
  }

  accountItems.push({
    label: 'Settings',
    subtitle: 'Preferences & data',
    icon: <Settings size={ICON_SIZE.md} color={COLORS.textSecondary} />,
    screen: 'Settings',
  });

  if (isGuest) {
    accountItems.push({
      label: 'Sign In',
      subtitle: 'Enable sync & backup',
      icon: <LogIn size={ICON_SIZE.md} color={COLORS.primary} />,
      onPress: onSignIn,
    });
  } else {
    accountItems.push({
      label: 'Sign Out',
      icon: <LogOut size={ICON_SIZE.md} color={COLORS.error} />,
      onPress: onSignOut,
      destructive: true,
    });
  }

  sections.push({ title: 'Account', items: accountItems });

  return sections;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { isGuest, exitGuestMode } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const handleSignIn = () => {
    Alert.alert(
      'Sign In',
      'Your local data will be preserved. You can merge it after signing in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => exitGuestMode(),
        },
      ],
    );
  };

  const sections = buildSections(handleSignOut, isGuest, handleSignIn);

  const handleItemPress = (item: MenuItem) => {
    Haptics.selectionAsync();
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      navigation.navigate(item.screen as any);
    }
  };

  // Avatar — Clerk image, guest fallback, or initials
  const avatarUri = isGuest ? undefined : clerkUser?.imageUrl;
  const displayName = isGuest
    ? 'Guest'
    : (clerkUser?.firstName ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? 'User');
  const initials = displayName.charAt(0).toUpperCase();
  const subtitleText = isGuest
    ? 'Sign in to enable sync & backup'
    : (clerkUser?.emailAddresses?.[0]?.emailAddress ?? '');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── User header ── */}
        <View style={styles.userCard}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {subtitleText}
            </Text>
          </View>
        </View>

        {/* ── Sections ── */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.6}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.iconWrap}>{item.icon}</View>
                    <View style={styles.menuText}>
                      <Text
                        style={[
                          styles.menuLabel,
                          item.destructive && styles.destructiveLabel,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                  </View>
                  {!item.destructive && (
                    <ChevronRight
                      size={ICON_SIZE.sm}
                      color={COLORS.textTertiary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Bottom spacing */}
        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },

  // User header card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  userInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Sections
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.white5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  menuLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  destructiveLabel: {
    color: COLORS.error,
  },
});
