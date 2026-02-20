/**
 * Auth Navigator — shown when the user is not signed in and not a guest.
 *
 * Flow: Welcome → SignIn / SignUp
 * Guest entry: Welcome "Continue as Guest" → enterGuestMode() in AuthContext
 */

import React, { useState } from 'react';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { useAuth } from '@/context/AuthContext';

export function AuthNavigator() {
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const { enterGuestMode } = useAuth();

  if (mode === 'welcome') {
    return (
      <WelcomeScreen
        onSignIn={() => setMode('signin')}
        onGuest={enterGuestMode}
      />
    );
  }

  if (mode === 'signup') {
    return <SignUpScreen onSwitchToSignIn={() => setMode('signin')} />;
  }

  return <SignInScreen onSwitchToSignUp={() => setMode('signup')} />;
}
