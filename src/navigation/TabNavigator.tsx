/**
 * Bottom Tab Navigator
 * 5 tabs: Dashboard, Transactions, (FAB center), Finances, More
 * The center "Add" tab is a dummy screen that triggers the FAB action sheet.
 */

import React, { useState, useCallback } from 'react';
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
import type { TransactionType } from '@/types/db-types';
import { FAB } from '@/components/ui/FAB';
import { QuickActionSheet, type QuickAction } from '@/components/ui/QuickActionSheet';
import { TransactionModal } from '@/components/TransactionModal';
import { useTransactions } from '@/hooks/useLocalData';

// Screens
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { TransactionsScreen } from '@/screens/transactions/TransactionsScreen';
import { FinancesScreen } from '@/screens/finances/FinancesScreen';
import { MoreStackNavigator } from './MoreStackNavigator';

const Tab = createBottomTabNavigator<TabParamList>();

// Dummy screen for the center FAB tab — never actually rendered
function AddPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('EXPENSE');
  const { addTransaction } = useTransactions();

  const handleFABPress = () => {
    setSheetOpen(true);
  };

  const handleQuickAction = useCallback((action: QuickAction) => {
    // Map quick action to transaction type (keys must match QuickAction uppercase values)
    const typeMap: Partial<Record<QuickAction, TransactionType>> = {
      EXPENSE: 'EXPENSE',
      INCOME: 'INCOME',
      TRANSFER: 'TRANSFER',
      PAY_EMI: 'DEBT',
      PAY_CARD: 'EXPENSE',
      SUBSCRIBE: 'EXPENSE',
    };
    
    setTxInitialType(typeMap[action] ?? 'EXPENSE');
    setTxModalOpen(true);
  }, []);

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
        component={MoreStackNavigator}
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
    <TransactionModal
      visible={txModalOpen}
      onClose={() => setTxModalOpen(false)}
      onSubmit={async (data) => {
        await addTransaction(data);
      }}
      initialType={txInitialType}
    />
    </>
  );
}
