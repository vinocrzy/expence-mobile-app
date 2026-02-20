/**
 * Color System — Dark-first theme matching Expense-Web
 * Source: DESIGN_SYSTEM.md
 */

export const COLORS = {
  // Base
  background: '#000000',
  foreground: '#ededed',
  surface: '#1c1c1e',
  surfaceAlpha: 'rgba(28,28,30,0.8)',
  surfaceElevated: '#2c2c2e',

  // Borders
  border: 'rgba(255,255,255,0.05)',
  borderLight: 'rgba(255,255,255,0.1)',
  borderMedium: 'rgba(255,255,255,0.15)',

  // Text
  textPrimary: '#ededed',
  textSecondary: '#9ca3af',   // gray-400
  textTertiary: '#6b7280',    // gray-500
  textMuted: '#4b5563',       // gray-600

  // Transaction types
  income: '#34d399',           // emerald-400
  incomeBg: 'rgba(16,185,129,0.1)',
  expense: '#fb7185',          // rose-400
  expenseBg: 'rgba(244,63,94,0.1)',
  transfer: '#60a5fa',         // blue-400
  transferBg: 'rgba(59,130,246,0.1)',
  investment: '#fbbf24',       // amber-400
  investmentBg: 'rgba(245,158,11,0.1)',
  debt: '#c084fc',             // purple-400
  debtBg: 'rgba(168,85,247,0.1)',

  // Accent / Gradients
  primary: '#2563eb',          // blue-600
  primaryLight: '#3b82f6',     // blue-500
  heroGradientStart: '#2563eb',
  heroGradientEnd: '#9333ea',  // purple-600

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Budget utilization
  budgetOnTrack: '#22c55e',
  budgetWarning: '#f59e0b',
  budgetOver: '#ef4444',

  // Tab bar
  tabActive: '#3b82f6',
  tabInactive: '#6b7280',

  // White helpers
  white: '#ffffff',
  white5: 'rgba(255,255,255,0.05)',
  white10: 'rgba(255,255,255,0.1)',
  white20: 'rgba(255,255,255,0.2)',
  white50: 'rgba(255,255,255,0.5)',
} as const;

/**
 * Get color for a transaction type
 */
export function getTransactionColor(type: string): string {
  switch (type) {
    case 'INCOME': return COLORS.income;
    case 'EXPENSE': return COLORS.expense;
    case 'TRANSFER': return COLORS.transfer;
    case 'INVESTMENT': return COLORS.investment;
    case 'DEBT': return COLORS.debt;
    default: return COLORS.textSecondary;
  }
}

/**
 * Get background color for a transaction type
 */
export function getTransactionBgColor(type: string): string {
  switch (type) {
    case 'INCOME': return COLORS.incomeBg;
    case 'EXPENSE': return COLORS.expenseBg;
    case 'TRANSFER': return COLORS.transferBg;
    case 'INVESTMENT': return COLORS.investmentBg;
    case 'DEBT': return COLORS.debtBg;
    default: return COLORS.white5;
  }
}
