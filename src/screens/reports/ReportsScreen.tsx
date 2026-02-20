/**
 * ReportsScreen — quick export cards + report builder.
 *
 * Quick-tap cards for common reports (this month expenses, yearly summary).
 * "Build Custom Report" hero launches ReportBuilderModal.
 * Template list showing all available report types.
 * Mirrors web's reports/page.tsx.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ICON_SIZE } from '@/constants';
import { useReportExport, type ReportType, type ReportFormat, type ReportFilters } from '@/hooks/useReportExport';
import {
  ScreenHeader,
  GlassCard,
  AnimatedPressable,
  SectionHeader,
  Button,
} from '@/components/ui';
import { ReportBuilderModal } from '@/components/ReportBuilderModal';

// ─── Quick report definitions ─────────────────────────────────────────────────

function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
}

function getYearRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
}

// ─── Template data ───────────────────────────────────────────────────────────

const TEMPLATES = [
  { name: 'Expense Report', desc: 'Category breakdown', icon: TrendingUp },
  { name: 'Income Report', desc: 'Source analysis', icon: FileSpreadsheet },
  { name: 'Investment Report', desc: 'Portfolio tracking', icon: TrendingUp },
  { name: 'Debt Report', desc: 'Transaction history', icon: FileText },
  { name: 'Account Summary', desc: 'Balances & flows', icon: FileSpreadsheet },
  { name: 'Loan Metrics', desc: 'EMI & Interest', icon: FileText },
  { name: 'Budget Analysis', desc: 'Planned vs Actual', icon: Calendar },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { exportReport, isLoading } = useReportExport();

  const handleQuickExport = (type: ReportType, format: ReportFormat, filters: ReportFilters) => {
    exportReport(type, format, filters);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reports" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card — custom report builder */}
        <GlassCard padding="lg" style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <FileDown size={24} color="#22d3ee" />
          </View>
          <Text style={styles.heroTitle}>Custom Report Builder</Text>
          <Text style={styles.heroDesc}>
            Generate detailed financial reports with custom filters, date ranges, and formats.
          </Text>
          <Button
            title="Start Building"
            variant="primary"
            icon={<FileSpreadsheet size={16} color="#fff" />}
            onPress={() => setModalVisible(true)}
            style={{ marginTop: SPACING.md }}
          />
        </GlassCard>

        {/* Quick exports */}
        <SectionHeader title="Quick Exports" />
        <View style={styles.quickGrid}>
          <AnimatedPressable
            style={styles.quickCard}
            onPress={() => handleQuickExport('EXPENSE', 'CSV', getThisMonthRange())}
            disabled={isLoading}
          >
            <View style={styles.quickTop}>
              <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <TrendingUp size={18} color="#f87171" />
              </View>
              <ChevronRight size={16} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.quickTitle}>This Month Expenses</Text>
            <Text style={styles.quickDesc}>CSV export of all expenses</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={styles.quickCard}
            onPress={() => handleQuickExport('YEARLY_SUMMARY', 'PDF', getYearRange())}
            disabled={isLoading}
          >
            <View style={styles.quickTop}>
              <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <Calendar size={18} color="#60a5fa" />
              </View>
              <ChevronRight size={16} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.quickTitle}>Yearly Summary</Text>
            <Text style={styles.quickDesc}>Full year performance</Text>
          </AnimatedPressable>
        </View>

        {/* Available templates */}
        <SectionHeader title="Available Templates" />
        <GlassCard padding={0} style={{ overflow: 'hidden' as const, marginBottom: SPACING.lg }}>
          {TEMPLATES.map((item, i) => {
            const Icon = item.icon;
            return (
              <View
                key={i}
                style={[
                  styles.templateRow,
                  i < TEMPLATES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: COLORS.border,
                  },
                ]}
              >
                <View style={styles.templateIcon}>
                  <Icon size={16} color={COLORS.textTertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateDesc}>{item.desc}</Text>
                </View>
                <View style={styles.formatBadge}>
                  <Text style={styles.formatText}>CSV / PDF</Text>
                </View>
              </View>
            );
          })}
        </GlassCard>

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* Report Builder Modal */}
      <ReportBuilderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onExport={exportReport}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

  heroCard: { marginBottom: SPACING.lg, position: 'relative', overflow: 'hidden' },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(34,211,238,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },

  quickGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  quickTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  quickDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },

  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  templateDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  formatBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  formatText: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
});
