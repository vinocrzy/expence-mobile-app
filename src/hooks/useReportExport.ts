/**
 * useReportExport — generate & share financial reports on mobile.
 *
 * Supports:
 *  - CSV export via expo-file-system + expo-sharing
 *  - PDF export via expo-print (HTML → PDF)
 *
 * Mirrors web's useReportExport hook, adapted for React Native.
 */

import { useState, useCallback } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

import {
  transactionService,
  accountService,
  loanService,
  creditCardService,
  budgetService,
  getHouseholdId,
} from '@/lib/localdb-services';
import type { Transaction, Account, Loan, CreditCard, Budget } from '@/types/db-types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReportType =
  | 'EXPENSE'
  | 'INCOME'
  | 'INVESTMENT'
  | 'DEBT'
  | 'ACCOUNT_SUMMARY'
  | 'LOAN'
  | 'CREDIT_CARD'
  | 'BUDGET_VS_ACTUAL'
  | 'YEARLY_SUMMARY'
  | 'CONSOLIDATED';

export type ReportFormat = 'CSV' | 'PDF';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  categoryIds?: string[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useReportExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(
    async (type: ReportType, format: ReportFormat, filters: ReportFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const householdId = await getHouseholdId();

        // Fetch data
        const data = await fetchReportData(type, householdId, filters);

        if (format === 'CSV') {
          await exportCSV(data, type);
        } else {
          await exportPDF(data, type);
        }
      } catch (err: any) {
        console.error('[ReportExport] error', err);
        setError(err?.message || 'Export failed');
        Alert.alert('Export Error', err?.message || 'Failed to generate report');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { exportReport, isLoading, error };
}

// ─── Data fetchers ───────────────────────────────────────────────────────────

interface ReportData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: Record<string, string | number>;
}

async function fetchReportData(
  type: ReportType,
  householdId: string,
  filters: ReportFilters,
): Promise<ReportData> {
  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);

  switch (type) {
    case 'EXPENSE':
    case 'INCOME':
    case 'INVESTMENT':
    case 'DEBT':
    case 'CONSOLIDATED': {
      const txns = await transactionService.getByDateRange(householdId, start, end);
      const filtered = type === 'CONSOLIDATED'
        ? txns
        : txns.filter((t) => t.type === type);

      const total = filtered.reduce((s, t) => s + t.amount, 0);

      return {
        title: `${type.charAt(0) + type.slice(1).toLowerCase()} Report`,
        headers: ['Date', 'Description', 'Amount', 'Type'],
        rows: filtered
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((t) => [
            new Date(t.date).toLocaleDateString('en-IN'),
            t.description || '—',
            t.amount,
            t.type,
          ]),
        summary: { 'Total Amount': total, Transactions: filtered.length },
      };
    }

    case 'ACCOUNT_SUMMARY': {
      const accounts = await accountService.getAll(householdId);
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

      return {
        title: 'Account Summary',
        headers: ['Name', 'Type', 'Balance', 'Currency'],
        rows: accounts.map((a) => [a.name, a.type, a.balance || 0, a.currency]),
        summary: { 'Total Balance': totalBalance, Accounts: accounts.length },
      };
    }

    case 'LOAN': {
      const loans = await loanService.getAll(householdId);
      const totalOutstanding = loans.reduce((s, l) => s + (l.outstandingPrincipal || 0), 0);

      return {
        title: 'Loan Report',
        headers: ['Name', 'Lender', 'Principal', 'Outstanding', 'Rate', 'EMI'],
        rows: loans.map((l) => [
          l.name,
          l.lender || '—',
          l.principal,
          l.outstandingPrincipal,
          `${l.interestRate}%`,
          l.emiAmount || 0,
        ]),
        summary: { 'Total Outstanding': totalOutstanding, Loans: loans.length },
      };
    }

    case 'CREDIT_CARD': {
      const cards = await creditCardService.getAll(householdId);

      return {
        title: 'Credit Card Report',
        headers: ['Name', 'Bank', 'Limit', 'Outstanding', 'Utilization'],
        rows: cards.map((c) => {
          const util = c.creditLimit ? ((c.currentOutstanding || 0) / c.creditLimit * 100).toFixed(0) + '%' : '—';
          return [c.name, c.bankName || '—', c.creditLimit || 0, c.currentOutstanding || 0, util];
        }),
      };
    }

    case 'BUDGET_VS_ACTUAL': {
      const budgets = await budgetService.getAll(householdId);

      return {
        title: 'Budget vs Actual',
        headers: ['Budget', 'Planned', 'Spent', 'Remaining', 'Status'],
        rows: budgets.map((b) => {
          const planned = b.totalBudget || 0;
          const spent = b.totalSpent || 0;
          const remaining = planned - spent;
          return [b.name, planned, spent, remaining, remaining >= 0 ? 'On Track' : 'Over Budget'];
        }),
      };
    }

    case 'YEARLY_SUMMARY': {
      const txns = await transactionService.getByDateRange(householdId, start, end);
      const monthMap = new Map<string, { income: number; expense: number }>();

      txns.forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 });
        const m = monthMap.get(key)!;
        if (t.type === 'INCOME') m.income += t.amount;
        else if (t.type === 'EXPENSE') m.expense += t.amount;
      });

      const rows = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => [month, data.income, data.expense, data.income - data.expense]);

      const totals = rows.reduce(
        (acc, r) => ({
          income: acc.income + (r[1] as number),
          expense: acc.expense + (r[2] as number),
        }),
        { income: 0, expense: 0 },
      );

      return {
        title: 'Yearly Summary',
        headers: ['Month', 'Income', 'Expense', 'Savings'],
        rows,
        summary: {
          'Total Income': totals.income,
          'Total Expense': totals.expense,
          'Net Savings': totals.income - totals.expense,
        },
      };
    }

    default:
      return { title: 'Report', headers: [], rows: [] };
  }
}

