/**
 * useGuestMigration — detects when a guest user signs in and offers
 * to merge their local data into the new authenticated account.
 *
 * Usage: call in App.tsx or RootNavigator after auth state settles.
 *
 * Flow:
 *   1. On mount, check if there's a previous guest ID in AsyncStorage.
 *   2. If the current user is authenticated (non-guest) and a guest ID exists,
 *      prompt: "Merge local data?" or "Start fresh?"
 *   3. Merge → re-tag PouchDB docs with the real householdId.
 *      Fresh → wipe local DBs.
 *   4. Clean up the guest ID marker.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, type User } from '@/context/AuthContext';
import {
  setHouseholdId,
  setCurrentUser,
  getHouseholdId,
} from '@/lib/localdb-services';

const GUEST_MODE_KEY = 'pocket_guest_mode';
const GUEST_ID_KEY = 'pocket_guest_id';
const PREV_GUEST_ID_KEY = 'pocket_prev_guest_id';

export type MigrationStatus = 'idle' | 'pending' | 'merging' | 'done';

/**
 * When exitGuestMode is called, the guest keys are removed.
 * To support migration, we save the previous guest ID under a separate key
 * BEFORE clearing. This hook checks for that key after successful sign-in.
 *
 * NOTE: For the full migration to work, the caller must wire up
 * `savePreviousGuestId()` before calling `exitGuestMode()`.
 */
export function useGuestMigration() {
  const { user, isGuest } = useAuth();
  const prompted = useRef(false);
  const [status, setStatus] = useState<MigrationStatus>('idle');

  /**
   * Call this BEFORE exitGuestMode() to preserve the guest ID for migration.
   */
  const savePreviousGuestId = useCallback(async () => {
    try {
      const guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
      if (guestId) {
        await AsyncStorage.setItem(PREV_GUEST_ID_KEY, guestId);
      }
    } catch (e) {
      console.error('[GuestMigration] save previous guest ID failed', e);
    }
  }, []);

  /**
   * Merge local guest data into the authenticated account.
   * In a PouchDB-based app this would re-tag all documents.
   * For now we just update the household/user IDs.
   */
  const mergeGuestData = useCallback(
    async (authenticatedUser: User) => {
      setStatus('merging');
      try {
        const prevGuestId = await AsyncStorage.getItem(PREV_GUEST_ID_KEY);
        if (!prevGuestId) {
          setStatus('done');
          return;
        }

        // Re-hydrate services with the real user
        const householdId = authenticatedUser.householdId || authenticatedUser.id;
        setHouseholdId(householdId);
        setCurrentUser({
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          color: authenticatedUser.color,
        });

        // TODO: Phase 10+ — iterate PouchDB docs where householdId === prevGuestId
        //       and update them to the real householdId. This is a bulk operation
        //       that will be implemented when sync/replication is wired up.

        await AsyncStorage.removeItem(PREV_GUEST_ID_KEY);
        setStatus('done');
      } catch (e) {
        console.error('[GuestMigration] merge failed', e);
        setStatus('done');
      }
    },
    [],
  );

  /**
   * Discard guest data and start fresh with the authenticated account.
   */
  const discardGuestData = useCallback(
    async (authenticatedUser: User) => {
      setStatus('merging');
      try {
        // TODO: Phase 10+ — destroy local PouchDB databases that were
        //       created under the guest householdId.

        const householdId = authenticatedUser.householdId || authenticatedUser.id;
        setHouseholdId(householdId);
        setCurrentUser({
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          color: authenticatedUser.color,
        });

        await AsyncStorage.removeItem(PREV_GUEST_ID_KEY);
        setStatus('done');
      } catch (e) {
        console.error('[GuestMigration] discard failed', e);
        setStatus('done');
      }
    },
    [],
  );

  // Prompt when an authenticated user is detected and there's a previous guest session
  useEffect(() => {
    if (isGuest || !user || prompted.current) return;

    (async () => {
      const prevGuestId = await AsyncStorage.getItem(PREV_GUEST_ID_KEY);
      if (!prevGuestId) return;

      prompted.current = true;
      setStatus('pending');

      Alert.alert(
        'Welcome Back!',
        'You have data from a previous guest session. Would you like to keep it or start fresh?',
        [
          {
            text: 'Keep Data',
            onPress: () => mergeGuestData(user),
          },
          {
            text: 'Start Fresh',
            style: 'destructive',
            onPress: () => discardGuestData(user),
          },
        ],
        { cancelable: false },
      );
    })();
  }, [user, isGuest, mergeGuestData, discardGuestData]);

  return { status, savePreviousGuestId };
}
