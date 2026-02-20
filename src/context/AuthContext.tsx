/**
 * Auth Context — mirrors the web AuthContext but uses @clerk/clerk-expo.
 *
 * Provides: user, loading, logout, refreshUser, getToken
 * The ClerkProvider itself is in App.tsx; this context adds the mapped User shape
 * and bridges Clerk state into the rest of the app (services, household, etc.).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setHouseholdId, setCurrentUser } from '@/lib/localdb-services';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  username?: string | null;
  imageUrl?: string;
  householdId?: string;
  color?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: (options?: any) => Promise<string | null>;
}

const CACHE_KEY = 'pocket_user_cache';
const USER_COLOR_KEY = 'pocket_user_color';

// ─── Random member color (matches web behaviour) ────────────────────────────

const MEMBER_COLORS = [
  '#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FBBF24', '#F87171', '#818CF8',
];

const pickColor = (): string =>
  MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Restore from cache on mount (instant splash → content)
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: User = JSON.parse(cached);
          setUser(parsed);
          // Hydrate services immediately
          setHouseholdId(parsed.householdId || parsed.id);
          setCurrentUser({ id: parsed.id, name: parsed.name, color: parsed.color });
          setLoading(false);
        }
      } catch (e) {
        console.error('[Auth] cache restore failed', e);
      }
    })();
  }, []);

  // 2. Sync with Clerk once loaded
  useEffect(() => {
    if (!isLoaded) return;

    (async () => {
      if (clerkUser) {
        // Persist a random colour per-user so it's consistent
        let color = await AsyncStorage.getItem(USER_COLOR_KEY);
        if (!color) {
          color = pickColor();
          await AsyncStorage.setItem(USER_COLOR_KEY, color);
        }

        const mapped: User = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.username || '',
          username: clerkUser.username || null,
          firstName: clerkUser.firstName,
          imageUrl: clerkUser.imageUrl,
          householdId:
            (clerkUser.publicMetadata as any)?.householdId || clerkUser.id,
          color,
        };

        setUser(mapped);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mapped));

        // Hydrate services
        setHouseholdId(mapped.householdId || mapped.id);
        setCurrentUser({ id: mapped.id, name: mapped.name, color: mapped.color });
      } else {
        setUser(null);
        await AsyncStorage.multiRemove([CACHE_KEY, USER_COLOR_KEY]);
        setHouseholdId(null);
        setCurrentUser(null);
      }
      setLoading(false);
    })();
  }, [isLoaded, clerkUser]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      await signOut();
      await AsyncStorage.multiRemove([CACHE_KEY, USER_COLOR_KEY]);
      setUser(null);
      setHouseholdId(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('[Auth] logout failed', error);
    }
  };

  const refreshUser = async () => {
    await clerkUser?.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading && !user, // cached user = not loading
        logout,
        refreshUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
