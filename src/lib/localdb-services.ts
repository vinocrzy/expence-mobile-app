/**
 * Local Database Service Layer (PouchDB)
 * All CRUD operations for local-first data management.
 *
 * Ported from Expense-Web (lib/localdb-services.ts) — business logic is identical.
 * Only import paths changed (./pouchdb → @/lib/pouchdb, ./db-types → @/types/db-types).
 */

import {
  accountsDB,
  categoriesDB,
  transactionsDB,
  creditcardsDB,
  loansDB,
  budgetsDB,
  recurringDB,
  sharedDB,
  initDB,
} from './pouchdb';
import { v4 as uuidv4 } from 'uuid';
import type {
  Account,
  Category,
  Transaction,
  CreditCard,
  Loan,
  Budget,
  Household,
  RecurringTransaction,
  SharedTransaction,
  SharedAccountBalance,
} from '@/types/db-types';

// ============================================
// HELPERS
// ============================================

const generateId = (): string => {
  try {
    return uuidv4();
  } catch {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `id_${timestamp}_${random}`;
  }
};

const safeGet = async <T>(db: PouchDB.Database, id: string): Promise<T | undefined> => {
  try {
    const doc = await db.get(id);
    return doc as unknown as T;
  } catch (err: any) {
    if (err.status === 404) return undefined;
    throw err;
  }
};

// Ensure indexes on first import
initDB();

// ============================================
// ACCOUNT OPERATIONS
// ============================================

export const accountService = {
  async getAll(householdId: string): Promise<Account[]> {
    const result = await accountsDB.find({
      selector: { householdId: { $eq: householdId } },
    });
    return result.docs.filter((doc: any) => doc._id !== 'household_metadata') as unknown as Account[];
  },

  async getAllActive(householdId: string): Promise<Account[]> {
    const result = await accountsDB.find({
      selector: {
        householdId: { $eq: householdId },
        isArchived: { $ne: true },
      },
    });
    return result.docs.filter((doc: any) => doc._id !== 'household_metadata') as unknown as Account[];
  },

  async getById(id: string): Promise<Account | undefined> {
    return safeGet<Account>(accountsDB, id);
  },

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>): Promise<Account> {
    const householdId = await getHouseholdId();
    const user = getCurrentUser();
    const now = new Date().toISOString();
    const id = generateId();
    const account: Account = {
      ...data,
      id,
      householdId,
      userId: user?.id,
      createdByName: user?.name,
      createdAt: now,
      updatedAt: now,
    };
    const docToSave = { ...account, _id: id };
    const response = await accountsDB.put(docToSave);
    return { ...account, _rev: response.rev };
  },

  async update(id: string, data: Partial<Account>): Promise<Account> {
    const doc = (await accountsDB.get(id)) as any;
    const updatedDoc = {
      ...doc,
      ...data,
      updatedAt: new Date().toISOString(),
      _id: id,
      _rev: doc._rev,
    };
    const response = await accountsDB.put(updatedDoc);
    return { ...updatedDoc, _rev: response.rev };
  },

  async delete(id: string): Promise<void> {
    try {
      const doc = await accountsDB.get(id);
      await accountsDB.remove(doc);
    } catch (err: any) {
      if (err.status !== 404) throw err;
    }
  },

  async archive(id: string): Promise<Account> {
    return this.update(id, { isArchived: true });
  },

  async hasTransactions(id: string): Promise<boolean> {
    const result = await transactionsDB.find({
      selector: { accountId: { $eq: id } },
      limit: 1,
    });
    return result.docs.length > 0;
  },

  async calculateTotalBalance(householdId: string): Promise<number> {
    const accounts = await this.getAllActive(householdId);
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  },
};

// ============================================
// CATEGORY OPERATIONS
// ============================================

