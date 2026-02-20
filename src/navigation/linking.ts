/**
 * Deep Linking Configuration
 *
 * Maps expence:// URLs to navigation screens.
 * The scheme "expence" is declared in app.json.
 *
 * Examples:
 *   expence://dashboard
 *   expence://transactions
 *   expence://accounts/abc123
 *   expence://budgets/abc123/plan
 *   expence://settings/categories
 */

import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['expence://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Transactions: 'transactions',
          Finances: 'finances',
          More: 'more',
        },
      },
      AccountDetail: 'accounts/:id',
      CreditCardDetail: 'credit-cards/:id',
      LoanDetail: 'loans/:id',
      Budgets: 'budgets',
      BudgetDetail: 'budgets/:id',
      BudgetPlan: 'budgets/:id/plan',
      Analytics: 'analytics',
      Reports: 'reports',
      Recurring: 'recurring',
      Settings: 'settings',
      SettingsCategories: 'settings/categories',
      Profile: 'profile',
      Household: 'household',
      SharedDashboard: 'shared-dashboard',
    },
  },
};
