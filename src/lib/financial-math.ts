/**
 * Financial Math Utilities
 * Pure functions for financial calculations used across the app.
 *
 * Ported from Expense-Web (lib/financial-math.ts) — logic identical.
 */

import type { Account, CreditCard, Loan, Transaction, Budget } from '@/types/db-types';

/**
 * Calculates the total balance of all liquid accounts (Bank, Cash, etc.)
 * Excludes Credit Cards.
 */
export function calculateTotalLiquidCash(accounts: Account[]): number {
  return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
}

/**
 * Calculates the total outstanding debt on all credit cards.
 */
export function calculateTotalCreditCardDebt(creditCards: CreditCard[]): number {
  return creditCards.reduce((sum, cc) => sum + (cc.currentOutstanding || 0), 0);
}

/**
 * Calculates the Available Balance (Liquid Cash - Credit Card Debt).
 * This is the "Net Available" figure shown on Dashboard and Finances page.
 */
export function calculateAvailableBalance(accounts: Account[], creditCards: CreditCard[]): number {
  const cash = calculateTotalLiquidCash(accounts);
  const ccDebt = calculateTotalCreditCardDebt(creditCards);
  return cash - ccDebt;
}

/**
 * Calculates the total outstanding principal of all active loans.
 */
export function calculateTotalLoanOutstanding(loans: Loan[]): number {
  return loans.reduce((sum, loan) => sum + (loan.outstandingPrincipal || 0), 0);
}

/**
 * Calculates Net Worth.
 * Formula: (Liquid Cash + Investments) - (Credit Card Debt + Loan Outstanding)
 * @param investmentsTotal Current value of investments
 */
export function calculateNetWorth(
  accounts: Account[],
  creditCards: CreditCard[],
  loans: Loan[],
  investmentsTotal: number,
): number {
  const cash = calculateTotalLiquidCash(accounts);
  const ccDebt = calculateTotalCreditCardDebt(creditCards);
  const loanDebt = calculateTotalLoanOutstanding(loans);

  return cash + investmentsTotal - (ccDebt + loanDebt);
}

/**
 * Calculates totals for a specific transaction type from a list of transactions.
 */
export function calculateTransactionTotal(
  transactions: Transaction[],
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'DEBT',
): number {
  return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculates budget utilization percentage.
 */
export function calculateBudgetUtilization(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return (spent / limit) * 100;
}
