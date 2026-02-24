/**
 * Tests: getHouseholdId() startup-race resolution
 *
 * The warning "getHouseholdId called but no householdId set" was caused
 * by hooks firing before AuthContext finished its async startup.
 * The fix: setHouseholdId() persists to AsyncStorage; getHouseholdId()
 * reads it back as a fallback.
 */

import {
  setHouseholdId,
  getHouseholdId,
  HOUSEHOLD_STORAGE_KEY,
} from '@/lib/localdb-services';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('getHouseholdId()', () => {
  beforeEach(() => {
    // Reset in-memory variable by setting null then clearing storage
    setHouseholdId(null as any);
    (AsyncStorage.clear as jest.Mock)();
  });

  it('returns the in-memory value immediately when already set', async () => {
    setHouseholdId('hh-inmemory-123');
    const id = await getHouseholdId();
    expect(id).toBe('hh-inmemory-123');
  });

  it('recovers from AsyncStorage when the in-memory value is null (startup race)', async () => {
    // Simulate: AuthContext called setHouseholdId previously (persisted to storage)
    // but the in-memory value has been cleared (module reload / test isolation)
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, 'hh-stored-456');
    // Do NOT call setHouseholdId — simulate the race condition
    setHouseholdId(null as any);

    const id = await getHouseholdId();
    expect(id).toBe('hh-stored-456');
  });

  it('warms the in-memory cache after recovering from AsyncStorage', async () => {
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, 'hh-warmup-789');
    setHouseholdId(null as any);

    await getHouseholdId(); // first call — reads storage
    // Second call should use in-memory (we can verify by checking that
    // AsyncStorage.getItem is NOT called again)
    const spy = AsyncStorage.getItem as jest.Mock;
    spy.mockClear();
    await getHouseholdId();
    expect(spy).not.toHaveBeenCalled();
  });

  it('falls back to household_1 when nothing is set anywhere', async () => {
    setHouseholdId(null as any);
    const id = await getHouseholdId();
    expect(id).toBe('household_1');
  });

  it('persists the value to AsyncStorage when setHouseholdId is called', async () => {
    setHouseholdId('hh-persist-abc');
    // Give the async setItem a tick to complete
    await new Promise((r) => setTimeout(r, 10));
    const stored = await AsyncStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    expect(stored).toBe('hh-persist-abc');
  });

  it('removes the value from AsyncStorage when setHouseholdId(null) is called', async () => {
    setHouseholdId('hh-will-be-removed');
    await new Promise((r) => setTimeout(r, 10));
    setHouseholdId(null as any);
    await new Promise((r) => setTimeout(r, 10));
    const stored = await AsyncStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    expect(stored).toBeNull();
  });
});
