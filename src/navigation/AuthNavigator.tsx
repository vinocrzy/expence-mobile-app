/**
 * Auth Navigator — shown when the user is signed out.
 * Provides SignIn ↔ SignUp flow without a header.
 */

import React, { useState } from 'react';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';

export function AuthNavigator() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (mode === 'signup') {
    return <SignUpScreen onSwitchToSignIn={() => setMode('signin')} />;
  }
  return <SignInScreen onSwitchToSignUp={() => setMode('signup')} />;
}
