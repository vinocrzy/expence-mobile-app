/**
 * ProfileScreen — user info, budget cycle preferences, sign out.
 *
 * Shows avatar + name + email, editable display name, budget mode toggle
 * (Calendar / Payday), salary day input. Sign-out button at bottom.
 * Mirrors web profile/page.tsx.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import {
  ScreenHeader,
  GlassCard,
  Avatar,
  TextInputField,
  SegmentedControl,
  Button,
  SectionHeader,
  type Segment,
} from '@/components/ui';

// ─── Budget mode segments ────────────────────────────────────────────────────

type BudgetMode = 'CALENDAR' | 'SALARY';
const BUDGET_SEGMENTS: Segment<BudgetMode>[] = [
  { value: 'CALENDAR', label: 'Calendar Month', color: '#22d3ee', bgColor: 'rgba(34,211,238,0.15)' },
  { value: 'SALARY', label: 'Payday Cycle', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { user, isGuest, logout } = useAuth();
  const { signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const [name, setName] = useState(user?.name || '');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('CALENDAR');
  const [salaryDay, setSalaryDay] = useState('1');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (!isGuest && clerkUser) {
        await clerkUser.update({ firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') });
      }
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [name, isGuest, clerkUser]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (isGuest) await logout();
          else await signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar hero */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={user?.imageUrl || null}
            name={user?.name}
            size="xl"
            showRing
            color={user?.color}
          />
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {isGuest && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestText}>Guest Mode</Text>
            </View>
          )}
        </View>

        {/* Personal Info */}
        <SectionHeader title="Personal Info" />
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <TextInputField
            label="Display Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: SPACING.md }}
          />
          <TextInputField
            label="Household ID"
            value={user?.householdId || '—'}
            editable={false}
          />
        </GlassCard>

        {/* Budgeting Preferences */}
        <SectionHeader title="Budgeting" />
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <Text style={styles.fieldLabel}>Budget Cycle</Text>
          <SegmentedControl
            segments={BUDGET_SEGMENTS}
            selected={budgetMode}
            onSelect={setBudgetMode}
            size="sm"
            style={{ marginBottom: budgetMode === 'SALARY' ? SPACING.md : 0 }}
          />
          {budgetMode === 'SALARY' && (
            <TextInputField
              label="Salary Day"
              placeholder="e.g. 25"
              value={salaryDay}
              onChangeText={setSalaryDay}
              keyboardType="number-pad"
              containerStyle={{ marginTop: SPACING.md }}
            />
          )}
        </GlassCard>

        {/* Save */}
        <Button
          title={saving ? 'Saving…' : 'Save Changes'}
          variant="primary"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Sign Out */}
        <Button
          title={isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          variant="danger"
          icon={<LogOut size={16} color="#fff" />}
          onPress={handleSignOut}
          style={{ marginBottom: SPACING['3xl'] }}
        />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  userName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  userEmail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  guestBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(251,191,36,0.15)',
  },
  guestText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.warning,
  },

  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
});
