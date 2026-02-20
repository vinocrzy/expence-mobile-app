/**
 * Replication Engine — bidirectional PouchDB ↔ CouchDB sync.
 *
 * Ported from web's lib/replication.ts with these adaptations:
 *  - AsyncStorage instead of localStorage for config persistence
 *  - EXPO_PUBLIC_* env vars instead of NEXT_PUBLIC_*
 *  - NetInfo for connectivity checks instead of navigator.onLine
 *  - No SSR guards needed
 *
 * Uses RxJS BehaviorSubject for reactive sync state broadcasting.
 */

import { BehaviorSubject } from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  accountsDB,
  transactionsDB,
  categoriesDB,
  creditcardsDB,
  loansDB,
  budgetsDB,
  sharedDB,
} from './pouchdb';

// ─── Sync state ──────────────────────────────────────────────────────────────

export type SyncStatus = 'ACTIVE' | 'PAUSED' | 'ERROR' | 'DISABLED' | 'BLOCKED' | 'LOCAL_ONLY';

export interface SyncState {
  status: SyncStatus;
  connected: boolean;
  lastSync?: Date;
  error?: string;
  isAutoSyncEnabled: boolean;
}

export const syncState$ = new BehaviorSubject<SyncState>({
  status: 'LOCAL_ONLY',
  connected: false,
  isAutoSyncEnabled: false,
});

// ─── Internal state ──────────────────────────────────────────────────────────

let activeReplications: any[] = [];
let isAutoSyncEnabled = false;
let cachedGetToken: (() => Promise<string | null>) | null = null;
let cachedHouseholdId: string | null = null;

// ─── Config keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY_AUTO_SYNC = 'autoSyncEnabled';
const STORAGE_KEY_COUCHDB = 'couchdb_config';

// ─── Stop / Reset ────────────────────────────────────────────────────────────

export function stopReplication() {
  console.log('[Sync] Stopping', activeReplications.length, 'replications');
  activeReplications.forEach((h) => h.cancel());
  activeReplications = [];
  syncState$.next({ ...syncState$.getValue(), status: 'DISABLED', connected: false });
}

export function resetReplicationState() {
  stopReplication();
  cachedGetToken = null;
  cachedHouseholdId = null;
}

// ─── Config loader ───────────────────────────────────────────────────────────

async function getReplicationConfig(getToken: () => Promise<string | null>) {
  let couchURL = process.env.EXPO_PUBLIC_COUCHDB_URL || '';
  let username = '';
  let password = '';
  let forceEnable = false;

  // Parse credentials from URL
  if (couchURL) {
    try {
      const urlObj = new URL(couchURL);
      if (urlObj.username && urlObj.password) {
        username = urlObj.username;
        password = urlObj.password;
        urlObj.username = '';
        urlObj.password = '';
        couchURL = urlObj.toString().replace(/\/$/, '');
      }
    } catch (_) {
      /* ignore parse errors */
    }
  }

  // Check AsyncStorage for custom config
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_COUCHDB);
    if (stored) {
      const config = JSON.parse(stored);
      if (config.enabled && config.url) {
        couchURL = config.url;
        if (config.username) username = config.username;
        if (config.password) password = config.password;
      }
      if (config.forceEnable) forceEnable = true;
    }
  } catch (_) {
    /* ignore */
  }

  // Force HTTP for localhost:5984
  if (couchURL) {
    try {
      const url = new URL(couchURL);
      if (url.protocol === 'https:' && url.hostname === 'localhost' && url.port === '5984') {
        url.protocol = 'http:';
        couchURL = url.toString().replace(/\/$/, '');
      }
    } catch (_) {
      /* ignore */
    }
  }

  // Build auth options
  let ajaxOptions: Record<string, any> = {};
  let authOptions: Record<string, any> = {};

  if (username && password) {
    authOptions = { username, password };
  } else {
    try {
      const token = await getToken();
      if (token) {
        ajaxOptions = { headers: { Authorization: `Bearer ${token}` } };
      }
    } catch (_) {
      /* ignore */
    }
  }

  return { couchURL, authOptions, ajaxOptions, forceEnable };
}

// ─── Connection verification ─────────────────────────────────────────────────

async function verifyConnection(
  couchURL: string,
  authOptions: Record<string, any>,
  ajaxOptions: Record<string, any>,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = { ...(ajaxOptions.headers || {}) };
    if (authOptions.username && authOptions.password) {
      const b64 = btoa(`${authOptions.username}:${authOptions.password}`);
      headers['Authorization'] = `Basic ${b64}`;
    }
    const resp = await fetch(couchURL, { method: 'GET', headers });
    return resp.ok;
  } catch {
    return false;
  }
}

