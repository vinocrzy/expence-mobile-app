/**
 * Root Navigator
 * Three-way branch:
 *   1. Loading → splash spinner
 *   2. Guest OR Clerk signed-in → main app stack
 *   3. Neither → AuthNavigator (Welcome → SignIn/SignUp)
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth as useClerkAuthHook } from '@clerk/clerk-expo';
import { useAuth } from '@/context/AuthContext';

import { COLORS } from '@/constants';
import type { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';

// ─── Detail screens (no tab bar — navigated deep from Finances / Dashboard) ──
import { AccountDetailScreen } from '@/screens/accounts/AccountDetailScreen';
import { CreditCardDetailScreen } from '@/screens/credit-cards/CreditCardDetailScreen';
import { LoanDetailScreen } from '@/screens/loans/LoanDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export function RootNavigator() {
  const { isSignedIn, isLoaded } = useClerkAuthHook();
  const { isGuest } = useAuth();

  // Still loading Clerk and not in guest mode → show spinner
  if (!isLoaded && !isGuest) {
    return <LoadingScreen />;
  }

  // Not authenticated and not a guest → auth flow
  if (!isSignedIn && !isGuest) {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Main Tabs (tab bar lives here) */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Detail screens — navigated from Dashboard / Finances tabs (tab bar hidden) */}
      <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
      <Stack.Screen name="CreditCardDetail" component={CreditCardDetailScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
