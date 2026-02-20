/**
 * Root Navigator
 * Shows AuthNavigator when signed out, main app stack when signed in.
 * All detail/modal screens are registered here.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';

import { COLORS } from '@/constants';
import type { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';

// ─── Detail / Modal screens ─────────────────────────────────────────────────
import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { SettingsCategoriesScreen } from '@/screens/settings/SettingsCategoriesScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ReportsScreen } from '@/screens/reports/ReportsScreen';
import { RecurringScreen } from '@/screens/recurring/RecurringScreen';
import { HouseholdScreen } from '@/screens/household/HouseholdScreen';
import { SharedDashboardScreen } from '@/screens/household/SharedDashboardScreen';
import { AccountDetailScreen } from '@/screens/accounts/AccountDetailScreen';
import { CreditCardDetailScreen } from '@/screens/credit-cards/CreditCardDetailScreen';
import { LoanDetailScreen } from '@/screens/loans/LoanDetailScreen';
import { BudgetDetailScreen } from '@/screens/budgets/BudgetDetailScreen';
import { BudgetPlanScreen } from '@/screens/budgets/BudgetPlanScreen';
import { BudgetsScreen } from '@/screens/budgets/BudgetsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Insights & Reports */}
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Recurring" component={RecurringScreen} />

      {/* Detail screens (push from lists) */}
      <Stack.Screen name="Budgets" component={BudgetsScreen} />
      <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
      <Stack.Screen name="CreditCardDetail" component={CreditCardDetailScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
      <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
      <Stack.Screen name="BudgetPlan" component={BudgetPlanScreen} />

      {/* Household */}
      <Stack.Screen name="Household" component={HouseholdScreen} />
      <Stack.Screen name="SharedDashboard" component={SharedDashboardScreen} />

      {/* Settings & Profile */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SettingsCategories" component={SettingsCategoriesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