export const categoryService = {
  async getAll(householdId: string): Promise<Category[]> {
    const result = await categoriesDB.find({
      selector: { householdId: { $eq: householdId } },
    });
    return result.docs as unknown as Category[];
  },

  async getByType(householdId: string, type: string): Promise<Category[]> {
    const result = await categoriesDB.find({
      selector: {
        householdId: { $eq: householdId },
        type: { $eq: type },
      },
    });
    return result.docs as unknown as Category[];
  },

  async getById(id: string): Promise<Category | undefined> {
    return safeGet<Category>(categoriesDB, id);
  },

  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>): Promise<Category> {
    const householdId = await getHouseholdId();
    const now = new Date().toISOString();
    const id = generateId();
    const category: Category = {
      ...data,
      id,
      householdId,
      createdAt: now,
      updatedAt: now,
    };
    const docToSave = { ...category, _id: id };
    const response = await categoriesDB.put(docToSave);
    return { ...category, _rev: response.rev };
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const doc = (await categoriesDB.get(id)) as any;
    const updatedDoc = {
      ...doc,
      ...data,
      updatedAt: new Date().toISOString(),
      _id: id,
      _rev: doc._rev,
    };
    const response = await categoriesDB.put(updatedDoc);
    return { ...updatedDoc, _rev: response.rev };
  },

  async delete(id: string): Promise<void> {
    try {
      const doc = await categoriesDB.get(id);
      await categoriesDB.remove(doc);
    } catch (err: any) {
      if (err.status !== 404) throw err;
    }
  },
};

// ============================================
// TRANSACTION OPERATIONS
// ============================================

