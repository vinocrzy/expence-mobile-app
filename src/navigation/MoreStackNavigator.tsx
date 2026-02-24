/**
 * MoreStackNavigator — nested stack inside the "More" bottom tab.
 *
 * Keeping the tab bar visible on all secondary screens (Analytics, Budgets,
 * Reports, Recurring, Settings, Profile, Household, SharedDashboard,
 * SettingsCategories, BudgetDetail, BudgetPlan).
 *
 * Only pure row-level detail screens (AccountDetail, CreditCardDetail,
 * LoanDetail) stay in the root stack because they are also reachable from
 * the Dashboard and Finances tabs.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { COLORS } from '@/constants';
import type { MoreStackParamList } from './types';

import { MoreScreen } from '@/screens/settings/MoreScreen';
import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
import { ReportsScreen } from '@/screens/reports/ReportsScreen';
import { BudgetsScreen } from '@/screens/budgets/BudgetsScreen';
import { BudgetDetailScreen } from '@/screens/budgets/BudgetDetailScreen';
import { BudgetPlanScreen } from '@/screens/budgets/BudgetPlanScreen';
import { RecurringScreen } from '@/screens/recurring/RecurringScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { SettingsCategoriesScreen } from '@/screens/settings/SettingsCategoriesScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { HouseholdScreen } from '@/screens/household/HouseholdScreen';
import { SharedDashboardScreen } from '@/screens/household/SharedDashboardScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Root of the More tab */}
      <Stack.Screen name="MoreMenu" component={MoreScreen} />

      {/* Insights */}
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />

      {/* Financial */}
      <Stack.Screen name="Budgets" component={BudgetsScreen} />
      <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
      <Stack.Screen name="BudgetPlan" component={BudgetPlanScreen} />
      <Stack.Screen name="Recurring" component={RecurringScreen} />

      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SettingsCategories" component={SettingsCategoriesScreen} />

      {/* Profile & Household */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Household" component={HouseholdScreen} />
      <Stack.Screen name="SharedDashboard" component={SharedDashboardScreen} />
    </Stack.Navigator>
  );
}