// ─── Ensure remote DB exists ─────────────────────────────────────────────────

async function ensureRemoteDB(url: string, headers: Record<string, string>) {
  try {
    const resp = await fetch(url, { method: 'PUT', headers });
    return resp.ok || resp.status === 412; // 201 or already exists
  } catch {
    return false;
  }
}

// ─── Single DB sync ──────────────────────────────────────────────────────────

async function startSingleSync(
  db: PouchDB.Database,
  remoteDBName: string,
  couchURL: string,
  authOptions: Record<string, any>,
  ajaxOptions: Record<string, any>,
  live = true,
) {
  const remoteURL = `${couchURL}/${remoteDBName}`;

  // Build headers for DB creation
  let createHeaders: Record<string, string> = {};
  if (authOptions.username && authOptions.password) {
    createHeaders['Authorization'] = `Basic ${btoa(`${authOptions.username}:${authOptions.password}`)}`;
  }
  if (ajaxOptions.headers) {
    createHeaders = { ...createHeaders, ...ajaxOptions.headers };
  }

  await ensureRemoteDB(remoteURL, createHeaders);

  const syncOptions: any = {
    live,
    retry: live,
    batch_size: 60,
  };
  if (Object.keys(authOptions).length > 0) syncOptions.auth = authOptions;
  if (Object.keys(ajaxOptions).length > 0) syncOptions.ajax = ajaxOptions;

  const handler = (db as any).sync(remoteURL, syncOptions);

  handler
    .on('change', () => {
      syncState$.next({
        ...syncState$.getValue(),
        status: 'ACTIVE',
        connected: true,
        lastSync: new Date(),
      });
    })
    .on('paused', () => {
      syncState$.next({ ...syncState$.getValue(), status: 'PAUSED', connected: true });
    })
    .on('error', (err: any) => {
      console.error(`[Sync] Error on ${remoteDBName}:`, err?.message || err);
    });

  activeReplications.push(handler);
}

// ─── Initialize replication ──────────────────────────────────────────────────

export async function initializeReplication(
  getToken: () => Promise<string | null>,
  personalHouseholdId: string,
  viewingHouseholdId?: string,
) {
  cachedGetToken = getToken;
  cachedHouseholdId = personalHouseholdId;

  // Stop any existing
  stopReplication();

  // Read auto-sync preference
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_AUTO_SYNC);
    if (stored !== null) {
      isAutoSyncEnabled = stored === 'true';
      const current = syncState$.getValue();
      if (current.isAutoSyncEnabled !== isAutoSyncEnabled) {
        syncState$.next({ ...current, isAutoSyncEnabled });
      }
    }
  } catch (_) {
    /* ignore */
  }

  const { couchURL, authOptions, ajaxOptions, forceEnable } = await getReplicationConfig(getToken);

  // Check env kill switch
  const isDisabled = process.env.EXPO_PUBLIC_REPLICATION_DISABLED === 'true';
  if (isDisabled && !forceEnable) {
    console.warn('[Sync] Disabled via environment variable');
    syncState$.next({ ...syncState$.getValue(), status: 'BLOCKED', connected: false });
    return [];
  }

  if (!couchURL) {
    console.log('[Sync] No CouchDB URL configured — running local-only');
    syncState$.next({ ...syncState$.getValue(), status: 'LOCAL_ONLY', connected: false });
    return [];
  }

  if (!isAutoSyncEnabled) {
    console.log('[Sync] Auto-sync disabled by user');
    syncState$.next({ ...syncState$.getValue(), status: 'DISABLED', connected: false });
    return [];
  }

  // Check network connectivity
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    console.warn('[Sync] Device is offline');
    syncState$.next({ ...syncState$.getValue(), status: 'ERROR', error: 'No network', connected: false });
    return [];
  }

  // Verify CouchDB reachable
  const ok = await verifyConnection(couchURL, authOptions, ajaxOptions);
  if (!ok) {
    console.error('[Sync] CouchDB connection verification failed');
    syncState$.next({ ...syncState$.getValue(), status: 'ERROR', error: 'Connection failed', connected: false });
    return [];
  }

  // Sync personal DBs
  const personalDBs = [
    { name: 'accounts', db: accountsDB },
    { name: 'transactions', db: transactionsDB },
    { name: 'categories', db: categoriesDB },
    { name: 'creditcards', db: creditcardsDB },
    { name: 'loans', db: loansDB },
    { name: 'budgets', db: budgetsDB },
  ];

  for (const { name, db } of personalDBs) {
    const safeId = personalHouseholdId.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const remoteDBName = `hh_${safeId}_${name}`;
    await startSingleSync(db, remoteDBName, couchURL, authOptions, ajaxOptions);
  }

  // Sync shared DB
  const sharedTargetId = viewingHouseholdId || personalHouseholdId;
  const safeSharedId = sharedTargetId.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  await startSingleSync(sharedDB, `hh_${safeSharedId}_shared`, couchURL, authOptions, ajaxOptions);

  syncState$.next({ ...syncState$.getValue(), connected: true, status: 'ACTIVE' });
  console.log('[Sync] Replication started for', personalDBs.length + 1, 'databases');

  return activeReplications;
}