export const transactionService = {
  async getAll(householdId: string): Promise<Transaction[]> {
    const result = await transactionsDB.find({
      selector: {
        householdId: { $eq: householdId },
        date: { $gt: null },
      },
      sort: [{ date: 'desc' }],
      limit: 10000,
    });
    return result.docs as unknown as Transaction[];
  },

  async getByDateRange(
    householdId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const result = await transactionsDB.find({
      selector: {
        householdId: { $eq: householdId },
        date: { $gte: startStr, $lte: endStr },
      },
      sort: [{ date: 'desc' }],
      limit: 10000,
    });
    return result.docs as unknown as Transaction[];
  },

  async getByAccount(accountId: string): Promise<Transaction[]> {
    const result = await transactionsDB.find({
      selector: {
        accountId: { $eq: accountId },
        date: { $gt: null },
      },
      sort: [{ date: 'desc' }],
      limit: 10000,
    });
    return result.docs as unknown as Transaction[];
  },

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    const result = await transactionsDB.find({
      selector: { categoryId: { $eq: categoryId } },
      limit: 10000,
    });
    return (result.docs as unknown as Transaction[]).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return safeGet<Transaction>(transactionsDB, id);
  },

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>,
  ): Promise<Transaction> {
    const householdId = await getHouseholdId();
    const user = getCurrentUser();
    const now = new Date().toISOString();

    // Update account balance or credit card outstanding
    try {
      try {
        const accountDoc = (await accountsDB.get(data.accountId)) as any;
        const currentBalance = accountDoc.balance || 0;
        const newBalance =
          data.type === 'INCOME'
            ? currentBalance + data.amount
            : currentBalance - data.amount;

        await accountsDB.put({
          ...accountDoc,
          balance: newBalance,
          updatedAt: now,
        });
      } catch (err: any) {
        if (err.status === 404) {
          try {
            const ccDoc = (await creditcardsDB.get(data.accountId)) as any;
            const currentOutstanding = Number(ccDoc.currentOutstanding || 0);
            const newOutstanding =
              data.type === 'EXPENSE' || data.type === 'DEBT'
                ? currentOutstanding + Number(data.amount)
                : currentOutstanding - Number(data.amount);

            await creditcardsDB.put({
              ...ccDoc,
              currentOutstanding: newOutstanding,
              updatedAt: now,
            });
          } catch (ccErr) {
            console.error('Account/Card not found for transaction', ccErr);
          }
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Failed to update balance', err);
    }

    // Handle Transfer Destination Account
    if (data.type === 'TRANSFER' && data.transferAccountId) {
      try {
        const transferAccountDoc = (await accountsDB.get(data.transferAccountId)) as any;
        const currentBalance = transferAccountDoc.balance || 0;
        const newBalance = currentBalance + data.amount;
        await accountsDB.put({
          ...transferAccountDoc,
          balance: newBalance,
          updatedAt: now,
        });
      } catch (err: any) {
        console.error('Failed to update transfer account balance', err);
      }
    }

    const id = generateId();
    const transaction: Transaction = {
      ...data,
      id,
      householdId,
      userId: user?.id,
      createdByName: user?.name,
      userColor: user?.color,
      createdAt: now,
      updatedAt: now,
    };

    const docToSave = { ...transaction, _id: id };
    const response = await transactionsDB.put(docToSave);
    return { ...transaction, _rev: response.rev };
  },

  async saveSplitTransaction(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>,
  ): Promise<Transaction> {
    if (data.isSplit && data.splits && data.splits.length > 0) {
      const totalSplits = data.splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplits - data.amount) > 0.01) {
        throw new Error(`Split amount mismatch. Total: ${data.amount}, Splits: ${totalSplits}`);
      }
    }
    return this.create(data);
  },

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const oldTxDoc = (await transactionsDB.get(id)) as any;
    const oldTx = oldTxDoc as Transaction;
    const now = new Date().toISOString();

    // Revert old transaction effect on account or credit card
    try {
      try {
        const accountDoc = (await accountsDB.get(oldTx.accountId)) as any;
        if (accountDoc) {
          let balance = accountDoc.balance || 0;
          // Revert old
          balance = oldTx.type === 'INCOME' ? balance - oldTx.amount : balance + oldTx.amount;
          // Apply new
          const newAmount = data.amount ?? oldTx.amount;
          const newType = data.type ?? oldTx.type;
          balance = newType === 'INCOME' ? balance + newAmount : balance - newAmount;

          await accountsDB.put({ ...accountDoc, balance, updatedAt: now });
        }
      } catch (err: any) {
        if (err.status === 404) {
          try {
            const ccDoc = (await creditcardsDB.get(oldTx.accountId)) as any;
            if (ccDoc) {
              let outstanding = ccDoc.currentOutstanding || 0;
              outstanding =
                oldTx.type === 'INCOME'
                  ? outstanding + oldTx.amount
                  : outstanding - oldTx.amount;
              const newAmount = data.amount ?? oldTx.amount;
              const newType = data.type ?? oldTx.type;
              outstanding =
                newType === 'EXPENSE' || newType === 'DEBT'
                  ? outstanding + newAmount
                  : outstanding - newAmount;

              await creditcardsDB.put({ ...ccDoc, currentOutstanding: outstanding, updatedAt: now });
            }
          } catch (_ccErr) {
            // ignore
          }
        }
      }
    } catch (_err) {
      // ignore
    }

    // Revert old transfer effect
    if (oldTx.type === 'TRANSFER' && oldTx.transferAccountId) {
      try {
        const oldTransferDoc = (await accountsDB.get(oldTx.transferAccountId)) as any;
        if (oldTransferDoc) {
          const newBalance = (oldTransferDoc.balance || 0) - oldTx.amount;
          await accountsDB.put({ ...oldTransferDoc, balance: newBalance, updatedAt: now });
        }
      } catch (_err) {
        // ignore
      }
    }

    // Apply new transfer effect
    const newType = data.type ?? oldTx.type;
    const newAmount = data.amount ?? oldTx.amount;
    const newTransferAccountId = data.transferAccountId ?? oldTx.transferAccountId;
    if (newType === 'TRANSFER' && newTransferAccountId) {
      try {
        const transferDoc = (await accountsDB.get(newTransferAccountId)) as any;
        if (transferDoc) {
          const newBalance = (transferDoc.balance || 0) + newAmount;
          await accountsDB.put({ ...transferDoc, balance: newBalance, updatedAt: now });
        }
      } catch (_err) {
        // ignore
      }
    }

    const updatedDoc = {
      ...oldTxDoc,
      ...data,
      date:
        (data.date as any) instanceof Date
          ? (data.date as any).toISOString()
          : data.date || oldTxDoc.date,
      updatedAt: now,
      _id: id,
      _rev: oldTxDoc._rev,
    };
    const response = await transactionsDB.put(updatedDoc);
    return { ...updatedDoc, _rev: response.rev } as Transaction;
  },

  async bulkUpdate(ids: string[], data: Partial<Transaction>): Promise<void> {
    const now = new Date().toISOString();
    const docs = await Promise.all(ids.map((id) => transactionsDB.get(id)));
    const updatedDocs = docs.map((doc: any) => ({
      ...doc,
      ...data,
      updatedAt: now,
      _id: doc._id,
      _rev: doc._rev,
    }));
    await transactionsDB.bulkDocs(updatedDocs);
  },

  async delete(id: string): Promise<void> {
    const txDoc = (await transactionsDB.get(id)) as any;
    const tx = txDoc as Transaction;
    const now = new Date().toISOString();

    // Revert balance effect
    try {
      try {
        const accountDoc = (await accountsDB.get(tx.accountId)) as any;
        if (accountDoc) {
          let balance = accountDoc.balance || 0;
          balance = tx.type === 'INCOME' ? balance - tx.amount : balance + tx.amount;
          await accountsDB.put({ ...accountDoc, balance, updatedAt: now });
        }
      } catch (err: any) {
        if (err.status === 404) {
          try {
            const ccDoc = (await creditcardsDB.get(tx.accountId)) as any;
            let outstanding = ccDoc.currentOutstanding || 0;
            outstanding =
              tx.type === 'INCOME' ? outstanding + tx.amount : outstanding - tx.amount;
            await creditcardsDB.put({ ...ccDoc, currentOutstanding: outstanding, updatedAt: now });
          } catch (_ccErr) {
            // ignore
          }
        }
      }
    } catch (_err) {
      // ignore
    }

    // Revert transfer effect
    if (tx.type === 'TRANSFER' && tx.transferAccountId) {
      try {
        const transferDoc = (await accountsDB.get(tx.transferAccountId)) as any;
        if (transferDoc) {
          const newBalance = (transferDoc.balance || 0) - tx.amount;
          await accountsDB.put({ ...transferDoc, balance: newBalance, updatedAt: now });
        }
      } catch (_err) {
        // ignore
      }
    }

    await transactionsDB.remove(txDoc);
  },

  async getTotalIncome(householdId: string, startDate: Date, endDate: Date): Promise<number> {
    const txs = await this.getByDateRange(householdId, startDate, endDate);
    return txs.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  },

  async getTotalExpense(householdId: string, startDate: Date, endDate: Date): Promise<number> {
    const txs = await this.getByDateRange(householdId, startDate, endDate);
    return txs.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  },

  async getTotalInvestments(householdId: string, startDate: Date, endDate: Date): Promise<number> {
    const txs = await this.getByDateRange(householdId, startDate, endDate);
    return txs.filter((t) => t.type === 'INVESTMENT').reduce((sum, t) => sum + t.amount, 0);
  },
};

