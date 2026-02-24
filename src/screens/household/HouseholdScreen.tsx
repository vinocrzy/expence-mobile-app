/**
 * HouseholdScreen — household management, members, join/publish.
 *
 * Shows current household status (name, role, ID), member list,
 * publish snapshot action, join by code input.
 * Guest users see simplified view with "Open Dashboard" link.
 * Mirrors web household/page.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Copy, LayoutDashboard, Upload, UserPlus, Crown, Users as UsersIcon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import type { Household } from '@/types/db-types';
import { useAuth } from '@/context/AuthContext';
import { householdService, sharedDataService, getHouseholdId } from '@/lib/localdb-services';
import {
  ScreenHeader,
  GlassCard,
  Button,
  TextInputField,
  SectionHeader,
  Avatar,
  Badge,
  AnimatedPressable,
  EmptyState,
} from '@/components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isGuest } = useAuth();

  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isOwner = household?.ownerId === user?.id;

  // ── Load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const h = await householdService.getCurrent();
      setHousehold(h);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!user) return;
    try {
      const h = await householdService.create(`${user.name}'s Household`, {
        id: user.id,
        name: user.name,
        email: user.email,
      });
      setHousehold(h);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // ── Copy ID ─────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!household) return;
    await Clipboard.setStringAsync(household.id);
    Alert.alert('Copied', 'Household ID copied to clipboard');
  };

  // ── Publish ─────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const hid = await getHouseholdId();
      await sharedDataService.publishSnapshot(hid);
      Alert.alert('Published', 'Shared snapshot updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setPublishing(false);
    }
  };

  // ── Join ────────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await householdService.mockJoin(joinCode.trim());
      Alert.alert('Joined', 'You have joined the household.');
      setJoinCode('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Household" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* No household yet */}
        {!loading && !household && (
          <View style={{ marginTop: SPACING['3xl'] }}>
            <EmptyState
              icon={<UsersIcon size={32} color={COLORS.textTertiary} />}
              title="No Household"
              description="Create a household to share budgets and track expenses with family."
            />
            <Button
              title="Create Household"
              variant="primary"
              icon={<UsersIcon size={16} color="#fff" />}
              onPress={handleCreate}
              style={{ marginTop: SPACING.lg, marginHorizontal: SPACING.lg }}
            />
          </View>
        )}

        {/* Household exists */}
        {household && (
          <>
            {/* Status card */}
            <GlassCard padding="lg" style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.householdName}>
                    {household.name || 'My Household'}
                  </Text>
                  <Text style={styles.householdRole}>
                    {isOwner ? 'Owner' : 'Member'}
                  </Text>
                </View>
                <Badge
                  label={isOwner ? 'OWNER' : 'GUEST'}
                  color={isOwner ? 'success' : 'info'}
                />
              </View>

              {/* ID row */}
              <AnimatedPressable style={styles.idRow} onPress={handleCopy}>
                <Text style={styles.idLabel}>Household ID</Text>
                <View style={styles.idValue}>
                  <Text style={styles.idText} numberOfLines={1}>
                    {household.id}
                  </Text>
                  <Copy size={14} color={COLORS.textTertiary} />
                </View>
              </AnimatedPressable>
            </GlassCard>

            {/* Members */}
            <SectionHeader title="Members" />
            <GlassCard padding={0} style={styles.membersCard}>
              {(household.members || []).map((m, i) => (
                <View
                  key={m.userId}
                  style={[
                    styles.memberRow,
                    i < (household.members?.length || 0) - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: COLORS.border,
                    },
                  ]}
                >
                  <Avatar name={m.name} size="sm" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberEmail}>{m.email}</Text>
                  </View>
                  {m.role === 'OWNER' && (
                    <Crown size={14} color={COLORS.warning} />
                  )}
                </View>
              ))}
            </GlassCard>

            {/* Actions */}
            <SectionHeader title="Actions" />

            {/* Open shared dashboard */}
            <Button
              title="Open Shared Dashboard"
              variant="secondary"
              icon={<LayoutDashboard size={16} color={COLORS.textPrimary} />}
              onPress={() => navigation.navigate('SharedDashboard')}
              style={{ marginBottom: SPACING.md }}
            />

            {/* Publish (owner) */}
            {isOwner && (
              <Button
                title={publishing ? 'Publishing…' : 'Update Shared Snapshot'}
                variant="primary"
                icon={<Upload size={16} color="#fff" />}
                onPress={handlePublish}
                loading={publishing}
                disabled={publishing}
                style={{ marginBottom: SPACING.md }}
              />
            )}

            {/* Join another household */}
            <SectionHeader title="Join Household" />
            <GlassCard padding="lg" style={{ marginBottom: SPACING['3xl'] }}>
              <TextInputField
                label="Household ID"
                placeholder="Paste a household ID"
                value={joinCode}
                onChangeText={setJoinCode}
                containerStyle={{ marginBottom: SPACING.md }}
              />
              <Button
                title={joining ? 'Joining…' : 'Join'}
                variant="primary"
                icon={<UserPlus size={16} color="#fff" />}
                onPress={handleJoin}
                loading={joining}
                disabled={joining || !joinCode.trim()}
              />
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  statusCard: { marginBottom: SPACING.lg },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  householdName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  householdRole: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
  },
  idLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  idValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  idText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    maxWidth: 160,
    fontFamily: 'monospace',
  },

  membersCard: { marginBottom: SPACING.lg, overflow: 'hidden' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  memberName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  memberEmail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
});