// ─── CSV export ──────────────────────────────────────────────────────────────

async function exportCSV(data: ReportData, type: ReportType) {
  const lines: string[] = [];

  // Header row
  lines.push(data.headers.map(escCSV).join(','));

  // Data rows
  data.rows.forEach((row) => {
    lines.push(row.map((cell) => escCSV(String(cell))).join(','));
  });

  // Summary rows
  if (data.summary) {
    lines.push('');
    Object.entries(data.summary).forEach(([k, v]) => {
      lines.push(`${escCSV(k)},${escCSV(String(v))}`);
    });
  }

  const csv = lines.join('\n');
  const filename = `${type.toLowerCase()}_report_${Date.now()}.csv`;
  const file = new File(Paths.cache, filename);
  file.write(csv);
  const fileUri = file.uri;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: data.title,
    });
  } else {
    Alert.alert('Saved', `Report saved to ${filename}`);
  }
}

function escCSV(val: string) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// ─── PDF export ──────────────────────────────────────────────────────────────

async function exportPDF(data: ReportData, type: ReportType) {
  const html = buildHTML(data);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: data.title,
    });
  } else {
    Alert.alert('PDF Generated', `Saved to ${uri}`);
  }
}

function buildHTML(data: ReportData): string {
  const fmtNum = (v: string | number) => {
    if (typeof v === 'number') return `₹${v.toLocaleString('en-IN')}`;
    return v;
  };

  const headerCells = data.headers.map((h) => `<th>${h}</th>`).join('');
  const bodyRows = data.rows
    .map((row) => `<tr>${row.map((c) => `<td>${fmtNum(c)}</td>`).join('')}</tr>`)
    .join('');

  let summaryHTML = '';
  if (data.summary) {
    summaryHTML = `<div class="summary">${Object.entries(data.summary)
      .map(([k, v]) => `<div><strong>${k}:</strong> ${fmtNum(v)}</div>`)
      .join('')}</div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, sans-serif; padding: 20px; color: #1a1a1a; font-size: 12px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f5f5f5; text-align: left; padding: 6px 8px; border-bottom: 2px solid #ddd; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #fafafa; }
  .summary { background: #f0f0f0; padding: 12px; border-radius: 8px; margin-top: 8px; }
  .summary div { margin-bottom: 4px; }
</style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="sub">Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${summaryHTML}
</body>
</html>`;
}