// ============================================
// CREDIT CARD OPERATIONS
// ============================================

export const creditCardService = {
  async getAll(householdId: string): Promise<CreditCard[]> {
    const result = await creditcardsDB.find({
      selector: { householdId: { $eq: householdId } },
    });
    return result.docs as unknown as CreditCard[];
  },

  async getAllActive(householdId: string): Promise<CreditCard[]> {
    const result = await creditcardsDB.find({
      selector: {
        householdId: { $eq: householdId },
        isArchived: { $ne: true },
      },
    });
    return result.docs as unknown as CreditCard[];
  },

  async getById(id: string): Promise<CreditCard | undefined> {
    return safeGet<CreditCard>(creditcardsDB, id);
  },

  async create(
    data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>,
  ): Promise<CreditCard> {
    const householdId = await getHouseholdId();
    const now = new Date().toISOString();
    const id = generateId();
    const card = { ...data, id, householdId, createdAt: now, updatedAt: now };
    const docToSave = { ...card, _id: id };
    const response = await creditcardsDB.put(docToSave);
    return { ...card, _rev: response.rev };
  },

  async update(id: string, data: Partial<CreditCard>): Promise<CreditCard> {
    const doc = (await creditcardsDB.get(id)) as any;
    const updated = { ...doc, ...data, updatedAt: new Date().toISOString(), _id: id, _rev: doc._rev };
    const response = await creditcardsDB.put(updated);
    return { ...updated, _rev: response.rev };
  },

  async delete(id: string): Promise<void> {
    try {
      const doc = await creditcardsDB.get(id);
      await creditcardsDB.remove(doc);
    } catch (_e) {
      // ignore
    }
  },

  async archive(id: string): Promise<CreditCard> {
    return this.update(id, { isArchived: true });
  },

  async generateStatement(creditCardId: string): Promise<void> {
    const card = await this.getById(creditCardId);
    if (!card) throw new Error('Card not found');

    const billingDay = card.billingCycle || 1;

    const now = new Date();
    let cycleEndDetails = new Date();
    cycleEndDetails.setDate(billingDay - 1);
    if (now.getDate() < billingDay) {
      cycleEndDetails.setMonth(cycleEndDetails.getMonth() - 1);
    }
    cycleEndDetails.setHours(23, 59, 59, 999);

    let cycleStartDetails = new Date(cycleEndDetails);
    cycleStartDetails.setMonth(cycleStartDetails.getMonth() - 1);
    cycleStartDetails.setDate(billingDay);
    cycleStartDetails.setHours(0, 0, 0, 0);

    const txs = await transactionService.getByAccount(creditCardId);
    const cycleTxs = txs.filter((t) => {
      const d = new Date(t.date);
      return d >= cycleStartDetails && d <= cycleEndDetails;
    });

    const expenses = cycleTxs
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = cycleTxs
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const existing = (card.statements || []).find(
      (s) => new Date(s.cycleEnd).toDateString() === cycleEndDetails.toDateString(),
    );
    if (existing) return;

    const previousStatement = (card.statements || [])[0];
    const prevBalance = previousStatement ? previousStatement.closingBalance : 0;
    const closingBalance = prevBalance + expenses - payments;
    const minimumDue = Math.round(closingBalance * 0.05);

    const dueDate = new Date(cycleEndDetails);
    dueDate.setDate(dueDate.getDate() + 20);

    const newStatement: any = {
      id: generateId(),
      statementDate: new Date().toISOString(),
      cycleStart: cycleStartDetails.toISOString(),
      cycleEnd: cycleEndDetails.toISOString(),
      dueDate: dueDate.toISOString(),
      closingBalance: Math.max(0, closingBalance),
      minimumDue: Math.max(0, minimumDue),
      totalPayments: 0,
      status: closingBalance <= 0 ? 'PAID' : 'UNPAID',
    };

    const updatedStatements = [newStatement, ...(card.statements || [])];
    await this.update(creditCardId, { statements: updatedStatements });
  },

  async recordPayment(id: string, amount: number): Promise<void> {
    const card = await this.getById(id);
    if (!card) throw new Error('Card not found');
    const updatedOutstanding = (card.currentOutstanding || 0) - amount;
    await this.update(id, { currentOutstanding: Math.max(0, updatedOutstanding) });
  },
};

