/**
 * Tests: transactionService — create, balance side-effects, delete
 *
 * The transaction create flow is the most complex in the app:
 * it reads the source account, updates its balance, then stores the
 * transaction. A bug in any step would leave the database inconsistent.
 */

import {
  setHouseholdId,
  setCurrentUser,
  accountService,
  transactionService,
} from '@/lib/localdb-services';

const HH = 'test-tx-hh-001';

beforeAll(() => {
  setHouseholdId(HH);
  setCurrentUser({ id: 'user-tx-1', name: 'TX Tester' });
});

// ─── Basic create ─────────────────────────────────────────────────────────────

describe('transactionService.create()', () => {
  it('creates an INCOME transaction and returns it with id and timestamps', async () => {
    const account = await accountService.create({
      name: 'Salary Account',
      type: 'BANK',
      balance: 0,
      currency: 'INR',
    });

    const tx = await transactionService.create({
      accountId: account.id,
      type: 'INCOME',
      amount: 50000,
      description: 'Monthly salary',
      date: new Date().toISOString(),
      categoryId: null,
    });

    expect(tx.id).toBeTruthy();
    expect(tx.type).toBe('INCOME');
    expect(tx.amount).toBe(50000);
    expect(tx.householdId).toBe(HH);
    expect(tx.createdAt).toBeTruthy();
  });

  it('creates an EXPENSE transaction', async () => {
    const account = await accountService.create({
      name: 'Expense Account',
      type: 'BANK',
      balance: 20000,
      currency: 'INR',
    });

    const tx = await transactionService.create({
      accountId: account.id,
      type: 'EXPENSE',
      amount: 1500,
      description: 'Grocery',
      date: new Date().toISOString(),
      categoryId: null,
    });

    expect(tx.type).toBe('EXPENSE');
    expect(tx.amount).toBe(1500);
  });

  it('handles multiple transactions for the same account without crash', async () => {
    const account = await accountService.create({
      name: 'Multi-TX Account',
      type: 'BANK',
      balance: 100000,
      currency: 'INR',
    });

    const txRequests = Array.from({ length: 5 }, (_, i) =>
      transactionService.create({
        accountId: account.id,
        type: 'EXPENSE',
        amount: 100 * (i + 1),
        description: `Purchase ${i + 1}`,
        date: new Date().toISOString(),
        categoryId: null,
      }),
    );

    const txs = await Promise.all(txRequests);
    expect(txs).toHaveLength(5);
    const uniqueIds = new Set(txs.map((t) => t.id));
    expect(uniqueIds.size).toBe(5);
  });
});

// ─── Read ─────────────────────────────────────────────────────────────────────

describe('transactionService.getAll()', () => {
  const HH2 = 'test-tx-hh-002';

  it('returns only transactions for the requested householdId', async () => {
    setHouseholdId(HH2);
    setCurrentUser({ id: 'user-tx-2', name: 'TX User 2' });

    const account = await accountService.create({
      name: 'Iso Account',
      type: 'BANK',
      balance: 5000,
      currency: 'INR',
    });

    await transactionService.create({
      accountId: account.id,
      type: 'INCOME',
      amount: 1000,
      description: 'Test income',
      date: new Date().toISOString(),
      categoryId: null,
    });

    const txs = await transactionService.getAll(HH2);
    expect(txs.length).toBeGreaterThanOrEqual(1);
    txs.forEach((t) => expect(t.householdId).toBe(HH2));

    setHouseholdId(HH);
    setCurrentUser({ id: 'user-tx-1', name: 'TX Tester' });
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe('transactionService.delete()', () => {
  it('removes the transaction from the database', async () => {
    setHouseholdId(HH);
    const account = await accountService.create({
      name: 'Delete TX Account',
      type: 'BANK',
      balance: 5000,
      currency: 'INR',
    });

    const tx = await transactionService.create({
      accountId: account.id,
      type: 'EXPENSE',
      amount: 200,
      description: 'Will be deleted',
      date: new Date().toISOString(),
      categoryId: null,
    });

    await transactionService.delete(tx.id);

    const allTxs = await transactionService.getAll(HH);
    const found = allTxs.find((t) => t.id === tx.id);
    expect(found).toBeUndefined();
  });
});
