/**
 * useSharedView — fetches shared (published) household data.
 *
 * Returns shared transactions and account balances from the sharedDB
 * (populated by householdService.publishSnapshot).
 * Mirrors web's hooks/useSharedView.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { sharedDataService } from '@/lib/localdb-services';
import type { SharedTransaction, SharedAccountBalance } from '@/types/db-types';

interface SharedViewReturn {
  transactions: SharedTransaction[];
  accounts: SharedAccountBalance[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSharedView(): SharedViewReturn {
  const [transactions, setTransactions] = useState<SharedTransaction[]>([]);
  const [accounts, setAccounts] = useState<SharedAccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txns, bals] = await Promise.all([
        sharedDataService.getSharedTransactions(),
        sharedDataService.getSharedBalances(),
      ]);
      setTransactions(txns);
      setAccounts(bals);
    } catch (e) {
      console.error('[useSharedView] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, accounts, loading, refresh: load };
}