// ============================================
// LOAN OPERATIONS
// ============================================

export const loanService = {
  async getAll(householdId: string): Promise<Loan[]> {
    const result = await loansDB.find({ selector: { householdId: { $eq: householdId } } });
    return result.docs as unknown as Loan[];
  },

  async getById(id: string): Promise<Loan | undefined> {
    return safeGet<Loan>(loansDB, id);
  },

  async create(data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>): Promise<Loan> {
    const householdId = await getHouseholdId();
    const now = new Date().toISOString();
    const id = generateId();

    // Auto-calculate EMI
    let emiAmount = data.emiAmount;
    if (!emiAmount && data.principal && data.interestRate && data.tenureMonths) {
      const p = data.principal;
      const r = data.interestRate / 12 / 100;
      const n = data.tenureMonths;
      emiAmount = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      emiAmount = Math.round(emiAmount * 100) / 100;
    }

    // Calculate outstanding if initial EMIs already paid
    let outstandingPrincipal = data.outstandingPrincipal ?? data.principal;
    if (data.initialPaidEmis && data.initialPaidEmis > 0 && emiAmount) {
      let balance = data.principal;
      const r = data.interestRate / 12 / 100;
      for (let i = 0; i < data.initialPaidEmis; i++) {
        const interest = balance * r;
        const principalComponent = emiAmount - interest;
        balance -= principalComponent;
      }
      outstandingPrincipal = Math.max(0, Math.round(balance * 100) / 100);
    }

    const loan: Loan = {
      ...data,
      id,
      householdId,
      outstandingPrincipal,
      status: data.status ?? 'ACTIVE',
      emiAmount,
      createdAt: now,
      updatedAt: now,
      startDate:
        typeof data.startDate === 'string'
          ? data.startDate
          : (data.startDate as any) instanceof Date
            ? (data.startDate as any).toISOString()
            : undefined,
    } as Loan;
    const docToSave = { ...loan, _id: id };
    const response = await loansDB.put(docToSave);
    return { ...loan, _rev: response.rev };
  },

  async update(id: string, data: Partial<Loan>): Promise<Loan> {
    const doc = (await loansDB.get(id)) as any;
    const patchData = { ...data, updatedAt: new Date().toISOString() };
    if (patchData.startDate && (patchData.startDate as any) instanceof Date) {
      patchData.startDate = (patchData.startDate as any).toISOString();
    }
    const updated = { ...doc, ...patchData, _id: id, _rev: doc._rev };
    const response = await loansDB.put(updated);
    return { ...updated, _rev: response.rev };
  },

  async delete(id: string): Promise<void> {
    try {
      await loansDB.remove(await loansDB.get(id));
    } catch (_e) {
      // ignore
    }
  },

  calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / tenureMonths;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
  },

  async recordPayment(id: string, amount: number): Promise<void> {
    const loan = await this.getById(id);
    if (!loan) throw new Error('Loan not found');
    const updatedOutstanding = (loan.outstandingPrincipal || 0) - amount;
    const newStatus = updatedOutstanding <= 0 ? 'CLOSED' : loan.status || 'ACTIVE';
    const normalizedPaidEmis = (loan.paidEmis || 0) + 1;
    await this.update(id, {
      outstandingPrincipal: Math.max(0, updatedOutstanding),
      paidEmis: normalizedPaidEmis,
      status: newStatus,
    });
  },
};

