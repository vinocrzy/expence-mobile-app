/**
 * ReportBuilderModal — configurable report generator.
 *
 * Pick a report type, choose format (CSV / PDF), set date range from
 * presets or custom picker, then export. Mirrors web's ReportBuilderModal.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  CreditCard,
  Landmark,
  Target,
  BarChart3,
  DollarSign,
  PieChart,
} from 'lucide-react-native';

import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { ReportType, ReportFormat, ReportFilters } from '@/hooks/useReportExport';
import {
  BottomSheetModal,
  SegmentedControl,
  AnimatedPressable,
  Button,
  type Segment,
} from '@/components/ui';

// ─── Report type options ────────────────────────────────────────────────────

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ElementType }[] = [
  { value: 'EXPENSE', label: 'Expense', icon: TrendingUp },
  { value: 'INCOME', label: 'Income', icon: DollarSign },
  { value: 'INVESTMENT', label: 'Investment', icon: BarChart3 },
  { value: 'DEBT', label: 'Debt', icon: FileText },
  { value: 'ACCOUNT_SUMMARY', label: 'Accounts', icon: Landmark },
  { value: 'LOAN', label: 'Loans', icon: FileSpreadsheet },
  { value: 'CREDIT_CARD', label: 'Credit Cards', icon: CreditCard },
  { value: 'BUDGET_VS_ACTUAL', label: 'Budget', icon: Target },
  { value: 'YEARLY_SUMMARY', label: 'Year Review', icon: PieChart },
];

// ─── Format segments ────────────────────────────────────────────────────────

const FORMAT_SEGMENTS: Segment<ReportFormat>[] = [
  { value: 'CSV', label: 'CSV', color: '#22d3ee', bgColor: 'rgba(34,211,238,0.15)' },
  { value: 'PDF', label: 'PDF', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)' },
];

// ─── Date presets ───────────────────────────────────────────────────────────

type PresetKey = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3' | 'THIS_YEAR' | 'CUSTOM';

const DATE_PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'THIS_MONTH', label: 'This Month' },
  { key: 'LAST_MONTH', label: 'Last Month' },
  { key: 'LAST_3', label: 'Last 3 Months' },
  { key: 'THIS_YEAR', label: 'This Year' },
  { key: 'CUSTOM', label: 'Custom Range' },
];

function presetToRange(key: PresetKey): { start: Date; end: Date } {
  const now = new Date();
  switch (key) {
    case 'LAST_MONTH': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: s, end: e };
    }
    case 'LAST_3': {
      const s = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: s, end: e };
    }
    case 'THIS_YEAR': {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31);
      return { start: s, end: e };
    }
    case 'THIS_MONTH':
    default: {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: s, end: e };
    }
  }
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onExport: (type: ReportType, format: ReportFormat, filters: ReportFilters) => Promise<void>;
}

export function ReportBuilderModal({ visible, onClose, onExport }: Props) {
  const [selectedType, setSelectedType] = useState<ReportType>('EXPENSE');
  const [format, setFormat] = useState<ReportFormat>('CSV');
  const [presetKey, setPresetKey] = useState<PresetKey>('THIS_MONTH');
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      let start: Date;
      let end: Date;
      if (presetKey === 'CUSTOM') {
        start = customStart;
        end = customEnd;
      } else {
        const range = presetToRange(presetKey);
        start = range.start;
        end = range.end;
      }
      const filters: ReportFilters = {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
      await onExport(selectedType, format, filters);
      onClose();
    } finally {
      setExporting(false);
    }
  }, [presetKey, customStart, customEnd, selectedType, format, onExport, onClose]);

  // ── Footer ──────────────────────────────────────────────────────────────

  const footer = (
    <Button
      title={exporting ? 'Generating…' : 'Export Report'}
      variant="primary"
      onPress={handleExport}
      disabled={exporting}
      icon={<FileSpreadsheet size={16} color="#fff" />}
      style={{ marginTop: SPACING.sm }}
    />
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Build Report"
      footer={footer}
      maxHeightRatio={0.9}
    >
      {/* Report type grid */}
      <Text style={styles.label}>Report Type</Text>
      <View style={styles.typeGrid}>
        {REPORT_TYPES.map((rt) => {
          const Icon = rt.icon;
          const active = selectedType === rt.value;
          return (
            <AnimatedPressable
              key={rt.value}
              style={[styles.typeCard, active && styles.typeCardActive]}
              onPress={() => setSelectedType(rt.value)}
            >
              <Icon size={18} color={active ? '#22d3ee' : COLORS.textTertiary} />
              <Text style={[styles.typeText, active && styles.typeTextActive]}>
                {rt.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Format toggle */}
      <Text style={styles.label}>Format</Text>
      <SegmentedControl
        segments={FORMAT_SEGMENTS}
        selected={format}
        onSelect={setFormat}
        size="sm"
        style={{ marginBottom: SPACING.lg }}
      />

      {/* Date presets */}
      <Text style={styles.label}>Date Range</Text>
      <View style={styles.presetWrap}>
        {DATE_PRESETS.map((p) => {
          const active = presetKey === p.key;
          return (
            <AnimatedPressable
              key={p.key}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => setPresetKey(p.key)}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>
                {p.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Custom date pickers */}
      {presetKey === 'CUSTOM' && (
        <View style={styles.dateRow}>
          <AnimatedPressable
            style={styles.dateBtn}
            onPress={() => setShowStartPicker(true)}
          >
            <Calendar size={14} color={COLORS.textTertiary} />
            <Text style={styles.dateText}>{fmt(customStart)}</Text>
          </AnimatedPressable>
          <Text style={{ color: COLORS.textTertiary }}>→</Text>
          <AnimatedPressable
            style={styles.dateBtn}
            onPress={() => setShowEndPicker(true)}
          >
            <Calendar size={14} color={COLORS.textTertiary} />
            <Text style={styles.dateText}>{fmt(customEnd)}</Text>
          </AnimatedPressable>
        </View>
      )}

      {/* Native date pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={customStart}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          themeVariant="dark"
          onChange={(_, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setCustomStart(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={customEnd}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          themeVariant="dark"
          onChange={(_, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setCustomEnd(date);
          }}
        />
      )}
    </BottomSheetModal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  typeCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  typeCardActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34,211,238,0.08)',
  },
  typeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#22d3ee',
  },

  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  presetText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#a78bfa',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});
