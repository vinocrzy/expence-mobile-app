/**
 * SettingsScreen — app preferences, data management, sync info.
 *
 * Sections:
 *  - General: links to Household, Manage Categories
 *  - Data Management: export / import backup (PouchDB JSON)
 *  - Sync: SyncStatusPill + CouchDB URL display
 *  - About: version label
 *
 * Mirrors web settings/page.tsx, adapted for React Native.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Users,
  Tag,
  Download,
  Upload,
  RefreshCw,
  Info,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import type { RootStackParamList } from '@/navigation/types';
import { collections } from '@/lib/pouchdb';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  ScreenHeader,
  GlassCard,
  ListItem,
  SectionHeader,
  SyncStatusPill,
} from '@/components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Backup helpers ──────────────────────────────────────────────────────────

async function exportBackup() {
  const data: Record<string, any[]> = {};
  for (const [name, db] of Object.entries(collections)) {
    const result = await db.allDocs({ include_docs: true });
    data[name] = result.rows.map((r) => r.doc);
  }
  return { version: 1, timestamp: new Date().toISOString(), data };
}

async function importBackup(json: string) {
  const backup = JSON.parse(json);
  if (backup.version !== 1) throw new Error('Unsupported backup version');

  for (const [name, docs] of Object.entries(backup.data) as [string, any[]][]) {
    const db = collections[name];
    if (!db) continue;

    const all = await db.allDocs({ include_docs: false });
    const revMap = new Map(all.rows.map((r) => [r.id, r.value.rev]));

    const batch = docs.map((doc: any) => {
      const rev = revMap.get(doc._id);
      if (rev) return { ...doc, _rev: rev };
      const { _rev, ...clean } = doc;
      return clean;
    });

    if (batch.length > 0) await db.bulkDocs(batch);
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState(false);

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setBusy(true);
    try {
      const backup = await exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const filename = `expence_backup_${Date.now()}.json`;
      const file = new File(Paths.cache, filename);
      file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Backup',
        });
      } else {
        Alert.alert('Export', `Saved to ${filename}`);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Unknown error');
    } finally {
      setBusy(false);
    }
  }, []);

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      Alert.alert(
        'Import Backup',
        'This will overwrite matching records. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              setBusy(true);
              try {
                const uri = result.assets![0].uri;
                const file = new File(uri);
                const json = await file.text();
                await importBackup(json);
                Alert.alert('Import Complete', 'Data restored successfully.');
              } catch (e: any) {
                Alert.alert('Import Failed', e.message || 'Invalid backup file');
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not open file picker');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* General */}
        <SectionHeader title="General" />
        <GlassCard padding={0} style={styles.section}>
          <ListItem
            title="Household"
            subtitle="Members & invites"
            leftIcon={<Users size={ICON_SIZE.md} color={COLORS.investment} />}
            onPress={() => navigation.navigate('Household')}
          />
          <View style={styles.divider} />
          <ListItem
            title="Manage Categories"
            subtitle="Customize expense categories"
            leftIcon={<Tag size={ICON_SIZE.md} color={COLORS.info} />}
            onPress={() => navigation.navigate('SettingsCategories')}
          />
        </GlassCard>

        {/* Data Management */}
        <SectionHeader title="Data Management" />
        <GlassCard padding={0} style={styles.section}>
          <ListItem
            title="Export Backup"
            subtitle="Download all data as JSON"
            leftIcon={<Download size={ICON_SIZE.md} color={COLORS.income} />}
            onPress={handleExport}
            showChevron={false}
            rightElement={
              busy ? <RefreshCw size={16} color={COLORS.textTertiary} /> : undefined
            }
          />
          <View style={styles.divider} />
          <ListItem
            title="Import Backup"
            subtitle="Restore from JSON file"
            leftIcon={<Upload size={ICON_SIZE.md} color={COLORS.warning} />}
            onPress={handleImport}
            showChevron={false}
          />
        </GlassCard>

        {/* Sync Status */}
        <SectionHeader title="Sync" />
        <GlassCard padding="lg" style={{ marginBottom: SPACING.lg }}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Status</Text>
            <SyncStatusPill status="LOCAL_ONLY" />
          </View>
          <Text style={styles.syncHint}>
            CouchDB sync is configured in Phase 11. Data is stored locally via PouchDB.
          </Text>
        </GlassCard>

        {/* About */}
        <SectionHeader title="About" />
        <GlassCard padding="lg" style={{ marginBottom: SPACING['3xl'] }}>
          <View style={styles.aboutRow}>
            <Info size={16} color={COLORS.textTertiary} />
            <Text style={styles.aboutText}>Expence Mobile v1.0.0</Text>
          </View>
          <Text style={styles.aboutSub}>
            Built with Expo SDK 54, PouchDB & React Navigation
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  section: { marginBottom: SPACING.lg, overflow: 'hidden' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },

  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  syncLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  syncHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    lineHeight: 18,
  },

  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  aboutText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  aboutSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },
});