// ============================================
// RECURRING / SUBSCRIPTION OPERATIONS
// ============================================

export const recurringService = {
  async getAll(householdId: string): Promise<RecurringTransaction[]> {
    const result = await recurringDB.find({
      selector: { householdId: { $eq: householdId } },
    });
    return result.docs as unknown as RecurringTransaction[];
  },

  async getAllActive(householdId: string): Promise<RecurringTransaction[]> {
    const result = await recurringDB.find({
      selector: {
        householdId: { $eq: householdId },
        status: { $eq: 'ACTIVE' },
      },
    });
    return result.docs as unknown as RecurringTransaction[];
  },

  async getUpcoming(householdId: string, daysAhead: number = 30): Promise<RecurringTransaction[]> {
    const result = await recurringDB.find({
      selector: {
        householdId: { $eq: householdId },
        status: { $eq: 'ACTIVE' },
        nextDueDate: { $gt: new Date().toISOString() },
      },
    });
    const allActive = result.docs as unknown as RecurringTransaction[];
    const now = new Date();
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + daysAhead);

    return allActive
      .filter((r) => {
        const d = new Date(r.nextDueDate);
        return d >= now && d <= limitDate;
      })
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  },

  async create(
    data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>,
  ): Promise<RecurringTransaction> {
    const householdId = await getHouseholdId();
    const now = new Date().toISOString();
    const id = generateId();
    const recurring: RecurringTransaction = {
      ...data,
      id,
      householdId,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    const docToSave = { ...recurring, _id: id };
    const response = await recurringDB.put(docToSave);
    return { ...recurring, _rev: response.rev };
  },

  async update(id: string, data: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    const doc = (await recurringDB.get(id)) as any;
    const updated = { ...doc, ...data, updatedAt: new Date().toISOString(), _id: id, _rev: doc._rev };
    const response = await recurringDB.put(updated);
    return { ...updated, _rev: response.rev };
  },

  async delete(id: string): Promise<void> {
    try {
      await recurringDB.remove(await recurringDB.get(id));
    } catch (_e) {
      // ignore
    }
  },

  async processPayment(
    id: string,
    accountId: string,
    actualDate: string = new Date().toISOString(),
  ): Promise<void> {
    const recurring = (await recurringDB.get(id)) as unknown as RecurringTransaction;
    if (!recurring) throw new Error('Recurring item not found');

    // Create actual transaction
    await transactionService.create({
      amount: recurring.amount,
      type: recurring.type,
      description: `Recurring: ${recurring.name}`,
      date: actualDate,
      categoryId: recurring.categoryId,
      accountId: accountId || recurring.accountId || '',
    } as any);

    // Update next due date
    const currentDue = new Date(recurring.nextDueDate);
    const nextDue = new Date(currentDue);
    switch (recurring.frequency) {
      case 'MONTHLY':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
      case 'WEEKLY':
        nextDue.setDate(nextDue.getDate() + 7);
        break;
    }
    await this.update(id, {
      lastPaidDate: actualDate,
      nextDueDate: nextDue.toISOString(),
    });
  },
};

