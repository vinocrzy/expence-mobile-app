/**
 * jest.setup.ts
 * Runs before every test file. Provides global mocks for React Native
 * modules that aren't available in the Node.js/Jest environment.
 *
 * NOTE: This file runs via `setupFiles` which means Jest globals like
 * beforeEach/afterEach are NOT yet available. Only `jest.mock()` (provided by
 * the jest object injected by the transform) and `require()` can be used here.
 * Per-test cleanup is configured via `clearMocks: true` in jest.config.js.
 */

// ─── Fix: Expo SDK 54 "winter" runtime lazy-require guard ────────────────────
// jest-expo's setup.js (which runs before this file in the setupFiles list)
// loads expo/src/winter which installs lazy getters for globals like
// structuredClone, TextDecoder, URL etc. These lazy getters capture the
// setupFiles-context require(). If a lazy getter fires DURING a test Jest
// throws: "You are trying to import a file outside of the scope of the test code."
//
// Fix: access every lazy-getter global here (while we are still inside the
// setupFiles execution context). Each access triggers expo's installGlobal
// factory, which resolves + caches the value as a plain data property.
// After this file runs, all those globals are concrete values and the stale
// require can never fire inside a test.
/* eslint-disable @typescript-eslint/no-unused-expressions */
void (globalThis as any).TextDecoder;
void (globalThis as any).TextDecoderStream;
void (globalThis as any).TextEncoderStream;
void (globalThis as any).URL;
void (globalThis as any).URLSearchParams;
void (globalThis as any).structuredClone;
void (globalThis as any).__ExpoImportMetaRegistry;
/* eslint-enable @typescript-eslint/no-unused-expressions */

// ─── AsyncStorage in-memory mock ─────────────────────────────────────────────
const asyncStorageStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem:    jest.fn(async (key: string, value: string) => { asyncStorageStore[key] = value; }),
  getItem:    jest.fn(async (key: string) => asyncStorageStore[key] ?? null),
  removeItem: jest.fn(async (key: string) => { delete asyncStorageStore[key]; }),
  multiRemove:jest.fn(async (keys: string[]) => { keys.forEach((k) => delete asyncStorageStore[k]); }),
  clear:      jest.fn(async () => { Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]); }),
  getAllKeys:  jest.fn(async () => Object.keys(asyncStorageStore)),
}));

// ─── react-native-get-random-values — no-op polyfill ──────────────────────────
jest.mock('react-native-get-random-values', () => ({}));

// ─── expo-haptics ─────────────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync:       jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync:    jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Export so tests can directly manipulate the store when needed
(global as any).__asyncStorageStore = asyncStorageStore;
