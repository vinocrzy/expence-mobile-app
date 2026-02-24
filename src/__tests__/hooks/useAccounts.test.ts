/**
 * Tests: useAccounts hook
 *
 * The hook is responsible for:
 * 1. Loading accounts from the service on mount
 * 2. Emitting ACCOUNTS_CHANGED events so other hooks rerender
 * 3. Propagating create/update/delete errors through the Error boundary chain
 *
 * We mock the service layer here so these are pure unit tests of hook logic.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAccounts } from '@/hooks/useLocalData';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAccounts = [
  { id: 'acc-1', name: 'HDFC Savings', type: 'BANK', balance: 5000, currency: 'INR', householdId: 'hh-1', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'acc-2', name: 'Paytm Wallet', type: 'WALLET', balance: 200, currency: 'INR', householdId: 'hh-1', isArchived: false, createdAt: '', updatedAt: '' },
];

jest.mock('@/lib/localdb-services', () => ({
  accountService: {
    getAll: jest.fn().mockResolvedValue(mockAccounts),
    create: jest.fn().mockImplementation(async (data: any) => ({
      ...data,
      id: `acc-new-${Date.now()}`,
      householdId: 'hh-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    update: jest.fn().mockImplementation(async (_id: string, data: any) => ({
      ...mockAccounts[0],
      ...data,
      updatedAt: new Date().toISOString(),
    })),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  transactionService:   { getAll: jest.fn().mockResolvedValue([]) },
  categoryService:      { getAll: jest.fn().mockResolvedValue([]) },
  creditCardService:    { getAll: jest.fn().mockResolvedValue([]) },
  loanService:          { getAll: jest.fn().mockResolvedValue([]) },
  budgetService:        { getAll: jest.fn().mockResolvedValue([]) },
  recurringService:     { getAllActive: jest.fn().mockResolvedValue([]) },
  sharedDataService:    {},
  getHouseholdId:       jest.fn().mockResolvedValue('hh-1'),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useAccounts', () => {
  // Re-establish mock implementations before each test.
  // jest's clearMocks:true clears mock state; explicitly restoring
  // mockResolvedValue guards against jest 30 clearing implementations.
  beforeEach(() => {
    const { accountService } = require('@/lib/localdb-services');
    (accountService.getAll as jest.Mock).mockResolvedValue(mockAccounts);
  });

  it('starts with loading=true and an empty accounts array', () => {
    const { result } = renderHook(() => useAccounts());
    expect(result.current.loading).toBe(true);
    expect(result.current.accounts).toEqual([]);
  });

  it('populates accounts after the initial load', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.accounts).toHaveLength(2);
    });

    expect(result.current.accounts[0].name).toBe('HDFC Savings');
  });

  it('addAccount returns the new account and exposes no uncaught error', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: any;
    await act(async () => {
      created = await result.current.addAccount({
        name: 'New Account',
        type: 'SAVINGS',
        balance: 1000,
        currency: 'INR',
      });
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('New Account');
  });

  it('addAccount re-throws on service failure so modals can show an error banner', async () => {
    const { accountService } = require('@/lib/localdb-services');
    (accountService.create as jest.Mock).mockRejectedValueOnce(new Error('DB put failed'));

    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.addAccount({ name: 'Fail', type: 'BANK', balance: 0, currency: 'INR' });
      }),
    ).rejects.toThrow('DB put failed');
  });

  it('updateAccount calls service.update with the correct id + patch', async () => {
    const { accountService } = require('@/lib/localdb-services');
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateAccount('acc-1', { balance: 9999 });
    });

    expect(accountService.update).toHaveBeenCalledWith('acc-1', { balance: 9999 });
  });

  it('deleteAccount calls service.delete with the correct id', async () => {
    const { accountService } = require('@/lib/localdb-services');
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteAccount('acc-1');
    });

    expect(accountService.delete).toHaveBeenCalledWith('acc-1');
  });
});