// ============================================
// BUDGET OPERATIONS
// ============================================

export const budgetService = {
  async getAll(householdId: string): Promise<Budget[]> {
    const result = await budgetsDB.find({ selector: { householdId: { $eq: householdId } } });
    return result.docs as unknown as Budget[];
  },

  async getById(id: string): Promise<Budget | undefined> {
    return safeGet<Budget>(budgetsDB, id);
  },

  async create(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'householdId'>): Promise<Budget> {
    const householdId = await getHouseholdId();
    const now = new Date().toISOString();
    const id = generateId();
    const budget: Budget = {
      ...data,
      planItems: data.planItems as any[],
      id,
      householdId,
      createdAt: now,
      updatedAt: now,
    };
    const docToSave = { ...budget, _id: id };
    const response = await budgetsDB.put(docToSave);
    return { ...budget, _rev: response.rev };
  },

  async update(id: string, data: Partial<Budget>): Promise<Budget> {
    const doc = (await budgetsDB.get(id)) as any;
    const updated = {
      ...doc,
      ...data,
      planItems: (data.planItems as any[]) || doc.planItems,
      updatedAt: new Date().toISOString(),
      _id: id,
      _rev: doc._rev,
    };
    const response = await budgetsDB.put(updated);
    return { ...updated, _rev: response.rev };
  },

  async delete(id: string): Promise<void> {
    try {
      await budgetsDB.remove(await budgetsDB.get(id));
    } catch (_e) {
      // ignore
    }
  },

  async getActiveEventBudgets(): Promise<Budget[]> {
    const result = await budgetsDB.find({
      selector: { budgetMode: { $eq: 'EVENT' }, status: { $eq: 'ACTIVE' } },
    });
    return result.docs as unknown as Budget[];
  },

  async addPlanItem(budgetId: string, item: any): Promise<any> {
    const doc = (await budgetsDB.get(budgetId)) as any;
    const planItems = doc.planItems || [];
    const newItem = { ...item, id: generateId() };
    const updated = {
      ...doc,
      planItems: [...planItems, newItem],
      updatedAt: new Date().toISOString(),
      _rev: doc._rev,
    };
    await budgetsDB.put(updated);
    return newItem;
  },

  async removePlanItem(budgetId: string, itemId: string): Promise<void> {
    const doc = (await budgetsDB.get(budgetId)) as any;
    const planItems = (doc.planItems || []).filter((i: any) => i.id !== itemId);
    const updated = {
      ...doc,
      planItems,
      updatedAt: new Date().toISOString(),
      _rev: doc._rev,
    };
    await budgetsDB.put(updated);
  },

  async activate(budgetId: string): Promise<Budget> {
    return this.update(budgetId, { status: 'ACTIVE' });
  },
};

// Stub services (matching web)
export const creditCardTransactionService = {
  async getAll() { return []; },
  async getUnpaid() { return []; },
  async markAsPaid() { throw new Error('Not implemented yet'); },
};

export const loanPaymentService = {
  async getAll() { return []; },
  async create() { throw new Error('Not implemented yet'); },
};

export const budgetPlanItemService = {
  async getAll() { return []; },
};

// ============================================
// HOUSEHOLD / USER CONTEXT
// ============================================

