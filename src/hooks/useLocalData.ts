/**
 * Local-First Hooks
 * React hooks wrapping local database services for easy component usage.
 *
 * Ported from Expense-Web (hooks/useLocalData.ts).
 * Changes: removed 'use client', replaced localStorage with AsyncStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/logger';
import {
  transactionService,
  accountService,
  categoryService,
  creditCardService,
  loanService,
  budgetService,
  recurringService,
  sharedDataService,
  getHouseholdId,
} from '@/lib/localdb-services';
import {
  calculateMonthlyStats,
  calculateCategoryBreakdown,
  type MonthlyStats,
  type CategoryBreakdown,
} from '@/lib/analytics';
import type {
  Transaction,
  Account,
  Category,
  CreditCard,
  Loan,
  Budget,
  RecurringTransaction,
} from '@/types/db-types';
import { events, EVENTS } from '@/lib/events';

// Helper to get role (AsyncStorage is async, but we cache it)
let _cachedRole: string = 'OWNER';
AsyncStorage.getItem('household_role').then((v) => {
  if (v) _cachedRole = v;
});

const getUserRole = (): string => _cachedRole;

// ============================================
// TRANSACTION HOOKS
// ============================================

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await transactionService.getAll(householdId);
      setTransactions(data);
    } catch (error) {
      logger.captureError('useTransactions', 'loadTransactions', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    return events.on(EVENTS.TRANSACTIONS_CHANGED, loadTransactions);
  }, [loadTransactions]);

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const transaction = await transactionService.create(data);
        events.emit(EVENTS.TRANSACTIONS_CHANGED);
        events.emit(EVENTS.ACCOUNTS_CHANGED);
        return transaction;
      } catch (err) {
        throw logger.captureError('useTransactions', 'addTransaction', err);
      }
    },
    [],
  );

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    try {
      await transactionService.update(id, data);
      events.emit(EVENTS.TRANSACTIONS_CHANGED);
      events.emit(EVENTS.ACCOUNTS_CHANGED);
    } catch (err) {
      throw logger.captureError('useTransactions', 'updateTransaction', err);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionService.delete(id);
      events.emit(EVENTS.TRANSACTIONS_CHANGED);
      events.emit(EVENTS.ACCOUNTS_CHANGED);
    } catch (err) {
      throw logger.captureError('useTransactions', 'deleteTransaction', err);
    }
  }, []);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: loadTransactions,
  };
}

// ============================================
// ACCOUNT HOOKS
// ============================================

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await accountService.getAll(householdId);
      setAccounts(data);
    } catch (error) {
      logger.captureError('useAccounts', 'loadAccounts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    return events.on(EVENTS.ACCOUNTS_CHANGED, loadAccounts);
  }, [loadAccounts]);

  const addAccount = useCallback(
    async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const account = await accountService.create(data);
        events.emit(EVENTS.ACCOUNTS_CHANGED);
        return account;
      } catch (err) {
        throw logger.captureError('useAccounts', 'addAccount', err);
      }
    },
    [],
  );

  const updateAccount = useCallback(async (id: string, data: Partial<Account>) => {
    try {
      await accountService.update(id, data);
      events.emit(EVENTS.ACCOUNTS_CHANGED);
    } catch (err) {
      throw logger.captureError('useAccounts', 'updateAccount', err);
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await accountService.delete(id);
      events.emit(EVENTS.ACCOUNTS_CHANGED);
    } catch (err) {
      throw logger.captureError('useAccounts', 'deleteAccount', err);
    }
  }, []);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    refresh: loadAccounts,
  };
}

// ============================================
// CATEGORY HOOKS
// ============================================

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await categoryService.getAll(householdId);
      setCategories(data);
    } catch (error) {
      logger.captureError('useCategories', 'loadCategories', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    return events.on(EVENTS.CATEGORIES_CHANGED, loadCategories);
  }, [loadCategories]);

  const addCategory = useCallback(
    async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const category = await categoryService.create(data);
        events.emit(EVENTS.CATEGORIES_CHANGED);
        return category;
      } catch (err) {
        throw logger.captureError('useCategories', 'addCategory', err);
      }
    },
    [],
  );

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    try {
      await categoryService.update(id, data);
      events.emit(EVENTS.CATEGORIES_CHANGED);
    } catch (err) {
      throw logger.captureError('useCategories', 'updateCategory', err);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await categoryService.delete(id);
      events.emit(EVENTS.CATEGORIES_CHANGED);
    } catch (err) {
      throw logger.captureError('useCategories', 'deleteCategory', err);
    }
  }, []);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: loadCategories,
  };
}

// ============================================
// CREDIT CARD HOOKS
// ============================================

export function useCreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCreditCards = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await creditCardService.getAll(householdId);
      setCreditCards(data);
    } catch (error) {
      logger.captureError('useCreditCards', 'loadCreditCards', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreditCards();
    return events.on(EVENTS.CREDIT_CARDS_CHANGED, loadCreditCards);
  }, [loadCreditCards]);

  const addCreditCard = useCallback(
    async (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const creditCard = await creditCardService.create(data);
        events.emit(EVENTS.CREDIT_CARDS_CHANGED);
        return creditCard;
      } catch (err) {
        throw logger.captureError('useCreditCards', 'addCreditCard', err);
      }
    },
    [],
  );

  const updateCreditCard = useCallback(async (id: string, data: Partial<CreditCard>) => {
    try {
      await creditCardService.update(id, data);
      events.emit(EVENTS.CREDIT_CARDS_CHANGED);
    } catch (err) {
      throw logger.captureError('useCreditCards', 'updateCreditCard', err);
    }
  }, []);

  const deleteCreditCard = useCallback(async (id: string) => {
    try {
      await creditCardService.delete(id);
      events.emit(EVENTS.CREDIT_CARDS_CHANGED);
    } catch (err) {
      throw logger.captureError('useCreditCards', 'deleteCreditCard', err);
    }
  }, []);

  return {
    creditCards,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refresh: loadCreditCards,
  };
}

// ============================================
// LOAN HOOKS
// ============================================

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLoans = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await loanService.getAll(householdId);
      setLoans(data);
    } catch (error) {
      logger.captureError('useLoans', 'loadLoans', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
    return events.on(EVENTS.LOANS_CHANGED, loadLoans);
  }, [loadLoans]);

  const addLoan = useCallback(
    async (data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const loan = await loanService.create(data);
        events.emit(EVENTS.LOANS_CHANGED);
        return loan;
      } catch (err) {
        throw logger.captureError('useLoans', 'addLoan', err);
      }
    },
    [],
  );

  const updateLoan = useCallback(async (id: string, data: Partial<Loan>) => {
    try {
      await loanService.update(id, data);
      events.emit(EVENTS.LOANS_CHANGED);
    } catch (err) {
      throw logger.captureError('useLoans', 'updateLoan', err);
    }
  }, []);

  const deleteLoan = useCallback(async (id: string) => {
    try {
      await loanService.delete(id);
      events.emit(EVENTS.LOANS_CHANGED);
    } catch (err) {
      throw logger.captureError('useLoans', 'deleteLoan', err);
    }
  }, []);

  return {
    loans,
    loading,
    addLoan,
    updateLoan,
    deleteLoan,
    refresh: loadLoans,
  };
}

// ============================================
// BUDGET HOOKS
// ============================================

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await budgetService.getAll(householdId);
      setBudgets(data);
    } catch (error) {
      logger.captureError('useBudgets', 'loadBudgets', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
    return events.on(EVENTS.BUDGETS_CHANGED, loadBudgets);
  }, [loadBudgets]);

  const addBudget = useCallback(
    async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const budget = await budgetService.create(data);
        events.emit(EVENTS.BUDGETS_CHANGED);
        return budget;
      } catch (err) {
        throw logger.captureError('useBudgets', 'addBudget', err);
      }
    },
    [],
  );

  const updateBudget = useCallback(async (id: string, data: Partial<Budget>) => {
    try {
      await budgetService.update(id, data);
      events.emit(EVENTS.BUDGETS_CHANGED);
    } catch (err) {
      throw logger.captureError('useBudgets', 'updateBudget', err);
    }
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      await budgetService.delete(id);
      events.emit(EVENTS.BUDGETS_CHANGED);
    } catch (err) {
      throw logger.captureError('useBudgets', 'deleteBudget', err);
    }
  }, []);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refresh: loadBudgets,
  };
}

// ============================================
// ANALYTICS HOOKS
// ============================================

export function useAnalytics(months: number = 12) {
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const monthly = await calculateMonthlyStats(householdId, startDate, endDate);
      setMonthlyData(monthly);

      const categories = await calculateCategoryBreakdown(householdId, startDate, endDate);
      setCategoryData(categories);
    } catch (error) {
      logger.captureError('useAnalytics', 'loadAnalytics', error);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    monthlyData,
    categoryData,
    loading,
    refresh: loadAnalytics,
  };
}

// ============================================
// RECURRING HOOKS
// ============================================

export function useRecurring() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecurring = useCallback(async () => {
    try {
      const householdId = await getHouseholdId();
      const data = await recurringService.getAllActive(householdId);
      // Sort by next due date ascending
      data.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
      setRecurring(data);
    } catch (error) {
      logger.captureError('useRecurring', 'loadRecurring', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecurring();
    return events.on(EVENTS.RECURRING_CHANGED, loadRecurring);
  }, [loadRecurring]);

  const addRecurring = useCallback(
    async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>) => {
      try {
        const item = await recurringService.create(data);
        events.emit(EVENTS.RECURRING_CHANGED);
        return item;
      } catch (err) {
        throw logger.captureError('useRecurring', 'addRecurring', err);
      }
    },
    [],
  );

  const updateRecurring = useCallback(async (id: string, data: Partial<RecurringTransaction>) => {
    try {
      await recurringService.update(id, data);
      events.emit(EVENTS.RECURRING_CHANGED);
    } catch (err) {
      throw logger.captureError('useRecurring', 'updateRecurring', err);
    }
  }, []);

  const deleteRecurring = useCallback(async (id: string) => {
    try {
      await recurringService.delete(id);
      events.emit(EVENTS.RECURRING_CHANGED);
    } catch (err) {
      throw logger.captureError('useRecurring', 'deleteRecurring', err);
    }
  }, []);

  const processPayment = useCallback(async (id: string, accountId: string) => {
    try {
      await recurringService.processPayment(id, accountId);
      events.emit(EVENTS.RECURRING_CHANGED);
      events.emit(EVENTS.TRANSACTIONS_CHANGED);
      events.emit(EVENTS.ACCOUNTS_CHANGED);
    } catch (err) {
      throw logger.captureError('useRecurring', 'processPayment', err);
    }
  }, []);

  return {
    recurring,
    loading,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    processPayment,
    refresh: loadRecurring,
  };
}