// ─── Manual one-off sync ─────────────────────────────────────────────────────

export async function triggerManualSync() {
  if (!cachedGetToken || !cachedHouseholdId) {
    console.error('[Sync] No cached credentials for manual sync');
    return;
  }

  // If auto-sync is running, just re-init
  if (isAutoSyncEnabled) {
    await initializeReplication(cachedGetToken, cachedHouseholdId);
    return;
  }

  const { couchURL, authOptions, ajaxOptions, forceEnable } = await getReplicationConfig(cachedGetToken);
  const isDisabled = process.env.EXPO_PUBLIC_REPLICATION_DISABLED === 'true';
  if ((isDisabled && !forceEnable) || !couchURL) return;

  syncState$.next({ ...syncState$.getValue(), status: 'ACTIVE', connected: false });

  const ok = await verifyConnection(couchURL, authOptions, ajaxOptions);
  if (!ok) {
    syncState$.next({ ...syncState$.getValue(), status: 'ERROR', error: 'Connection failed', connected: false });
    return;
  }

  const dbs = [
    { name: 'accounts', db: accountsDB },
    { name: 'transactions', db: transactionsDB },
    { name: 'categories', db: categoriesDB },
    { name: 'creditcards', db: creditcardsDB },
    { name: 'loans', db: loansDB },
    { name: 'budgets', db: budgetsDB },
  ];

  let completed = 0;

  for (const { name, db } of dbs) {
    const safeId = cachedHouseholdId!.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const remoteDBName = `hh_${safeId}_${name}`;
    const remoteURL = `${couchURL}/${remoteDBName}`;

    let createHeaders: Record<string, string> = {};
    if (authOptions.username && authOptions.password) {
      createHeaders['Authorization'] = `Basic ${btoa(`${authOptions.username}:${authOptions.password}`)}`;
    }
    if (ajaxOptions.headers) {
      createHeaders = { ...createHeaders, ...ajaxOptions.headers };
    }
    await ensureRemoteDB(remoteURL, createHeaders);

    const syncOptions: any = { live: false, retry: false, batch_size: 60 };
    if (Object.keys(authOptions).length > 0) syncOptions.auth = authOptions;
    if (Object.keys(ajaxOptions).length > 0) syncOptions.ajax = ajaxOptions;

    (db as any)
      .sync(remoteURL, syncOptions)
      .on('complete', () => {
        completed++;
        if (completed === dbs.length) {
          syncState$.next({
            ...syncState$.getValue(),
            status: isAutoSyncEnabled ? 'PAUSED' : 'DISABLED',
            connected: true,
            lastSync: new Date(),
          });
        }
      })
      .on('error', (err: any) => {
        console.error(`[Sync] Manual sync error ${name}:`, err?.message || err);
      });
  }
}

// ─── Auto-sync toggle ────────────────────────────────────────────────────────

export async function setAutoSync(enable: boolean) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_SYNC, enable.toString());
  } catch (_) {
    /* ignore */
  }
  isAutoSyncEnabled = enable;

  if (enable) {
    if (cachedGetToken && cachedHouseholdId) {
      syncState$.next({ ...syncState$.getValue(), status: 'ACTIVE', connected: false, isAutoSyncEnabled: true });
      const handlers = await initializeReplication(cachedGetToken, cachedHouseholdId);
      if (handlers.length === 0) {
        // Failed to start — revert
        syncState$.next({ ...syncState$.getValue(), isAutoSyncEnabled: false, status: 'DISABLED' });
        isAutoSyncEnabled = false;
      }
    }
  } else {
    stopReplication();
    syncState$.next({ ...syncState$.getValue(), isAutoSyncEnabled: false, status: 'DISABLED' });
  }
}