let currentHouseholdId: string | null = null;
let currentUser: { id: string; name: string; color?: string } | null = null;

export const setHouseholdId = (id: string | null) => {
  currentHouseholdId = id;
};

export const setCurrentUser = (user: { id: string; name: string; color?: string } | null) => {
  currentUser = user;
};

export const getHouseholdId = async (): Promise<string> => {
  if (!currentHouseholdId) {
    console.warn('[Services] getHouseholdId called but no householdId set. Using fallback.');
    return 'household_1';
  }
  return currentHouseholdId;
};

export const getCurrentUser = () => currentUser;

// ============================================
// HOUSEHOLD OPERATIONS
// ============================================

export const householdService = {
  async getCurrent(): Promise<Household | null> {
    try {
      const doc = await accountsDB.get('household_metadata');
      return doc as unknown as Household;
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  },

  async create(name: string, owner: { id: string; name: string; email: string }): Promise<Household> {
    const householdId = await getHouseholdId();
    const now = new Date().toISOString();
    const household: Household = {
      id: householdId,
      name,
      ownerId: owner.id,
      inviteCode: 'INV-' + generateId().replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase(),
      members: [
        {
          userId: owner.id,
          name: owner.name,
          email: owner.email,
          role: 'OWNER',
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      _id: 'household_metadata',
    };
    await accountsDB.put(household);
    return household;
  },

  async update(data: Partial<Household>) {
    const current = await this.getCurrent();
    if (!current) throw new Error('No household found');
    const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
    await accountsDB.put(updated);
    return updated;
  },

  async mockJoin(_code: string) {
    return true;
  },
};

// ============================================
// SHARED DATA PUBLISHING
// ============================================

export const sharedDataService = {
  async publishSnapshot(householdId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await transactionService.getByDateRange(householdId, startOfMonth, endOfMonth);
    const accounts = await accountService.getAllActive(householdId);
    const creditCards = await creditCardService.getAllActive(householdId);

    // Clear existing shared DB
    const allShared = await sharedDB.allDocs({ include_docs: true });
    const deletions = allShared.rows.map((row) => ({
      _id: row.id,
      _rev: (row.doc as any)._rev,
      _deleted: true,
    }));
    if (deletions.length > 0) await sharedDB.bulkDocs(deletions);

    const categories = await categoryService.getAll(householdId);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const accountMap = new Map<string, string>();
    accounts.forEach((a) => accountMap.set(a.id, a.name));
    creditCards.forEach((c) => accountMap.set(c.id, c.name));

    const newDocs: any[] = [];

    transactions.forEach((t) => {
      const sharedTx: SharedTransaction = {
        id: t.id,
        date: t.date,
        amount: t.amount,
        type: t.type,
        categoryName: catMap.get(t.categoryId || '') || 'Uncategorized',
        description: t.description || '',
        accountName: accountMap.get(t.accountId) || 'Unknown Account',
        user: 'Owner',
      };
      newDocs.push({ ...sharedTx, _id: `tx_${t.id}`, docType: 'TRANSACTION' });
    });

    accounts.forEach((a) => {
      const sharedBal: SharedAccountBalance = {
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance || 0,
        currency: a.currency,
      };
      newDocs.push({ ...sharedBal, _id: `bal_${a.id}`, docType: 'BALANCE' });
    });

    creditCards.forEach((cc) => {
      const sharedBal: SharedAccountBalance = {
        id: cc.id,
        name: cc.name,
        type: 'Credit Card',
        balance: -(cc.currentOutstanding || 0),
        currency: 'INR',
      };
      newDocs.push({ ...sharedBal, _id: `bal_${cc.id}`, docType: 'BALANCE' });
    });

    await sharedDB.bulkDocs(newDocs);
    console.log(`[Shared] Published ${newDocs.length} items.`);
  },

  async getSharedTransactions(): Promise<SharedTransaction[]> {
    const result = await sharedDB.find({ selector: { docType: 'TRANSACTION' } });
    return (result.docs as any[]).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },

  async getSharedBalances(): Promise<SharedAccountBalance[]> {
    const result = await sharedDB.find({ selector: { docType: 'BALANCE' } });
    return result.docs as any[];
  },
};
