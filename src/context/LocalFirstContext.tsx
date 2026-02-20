/**
 * LocalFirstProvider — initialises PouchDB and starts replication
 * once the user is authenticated.
 *
 * Port of web's LocalFirstContext (simplified for React Native).
 * Wraps children with sync initialization lifecycle.
 */

import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { initDB } from '@/lib/pouchdb';
import {
  initializeReplication,
  stopReplication,
  resetReplicationState,
} from '@/lib/replication';
import { useAuth } from '@/context/AuthContext';

interface LocalFirstContextType {
  /** true once PouchDB indexes are created */
  dbReady: boolean;
}

const LocalFirstContext = createContext<LocalFirstContextType>({ dbReady: false });

export function useLocalFirst() {
  return useContext(LocalFirstContext);
}

export function LocalFirstProvider({ children }: { children: ReactNode }) {
  const { user, isGuest, getToken } = useAuth();
  const dbReady = useRef(false);
  const [ready, setReady] = React.useState(false);

  // 1. Init PouchDB indexes on mount
  useEffect(() => {
    if (!dbReady.current) {
      initDB()
        .then(() => {
          dbReady.current = true;
          setReady(true);
          console.log('[LocalFirst] DB indexes ready');
        })
        .catch((err) => {
          console.error('[LocalFirst] DB init failed:', err);
          // Still mark ready so app isn't stuck
          setReady(true);
        });
    }
  }, []);

  // 2. Start replication when user is available (not for guests)
  useEffect(() => {
    if (!user || isGuest) {
      resetReplicationState();
      return;
    }

    const householdId = user.householdId || user.id;

    initializeReplication(getToken, householdId).catch((err) => {
      console.error('[LocalFirst] Replication init failed:', err);
    });

    return () => {
      stopReplication();
    };
  }, [user, isGuest, getToken]);

  return (
    <LocalFirstContext.Provider value={{ dbReady: ready }}>
      {children}
    </LocalFirstContext.Provider>
  );
}
