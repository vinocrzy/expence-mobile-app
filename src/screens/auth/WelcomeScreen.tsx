/**
 * WelcomeScreen — onboarding entry point with two pathways.
 *
 * "Sign In" → Clerk auth flow
 * "Continue as Guest" → local-only mode, no sync
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet,
  LogIn,
  UserCircle,
  Shield,
  Smartphone,
  Cloud,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, ICON_SIZE } from '@/constants';

interface Props {
  onSignIn: () => void;
  onGuest: () => void;
}

const SECONDARY = COLORS.heroGradientEnd;

export function WelcomeScreen({ onSignIn, onGuest }: Props) {
  const insets = useSafeAreaInsets();

  const handleSignIn = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSignIn();
  };

  const handleGuest = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGuest();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ── Branding ── */}
      <View style={styles.branding}>
        <LinearGradient
          colors={[COLORS.primary, SECONDARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <Wallet size={44} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>PocketTogether</Text>
        <Text style={styles.subtitle}>Master your shared finances</Text>
      </View>

      {/* ── Features ── */}
      <View style={styles.features}>
        <FeatureRow
          icon={<Smartphone size={20} color={COLORS.primaryLight} />}
          text="Track expenses, income & budgets"
        />
        <FeatureRow
          icon={<Shield size={20} color={COLORS.income} />}
          text="Your data stays on your device"
        />
        <FeatureRow
          icon={<Cloud size={20} color={COLORS.debt} />}
          text="Sign in later to sync across devices"
        />
      </View>

      {/* ── CTAs ── */}
      <View style={styles.actions}>
        {/* Primary: Sign In */}
        <TouchableOpacity onPress={handleSignIn} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primary, SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <LogIn size={20} color="#fff" style={{ marginRight: SPACING.sm }} />
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary: Guest */}
        <TouchableOpacity
          onPress={handleGuest}
          style={styles.guestButton}
          activeOpacity={0.7}
        >
          <UserCircle size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.guestNote}>
          No account needed — all data stored locally.{'\n'}
          You can sign in anytime to enable cloud sync.
        </Text>
      </View>
    </View>
  );
}

// ─── Feature row helper ──────────────────────────────────────────────────────

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['2xl'],
  },
  branding: {
    alignItems: 'center',
    marginTop: SPACING['5xl'],
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Features
  features: {
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },

  // Actions
  actions: {
    gap: SPACING.md,
    paddingBottom: SPACING['2xl'],
  },
  primaryButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  guestButton: {
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  guestNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
});
