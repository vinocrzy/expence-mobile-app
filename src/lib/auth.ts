/**
 * Auth Configuration & Token Cache
 * Sets up Clerk token caching with expo-secure-store for persistent sessions.
 */

import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo';

/**
 * Clerk token cache backed by SecureStore.
 * Keeps the user signed in across app restarts.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('[TokenCache] getToken error:', err);
      return null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('[TokenCache] saveToken error:', err);
    }
  },

  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error('[TokenCache] clearToken error:', err);
    }
  },
};
