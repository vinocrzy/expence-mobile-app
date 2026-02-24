/**
 * Tests: accountService CRUD operations
 *
 * These are integration-level tests that use the real PouchDB memory adapter
 * (the same path that runs in the app) so we catch actual crashes instead of
 * mocked behaviour.
 *
 * Each describe block uses a unique householdId to isolate data between suites
 * without needing to destroy/recreate databases.
 */

import {
  setHouseholdId,
  setCurrentUser,
  accountService,
} from '@/lib/localdb-services';
import type { Account } from '@/types/db-types';

const HH = 'test-acct-hh-001';

beforeAll(() => {
  setHouseholdId(HH);
  setCurrentUser({ id: 'user-test-1', name: 'Test User', color: '#A78BFA' });
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe('accountService.create()', () => {
  it('creates and returns a valid account object', async () => {
    const account = await accountService.create({
      name: 'HDFC Savings',
      type: 'SAVINGS',
      balance: 10000,
      currency: 'INR',
    });

    expect(account.id).toBeTruthy();
    expect(account.name).toBe('HDFC Savings');
    expect(account.type).toBe('SAVINGS');
    expect(account.balance).toBe(10000);
    expect(account.currency).toBe('INR');
    expect(account.householdId).toBe(HH);
    expect(account.userId).toBe('user-test-1');
    expect(account.createdAt).toBeTruthy();
    expect(account.updatedAt).toBeTruthy();
  });

  it('creates an account with zero balance', async () => {
    const account = await accountService.create({
      name: 'Empty Wallet',
      type: 'WALLET',
      balance: 0,
      currency: 'INR',
    });
    expect(account.balance).toBe(0);
  });

  it('creates an account with a fractional balance', async () => {
    const account = await accountService.create({
      name: 'USD Acct',
      type: 'BANK',
      balance: 1234.56,
      currency: 'USD',
    });
    expect(account.balance).toBeCloseTo(1234.56);
    expect(account.currency).toBe('USD');
  });

  // This test reproduces the exact crash scenario: multiple creates in quick succession
  it('handles rapid sequential creates without crash', async () => {
    const types = ['BANK', 'SAVINGS', 'CHECKING', 'WALLET', 'INVESTMENT', 'CASH_RESERVE'] as const;
    const results = await Promise.all(
      types.map((type) =>
        accountService.create({ name: `Account ${type}`, type, balance: 500, currency: 'INR' }),
      ),
    );
    expect(results).toHaveLength(types.length);
    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(types.length); // all IDs must be unique
  });
});

// ─── Read ─────────────────────────────────────────────────────────────────────

describe('accountService.getAll()', () => {
  const HH2 = 'test-acct-hh-002';

  beforeAll(() => {
    setHouseholdId(HH2);
  });

  afterAll(() => {
    setHouseholdId(HH);
  });

  it('returns only accounts belonging to the requested householdId', async () => {
    await accountService.create({ name: 'Mine', type: 'BANK', balance: 1000, currency: 'INR' });
    await accountService.create({ name: 'Mine 2', type: 'SAVINGS', balance: 2000, currency: 'INR' });

    const accounts = await accountService.getAll(HH2);
    expect(accounts.length).toBeGreaterThanOrEqual(2);
    accounts.forEach((a) => expect(a.householdId).toBe(HH2));
  });

  it('returns an empty array for an unknown householdId', async () => {
    const accounts = await accountService.getAll('nonexistent-household-xyz');
    expect(accounts).toEqual([]);
  });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe('accountService.update()', () => {
  it('updates only the specified fields', async () => {
    setHouseholdId(HH);
    const original = await accountService.create({
      name: 'Original Name',
      type: 'BANK',
      balance: 5000,
      currency: 'INR',
    });

    const updated = await accountService.update(original.id, { name: 'Updated Name', balance: 9999 });

    expect(updated.name).toBe('Updated Name');
    expect(updated.balance).toBe(9999);
    expect(updated.type).toBe('BANK');      // unchanged
    expect(updated.currency).toBe('INR');   // unchanged
    expect(updated.householdId).toBe(HH);  // unchanged
  });

  it('updates the updatedAt timestamp', async () => {
    setHouseholdId(HH);
    const original = await accountService.create({
      name: 'Timestamp Test',
      type: 'BANK',
      balance: 1,
      currency: 'INR',
    });

    // Wait a tick so timestamps differ
    await new Promise((r) => setTimeout(r, 5));

    const updated = await accountService.update(original.id, { balance: 2 });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(original.updatedAt).getTime(),
    );
  });
});

// ─── Delete / Archive ─────────────────────────────────────────────────────────

describe('accountService.delete()', () => {
  it('removes the account from the database', async () => {
    setHouseholdId(HH);
    const account = await accountService.create({
      name: 'ToDelete',
      type: 'BANK',
      balance: 0,
      currency: 'INR',
    });

    await accountService.delete(account.id);
    const found = await accountService.getById(account.id);
    expect(found).toBeUndefined();
  });

  it('does NOT throw when deleting a non-existent id (idempotent)', async () => {
    await expect(accountService.delete('nonexistent-id-999')).resolves.not.toThrow();
  });
});

describe('accountService.archive()', () => {
  it('sets isArchived = true without deleting', async () => {
    setHouseholdId(HH);
    const account = await accountService.create({
      name: 'ToArchive',
      type: 'SAVINGS',
      balance: 500,
      currency: 'INR',
    });

    const archived = await accountService.archive(account.id);
    expect(archived.isArchived).toBe(true);

    // Should still be retrievable by id
    const fetched = await accountService.getById(account.id);
    expect(fetched?.isArchived).toBe(true);
  });

  it('does not appear in getAllActive() after archiving', async () => {
    setHouseholdId('test-archive-hh');
    const account = await accountService.create({
      name: 'WillBeArchived',
      type: 'BANK',
      balance: 100,
      currency: 'INR',
    });

    await accountService.archive(account.id);
    const active = await accountService.getAllActive('test-archive-hh');
    const found = active.find((a) => a.id === account.id);
    expect(found).toBeUndefined();
  });
});
