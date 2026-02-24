/**
 * Navigation Type Definitions
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

// Auth stack (shown when signed out)
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

// ── MoreStack — nested stack inside the "More" tab ───────────────────────────
// All secondary screens live here so the tab bar always stays visible.
export type MoreStackParamList = {
  MoreMenu: undefined;
  Analytics: undefined;
  Reports: undefined;
  Budgets: undefined;
  BudgetDetail: { id: string };
  BudgetPlan: { id: string };
  Recurring: undefined;
  Settings: undefined;
  SettingsCategories: undefined;
  Profile: undefined;
  Household: undefined;
  SharedDashboard: undefined;
};

// Bottom Tab param list
export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Add: undefined; // FAB dummy — never navigated to
  Finances: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};

// Root stack (screens displayed WITHOUT the tab bar — pure detail views)
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  AccountDetail: { id: string };
  CreditCardDetail: { id: string };
  LoanDetail: { id: string };
  // Keep MoreStack screens here too for backward-compatible navigation typing
  Analytics: undefined;
  Reports: undefined;
  Budgets: undefined;
  BudgetDetail: { id: string };
  BudgetPlan: { id: string };
  Recurring: undefined;
  Settings: undefined;
  SettingsCategories: undefined;
  Profile: undefined;
  Household: undefined;
  SharedDashboard: undefined;
};
