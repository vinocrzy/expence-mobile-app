/**
 * Event Bus — Simple pub/sub for cross-hook communication
 * Copied from Expense-Web (lib/events.ts) — framework-agnostic, works as-is in RN
 */

type EventCallback = () => void;
const listeners: Record<string, Set<EventCallback>> = {};

export const events = {
  on(event: string, callback: EventCallback): () => void {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(callback);
    return () => {
      listeners[event]?.delete(callback);
    };
  },
  emit(event: string): void {
    listeners[event]?.forEach(cb => cb());
  },
};

export const EVENTS = {
  TRANSACTIONS_CHANGED: 'transactions_changed',
  ACCOUNTS_CHANGED: 'accounts_changed',
  CATEGORIES_CHANGED: 'categories_changed',
  BUDGETS_CHANGED: 'budgets_changed',
  LOANS_CHANGED: 'loans_changed',
  CREDIT_CARDS_CHANGED: 'credit_cards_changed',
} as const;
