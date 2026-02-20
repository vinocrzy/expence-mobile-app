/**
 * Bottom Tab Navigator
 * 5 tabs: Dashboard, Transactions, (FAB center), Finances, More
 * The center "Add" tab is a dummy screen that triggers the FAB action sheet.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Menu,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { COLORS, TAB_BAR_HEIGHT, SPACING } from '@/constants';
import type { TabParamList } from './types';
import { FAB } from '@/components/ui/FAB';
import { QuickActionSheet, type QuickAction } from '@/components/ui/QuickActionSheet';

// Screens
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { TransactionsScreen } from '@/screens/transactions/TransactionsScreen';
import { FinancesScreen } from '@/screens/finances/FinancesScreen';
import { BudgetsScreen } from '@/screens/budgets/BudgetsScreen';
import { MoreScreen } from '@/screens/settings/MoreScreen';

const Tab = createBottomTabNavigator<TabParamList>();

// Dummy screen for the center FAB tab — never actually rendered
function AddPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFABPress = () => {
    setSheetOpen(true);
  };

  const handleQuickAction = (action: QuickAction) => {
    // Will open TransactionModal with pre-selected type in Phase 6
    console.log('Quick action:', action);
  };

  return (
    <>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          },
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight size={size - 2} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          },
        }}
      />

      {/* Center FAB — hidden label, custom button */}
      <Tab.Screen
        name="Add" 
        component={AddPlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <FAB onPress={handleFABPress} />,
          tabBarStyle: { display: 'none' }, // never navigate here
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // prevent navigating to the dummy screen
            handleFABPress();
          },
        }}
      />

      <Tab.Screen
        name="Finances"
        component={FinancesScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet size={size - 2} color={color} />,
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          },
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Menu size={size - 2} color={color} />,
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          },
        }}
      />
    </Tab.Navigator>
    <QuickActionSheet
      visible={sheetOpen}
      onClose={() => setSheetOpen(false)}
      onAction={handleQuickAction}
    />
    </>
  );
}
