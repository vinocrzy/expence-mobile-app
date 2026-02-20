/**
 * useSyncStatus — reactive hook that subscribes to PouchDB sync state.
 *
 * Provides isOnline via @react-native-community/netinfo and the sync
 * engine's BehaviorSubject for real-time status updates.
 */

import { useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  syncState$,
  triggerManualSync,
  setAutoSync as _setAutoSync,
  type SyncState,
} from '../lib/replication';

export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>(syncState$.getValue());
  const [isOnline, setIsOnline] = useState(true);

  // Subscribe to sync state changes
  useEffect(() => {
    const sub = syncState$.subscribe((state) => {
      setSyncState(state);
    });
    return () => sub.unsubscribe();
  }, []);

  // Subscribe to network state
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsub();
  }, []);

  const manualSync = useCallback(() => {
    triggerManualSync();
  }, []);

  const setAutoSync = useCallback((enabled: boolean) => {
    _setAutoSync(enabled);
  }, []);

  return {
    status: syncState.status,
    isOnline,
    isSyncing: syncState.status === 'ACTIVE',
    isConnected: syncState.connected,
    isAutoSyncEnabled: syncState.isAutoSyncEnabled,
    lastSync: syncState.lastSync,
    error: syncState.error,
    manualSync,
    setAutoSync,
  };
}
