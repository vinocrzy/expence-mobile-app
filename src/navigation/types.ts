/**
 * Navigation Type Definitions
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

// Auth stack (shown when signed out)
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

// Bottom Tab param list
export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Finances: undefined;
  Budgets: undefined;
  More: undefined;
};

// Stack screens accessible from any tab (shown when signed in)
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  AccountDetail: { id: string };
  CreditCardDetail: { id: string };
  LoanDetail: { id: string };
  BudgetDetail: { id: string };
  BudgetPlan: { id: string };
  Analytics: undefined;
  Reports: undefined;
  Settings: undefined;
  SettingsCategories: undefined;
  Profile: undefined;
  Household: undefined;
  SharedDashboard: undefined;
};
