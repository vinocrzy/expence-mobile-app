/**
 * Tests: generateId() crash-safety and UUID fallback
 *
 * The app crashed silently when uuid.v4() failed. These tests verify the
 * fallback path produces valid, unique IDs regardless of whether the
 * crypto polyfill is available.
 */

// Access the private helper via a re-export trick — we test it indirectly
// through accountService.create which calls generateId internally.
import { setHouseholdId, setCurrentUser, accountService } from '@/lib/localdb-services';

const HOUSEHOLD = 'test-ids-household';

beforeAll(() => {
  setHouseholdId(HOUSEHOLD);
  setCurrentUser({ id: 'u1', name: 'Tester' });
});

describe('generateId() — used inside accountService.create', () => {
  it('produces a non-empty string id on every account create call', async () => {
    const a = await accountService.create({ name: 'A', type: 'BANK', balance: 0, currency: 'INR' });
    expect(typeof a.id).toBe('string');
    expect(a.id.length).toBeGreaterThan(4);
  });

  it('produces unique ids for two consecutive creates', async () => {
    const a = await accountService.create({ name: 'Acct1', type: 'BANK', balance: 0, currency: 'INR' });
    const b = await accountService.create({ name: 'Acct2', type: 'BANK', balance: 0, currency: 'INR' });
    expect(a.id).not.toBe(b.id);
  });

  it('survives when crypto is unavailable (uuid fallback path)', async () => {
    // Temporarily break global.crypto to force the fallback branch
    const originalCrypto = (globalThis as any).crypto;
    (globalThis as any).crypto = undefined;

    let account: any;
    try {
      account = await accountService.create({ name: 'FallbackTest', type: 'CASH_RESERVE', balance: 1, currency: 'INR' });
    } finally {
      (globalThis as any).crypto = originalCrypto;
    }

    expect(account.id).toBeTruthy();
  });
});
