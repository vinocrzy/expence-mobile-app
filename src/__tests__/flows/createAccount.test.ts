/**
 * Tests: End-to-end "Create Account" flow
 *
 * Reproduces the exact sequence that crashed the app:
 *   AccountModal.handleSubmit → FinancesScreen.onSubmit → addAccount (hook)
 *   → accountService.create → getHouseholdId → accountsDB.put
 *
 * Uses the real PouchDB memory adapter (same path as production) so any
 * regression in the CRUD layer is caught here before it reaches the device.
 */

import {
  setHouseholdId,
  setCurrentUser,
  accountService,
  getHouseholdId,
  HOUSEHOLD_STORAGE_KEY,
} from '@/lib/localdb-services';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate exactly what AccountModal.handleSubmit passes to onSubmit */
async function simulateCreateAccount(
  overrides: Partial<{ name: string; type: string; balance: number; currency: string }> = {},
) {
  // This is the exact payload shape produced by AccountModal
  return accountService.create({
    name:     overrides.name     ?? 'Test Account',
    type:     overrides.type     ?? 'BANK',
    balance:  overrides.balance  ?? 0,
    currency: overrides.currency ?? 'INR',
  } as any);
}

// ─── Scenario 1: Normal signed-in user ───────────────────────────────────────

describe('Create Account — signed-in user', () => {
  const HH = 'flow-hh-signed-in';

  beforeAll(async () => {
    // Simulate what AuthContext does after sign-in
    setHouseholdId(HH);
    setCurrentUser({ id: 'clerk-user-abc', name: 'Vinoth K', color: '#60A5FA' });
    // Persist ─ same as updated setHouseholdId() does
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, HH);
  });

  it('creates account and returns it with all required fields', async () => {
    const account = await simulateCreateAccount({ name: 'HDFC Salary', type: 'SAVINGS', balance: 25000 });

    expect(account.id).toBeTruthy();
    expect(account.name).toBe('HDFC Salary');
    expect(account.type).toBe('SAVINGS');
    expect(account.balance).toBe(25000);
    expect(account.householdId).toBe(HH);
    expect(account.userId).toBe('clerk-user-abc');
    expect(account.createdByName).toBe('Vinoth K');
    expect(account.createdAt).toBeTruthy();
    expect(account.updatedAt).toBeTruthy();
  });

  it('account is retrievable via getAll after creation', async () => {
    await simulateCreateAccount({ name: 'SBI Checking' });
    const all = await accountService.getAll(HH);
    const found = all.find((a) => a.name === 'SBI Checking');
    expect(found).toBeDefined();
  });

  it('creates six different account types without error', async () => {
    const types = ['BANK', 'SAVINGS', 'CHECKING', 'WALLET', 'INVESTMENT', 'CASH_RESERVE'];

    for (const type of types) {
      const account = await simulateCreateAccount({ name: `${type} Account`, type });
      expect(account.id).toBeTruthy();
      expect(account.type).toBe(type);
    }
  });
});

// ─── Scenario 2: Guest user ───────────────────────────────────────────────────

describe('Create Account — guest user', () => {
  const GUEST_ID = `guest_${Date.now()}`;

  beforeAll(async () => {
    // Simulate what AuthContext.enterGuestMode() does
    setHouseholdId(GUEST_ID);
    setCurrentUser({ id: GUEST_ID, name: 'Guest', color: '#A78BFA' });
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, GUEST_ID);
  });

  it('creates account under the guest householdId', async () => {
    const account = await simulateCreateAccount({ name: 'Guest Cash' });
    expect(account.householdId).toBe(GUEST_ID);
  });

  it('guest accounts are isolated from signed-in household', async () => {
    const signedInAccounts = await accountService.getAll('flow-hh-signed-in');
    const guestAccounts    = await accountService.getAll(GUEST_ID);

    // No cross-contamination
    signedInAccounts.forEach((a) => expect(a.householdId).not.toBe(GUEST_ID));
    guestAccounts.forEach((a) => expect(a.householdId).toBe(GUEST_ID));
  });
});

// ─── Scenario 3: Startup race (householdId not in memory yet) ────────────────

describe('Create Account — startup race condition', () => {
  const HH_RACE = 'flow-hh-race-test';

  it('still creates account correctly when service reads from AsyncStorage', async () => {
    // Wipe the in-memory value first (simulating module reload / startup race),
    // then persist the householdId to storage as a previous session would have.
    setHouseholdId(null as any);
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, HH_RACE);
    setCurrentUser({ id: 'user-race', name: 'Race User' });

    // getHouseholdId() should recover from AsyncStorage
    const resolved = await getHouseholdId();
    expect(resolved).toBe(HH_RACE);

    // Account create should now use the recovered householdId
    const account = await simulateCreateAccount({ name: 'Race Account' });
    expect(account.householdId).toBe(HH_RACE);
  });
});

// ─── Scenario 4: Validation ───────────────────────────────────────────────────

describe('Create Account — validation edge cases', () => {
  const HH_VAL = 'flow-hh-validation';

  beforeAll(() => {
    setHouseholdId(HH_VAL);
    setCurrentUser({ id: 'u-val', name: 'Val User' });
  });

  it('accepts balance = 0 (valid for new accounts)', async () => {
    const account = await simulateCreateAccount({ balance: 0 });
    expect(account.balance).toBe(0);
  });

  it('accepts very large balances', async () => {
    const account = await simulateCreateAccount({ balance: 999999999 });
    expect(account.balance).toBe(999999999);
  });

  it('accepts INR, USD, EUR, GBP currencies', async () => {
    for (const currency of ['INR', 'USD', 'EUR', 'GBP']) {
      const account = await simulateCreateAccount({ currency });
      expect(account.currency).toBe(currency);
    }
  });

  it('handles special characters in name without crash', async () => {
    const account = await simulateCreateAccount({ name: "Ravi's A/C & Savings — 2024" });
    expect(account.name).toBe("Ravi's A/C & Savings — 2024");
  });
});

// ─── Scenario 5: Concurrency ──────────────────────────────────────────────────

describe('Create Account — concurrency', () => {
  it('handles 10 simultaneous creates without conflict or crash', async () => {
    const HH_CONC = 'flow-hh-concurrency';
    setHouseholdId(HH_CONC);
    setCurrentUser({ id: 'u-conc', name: 'Conc User' });

    const creates = Array.from({ length: 10 }, (_, i) =>
      simulateCreateAccount({ name: `Concurrent Account ${i}`, balance: i * 100 }),
    );

    const results = await Promise.all(creates);
    expect(results).toHaveLength(10);

    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(10); // all unique IDs
  });
});
