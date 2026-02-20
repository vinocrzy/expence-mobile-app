/**
 * Date Utilities
 */

import { format, isToday, isYesterday, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Format date for display in transaction lists
 */
export function formatTransactionDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
}

/**
 * Format date with time
 */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
}

/**
 * Format date as short month year
 */
export function formatMonthYear(dateStr: string): string {
  return format(new Date(dateStr), 'MMM yyyy');
}

/**
 * Format date for API/storage (ISO string)
 */
export function toISODate(date: Date): string {
  return date.toISOString();
}

/**
 * Get current month date range
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

/**
 * Get date range for N months back from now
 */
export function getMonthsBackRange(months: number): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(subMonths(now, months - 1)),
    end: endOfMonth(now),
  };
}
