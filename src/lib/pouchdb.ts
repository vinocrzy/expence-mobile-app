/**
 * PouchDB Setup for React Native
 * 
 * Uses memory adapter for now (data persists while app is running).
 * TODO: Swap to expo-sqlite adapter for persistent storage in Phase 10.
 * 
 * The API is identical to the web version — all services work without changes.
 */

import PouchDB from 'pouchdb-core';
import HttpPouch from 'pouchdb-adapter-http';
import mapreduce from 'pouchdb-mapreduce';
import replication from 'pouchdb-replication';
import find from 'pouchdb-find';
import memoryAdapter from 'pouchdb-adapter-memory';

// Register plugins
PouchDB.plugin(HttpPouch);
PouchDB.plugin(mapreduce);
PouchDB.plugin(replication);
PouchDB.plugin(find);
PouchDB.plugin(memoryAdapter);

const createDB = (name: string): PouchDB.Database => {
  return new PouchDB(name, {
    adapter: 'memory',
    auto_compaction: true,
  });
};

// Singleton instances — same 8 databases as web
export const accountsDB = createDB('accounts');
export const transactionsDB = createDB('transactions');
export const categoriesDB = createDB('categories');
export const creditcardsDB = createDB('creditcards');
export const loansDB = createDB('loans');
export const budgetsDB = createDB('budgets');
export const recurringDB = createDB('recurring');
export const sharedDB = createDB('shared');

// Map for easier access
export const collections: Record<string, PouchDB.Database> = {
  accounts: accountsDB,
  transactions: transactionsDB,
  categories: categoriesDB,
  creditcards: creditcardsDB,
  loans: loansDB,
  budgets: budgetsDB,
  recurring: recurringDB,
  shared: sharedDB,
};

let initialized = false;

/**
 * Initialize all PouchDB indexes.
 * Must be called once at app startup (from LocalFirstContext).
 */
export const initDB = async (): Promise<void> => {
  if (initialized) return;
  console.log('[PouchDB] Initializing indexes...');

  try {
    // Transaction indexes
    await transactionsDB.createIndex({ index: { fields: ['date'] } });
    await transactionsDB.createIndex({ index: { fields: ['accountId'] } });
    await transactionsDB.createIndex({ index: { fields: ['categoryId'] } });
    await transactionsDB.createIndex({ index: { fields: ['householdId', 'date'] } });
    await transactionsDB.createIndex({ index: { fields: ['accountId', 'date'] } });

    // Account indexes
    await accountsDB.createIndex({ index: { fields: ['householdId'] } });

    // Category indexes
    await categoriesDB.createIndex({ index: { fields: ['householdId'] } });
    await categoriesDB.createIndex({ index: { fields: ['type'] } });

    // CreditCard indexes
    await creditcardsDB.createIndex({ index: { fields: ['householdId'] } });

    // Loan indexes
    await loansDB.createIndex({ index: { fields: ['householdId'] } });

    // Budget indexes
    await budgetsDB.createIndex({ index: { fields: ['householdId'] } });
    await budgetsDB.createIndex({ index: { fields: ['budgetMode'] } });
    await budgetsDB.createIndex({ index: { fields: ['status'] } });

    // Recurring indexes
    await recurringDB.createIndex({ index: { fields: ['householdId'] } });
    await recurringDB.createIndex({ index: { fields: ['nextDueDate'] } });
    await recurringDB.createIndex({ index: { fields: ['status'] } });

    console.log('[PouchDB] Indexes initialized.');
    initialized = true;
  } catch (err) {
    console.error('[PouchDB] Failed to initialize indexes:', err);
  }
};
