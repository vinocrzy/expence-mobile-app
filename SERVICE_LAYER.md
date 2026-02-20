# Expense Mobile App — Service Layer Reference

> **Source Reference**: Expense-Web (`expence-web/frontend/`)
> **Purpose**: Complete API reference for all services, hooks, and data flows for React Native implementation.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Event Bus](#2-event-bus)
3. [Module State](#3-module-state)
4. [Account Service](#4-account-service)
5. [Category Service](#5-category-service)
6. [Transaction Service](#6-transaction-service)
7. [Credit Card Service](#7-credit-card-service)
8. [Loan Service](#8-loan-service)
9. [Recurring Service](#9-recurring-service)
10. [Budget Service](#10-budget-service)
11. [Household Service](#11-household-service)
12. [Shared Data Service](#12-shared-data-service)
13. [Hooks Layer](#13-hooks-layer)
14. [Replication / Sync Engine](#14-replication--sync-engine)
15. [Analytics Engine](#15-analytics-engine)
16. [Financial Math Utilities](#16-financial-math-utilities)
17. [Mobile Implementation Notes](#17-mobile-implementation-notes)

---

## 1. Architecture Overview

### Data Flow

```
User Action → Hook method (addTransaction, etc.)
  → Service.create/update/delete (PouchDB write + side-effect balance updates)
  → events.emit(EVENT_NAME)
  → All subscribed hooks re-fetch data via events.on()
  → React state updates → UI re-renders
```

### Layer Responsibilities

| Layer | File | Responsibility |
|-------|------|---------------|
| **Services** | `lib/localdb-services.ts` (1316 lines) | Raw CRUD + business logic (balance updates, EMI calc, etc.) |
| **Events** | `lib/events.ts` | Pub/sub bus for cross-hook communication |
| **Hooks** | `hooks/useLocalData.ts` (401 lines) | React state management + event subscriptions |
| **Analytics** | `lib/analytics.ts` (515 lines) | Statistical calculations over transaction data |
| **Financial Math** | `lib/financial-math.ts` | Pure utility functions for aggregations |
| **Replication** | `lib/replication.ts` (429 lines) | PouchDB ↔ CouchDB sync |

### Helpers

```typescript
// UUID generation
import { v4 as uuidv4 } from 'uuid';
const generateId = () => uuidv4();

// Safe PouchDB get (returns undefined on 404)
const safeGet = async <T>(db: PouchDB.Database, id: string): Promise<T | undefined> => {
  try {
    return await db.get(id) as unknown as T;
  } catch (err: any) {
    if (err.status === 404) return undefined;
    throw err;
  }
};
```

---

## 2. Event Bus

> **Source**: `lib/events.ts`

Simple pub/sub with `Set`-based listeners. Each `on()` returns an unsubscribe function.

### API

```typescript
const events = {
  on(event: string, callback: () => void): () => void,  // returns unsubscribe
  emit(event: string): void,
};
```

### Event Names

```typescript
const EVENTS = {
  TRANSACTIONS_CHANGED: 'transactions_changed',
  ACCOUNTS_CHANGED:     'accounts_changed',
  CATEGORIES_CHANGED:   'categories_changed',
  BUDGETS_CHANGED:      'budgets_changed',
  LOANS_CHANGED:        'loans_changed',
  CREDIT_CARDS_CHANGED: 'credit_cards_changed',
};
```

### Cross-Event Emission Rules

| Action | Events Emitted |
|--------|---------------|
| Add/Update/Delete Transaction | `TRANSACTIONS_CHANGED` + `ACCOUNTS_CHANGED` |
| Add/Update/Delete Account | `ACCOUNTS_CHANGED` |
| Add/Update/Delete Category | `CATEGORIES_CHANGED` |
| Add/Update/Delete CreditCard | `CREDIT_CARDS_CHANGED` |
| Add/Update/Delete Loan | `LOANS_CHANGED` |
| Add/Update/Delete Budget | `BUDGETS_CHANGED` |

> **Note**: Transaction operations emit `ACCOUNTS_CHANGED` because they update account balances as a side effect.

---

## 3. Module State

> **Source**: `lib/localdb-services.ts` (bottom of file)

Module-level mutable state set during app initialization:

```typescript
let currentHouseholdId: string | null = null;
let currentUser: { id: string; name: string; color?: string } | null = null;

// Setters — called by LocalFirstContext during init
export const setHouseholdId = (id: string | null) => void;
export const setCurrentUser = (user: { id: string; name: string; color?: string } | null) => void;

// Getters
export const getHouseholdId = async (): Promise<string>;  // Falls back to 'household_1'
export const getCurrentUser = (): typeof currentUser;
```

### Initialization Order

1. `AuthContext` authenticates user via Clerk → gets `householdId` from `publicMetadata`
2. `LocalFirstContext` calls `setHouseholdId(householdId)` and `setCurrentUser({ id, name })`
3. `LocalFirstContext` calls `initDB()` to ensure indexes exist
4. `LocalFirstContext` starts replication (if configured)
5. Services are now ready to use

---

## 4. Account Service

> **Source**: `lib/localdb-services.ts` — `accountService`
> **Database**: `accountsDB`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<Account[]>` | All accounts for household (excludes `household_metadata` doc) |
| `getAllActive` | `(householdId: string) => Promise<Account[]>` | Non-archived accounts only (`isArchived !== true`) |
| `getById` | `(id: string) => Promise<Account \| undefined>` | Single account by ID |
| `create` | `(data: Omit<Account, 'id'\|'createdAt'\|'updatedAt'\|'householdId'>) => Promise<Account>` | Creates account with auto-generated `id`, `householdId`, timestamps, `userId`, `createdByName` |
| `update` | `(id: string, data: Partial<Account>) => Promise<Account>` | Partial update, auto-sets `updatedAt` |
| `delete` | `(id: string) => Promise<void>` | Removes doc (safe on 404) |
| `archive` | `(id: string) => Promise<Account>` | Sets `isArchived: true` via `update()` |
| `hasTransactions` | `(id: string) => Promise<boolean>` | Checks if any transactions reference this accountId |
| `calculateTotalBalance` | `(householdId: string) => Promise<number>` | Sum of all active account balances |

### Create Side Effects
- Sets `userId` and `createdByName` from `getCurrentUser()`
- Gets `householdId` from `getHouseholdId()`

---

## 5. Category Service

> **Source**: `lib/localdb-services.ts` — `categoryService`
> **Database**: `categoriesDB`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<Category[]>` | All categories |
| `getByType` | `(householdId: string, type: string) => Promise<Category[]>` | Filter by type (INCOME/EXPENSE) |
| `getById` | `(id: string) => Promise<Category \| undefined>` | Single category |
| `create` | `(data: Omit<Category, 'id'\|'createdAt'\|'updatedAt'\|'householdId'>) => Promise<Category>` | Auto-sets householdId, timestamps |
| `update` | `(id: string, data: Partial<Category>) => Promise<Category>` | Partial update |
| `delete` | `(id: string) => Promise<void>` | Removes doc |

---

## 6. Transaction Service

> **Source**: `lib/localdb-services.ts` — `transactionService`
> **Database**: `transactionsDB`

This is the most complex service. Every CRUD operation includes **balance side effects** on the linked account or credit card.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<Transaction[]>` | All transactions, sorted by `date DESC`, limit 10000 |
| `getByDateRange` | `(householdId: string, startDate: Date, endDate: Date) => Promise<Transaction[]>` | Date-range query, sorted DESC |
| `getByAccount` | `(accountId: string) => Promise<Transaction[]>` | All transactions for one account |
| `getByCategory` | `(categoryId: string) => Promise<Transaction[]>` | All transactions for one category, in-memory sort |
| `getById` | `(id: string) => Promise<Transaction \| undefined>` | Single transaction |
| `create` | `(data: Omit<Transaction, 'id'\|'createdAt'\|'updatedAt'\|'householdId'>) => Promise<Transaction>` | **See balance logic below** |
| `saveSplitTransaction` | `(data: ...) => Promise<Transaction>` | Validates split amounts sum = total, then calls `create()` |
| `update` | `(id: string, data: Partial<Transaction>) => Promise<Transaction>` | **Reverts old balance, applies new** |
| `bulkUpdate` | `(ids: string[], data: Partial<Transaction>) => Promise<void>` | Non-financial fields only (category, description, date) |
| `delete` | `(id: string) => Promise<void>` | **Reverts balance effect** |
| `getTotalIncome` | `(householdId, start, end) => Promise<number>` | Sum of INCOME transactions in range |
| `getTotalExpense` | `(householdId, start, end) => Promise<number>` | Sum of EXPENSE transactions in range |
| `getTotalInvestments` | `(householdId, start, end) => Promise<number>` | Sum of INVESTMENT transactions in range |

### Balance Update Logic: `create()`

```
1. Try accountsDB.get(data.accountId)
   → If found (bank account):
     - INCOME: balance += amount
     - EXPENSE/TRANSFER/DEBT/INVESTMENT: balance -= amount
   → If 404 (might be credit card):
     - Try creditcardsDB.get(data.accountId)
       - EXPENSE/DEBT: currentOutstanding += amount
       - INCOME (payment): currentOutstanding -= amount

2. If type === 'TRANSFER' && transferAccountId:
   - Get destination account
   - destination.balance += amount

3. Save transaction document with generated id, timestamps, userId, createdByName, userColor
```

### Balance Update Logic: `update()`

```
1. Get old transaction
2. REVERT old effect on source account/credit card:
   - INCOME: balance -= oldAmount
   - Other: balance += oldAmount
3. APPLY new effect:
   - INCOME: balance += newAmount
   - Other: balance -= newAmount
4. If old was TRANSFER: revert destination (balance -= oldAmount)
5. If new is TRANSFER: apply destination (balance += newAmount)
6. Save updated transaction
```

### Balance Update Logic: `delete()`

```
1. Get transaction
2. REVERT effect:
   - INCOME: balance -= amount
   - Other: balance += amount
3. If TRANSFER: revert destination (balance -= amount)
4. Remove transaction document
```

### Split Transaction Validation

```typescript
if (data.isSplit && data.splits?.length > 0) {
    const totalSplits = data.splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplits - data.amount) > 0.01) {
        throw new Error('Split amount mismatch');
    }
}
```

---

## 7. Credit Card Service

> **Source**: `lib/localdb-services.ts` — `creditCardService`
> **Database**: `creditcardsDB`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<CreditCard[]>` | All credit cards |
| `getAllActive` | `(householdId: string) => Promise<CreditCard[]>` | Non-archived only |
| `getById` | `(id: string) => Promise<CreditCard \| undefined>` | Single card |
| `create` | `(data: Omit<CreditCard, 'id'\|'createdAt'\|'updatedAt'\|'householdId'>) => Promise<CreditCard>` | Standard create |
| `update` | `(id: string, data: Partial<CreditCard>) => Promise<CreditCard>` | Partial update |
| `delete` | `(id: string) => Promise<void>` | Removes doc |
| `archive` | `(id: string) => Promise<CreditCard>` | Sets `isArchived: true` |
| `generateStatement` | `(creditCardId: string) => Promise<void>` | **See statement logic below** |
| `recordPayment` | `(id: string, amount: number) => Promise<void>` | Reduces `currentOutstanding` by amount |

### Statement Generation Logic

```
1. Get card's billingCycle (day of month) and paymentDueDay
2. Calculate cycle range:
   - cycleEnd = billingDay - 1 of current/previous month
   - cycleStart = billingDay of month before cycleEnd
3. Get all transactions for this card in cycle range
4. Calculate:
   - expenses = sum of EXPENSE transactions in cycle
   - payments = sum of INCOME transactions in cycle
   - closingBalance = previousStatementBalance + expenses - payments
   - minimumDue = closingBalance * 5% (minimum due)
   - dueDate = cycleEnd + 20 days (grace period)
5. Check for duplicate statement (same cycleEnd date)
6. Create statement object:
   {
     id: uuid, statementDate, cycleStart, cycleEnd, dueDate,
     closingBalance, minimumDue, totalPayments: 0, status: 'PAID'|'UNPAID'
   }
7. Prepend to card.statements array
8. Update card document
```

---

## 8. Loan Service

> **Source**: `lib/localdb-services.ts` — `loanService`
> **Database**: `loansDB`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<Loan[]>` | All loans |
| `getById` | `(id: string) => Promise<Loan \| undefined>` | Single loan |
| `create` | `(data: Omit<Loan, 'id'\|'createdAt'\|'updatedAt'\|'householdId'>) => Promise<Loan>` | **See EMI + outstanding logic below** |
| `update` | `(id: string, data: Partial<Loan>) => Promise<Loan>` | Partial update with date handling |
| `delete` | `(id: string) => Promise<void>` | Removes doc |
| `calculateEMI` | `(principal: number, annualRate: number, tenureMonths: number) => number` | Pure EMI formula |
| `recordPayment` | `(id: string, amount: number) => Promise<void>` | Reduces outstanding, increments paidEmis, auto-closes if paid off |

### Create Logic

```typescript
// 1. Auto-calculate EMI if not provided
if (!emiAmount && principal && interestRate && tenureMonths) {
    const r = interestRate / 12 / 100;
    const n = tenureMonths;
    emiAmount = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    emiAmount = Math.round(emiAmount * 100) / 100;
}

// 2. Calculate outstanding if initial EMIs already paid
if (initialPaidEmis > 0 && emiAmount) {
    let balance = principal;
    const r = interestRate / 12 / 100;
    for (let i = 0; i < initialPaidEmis; i++) {
        const interest = balance * r;
        const principalComponent = emiAmount - interest;
        balance -= principalComponent;
    }
    outstandingPrincipal = Math.max(0, Math.round(balance * 100) / 100);
}
```

### EMI Formula

$$EMI = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$$

Where:
- $P$ = principal amount
- $r$ = monthly interest rate (`annualRate / 12 / 100`)
- $n$ = tenure in months

### Record Payment Logic

```
1. Get loan
2. outstandingPrincipal -= amount
3. paidEmis += 1
4. If outstandingPrincipal <= 0: status = 'CLOSED'
5. Update loan
```

---

## 9. Recurring Service

> **Source**: `lib/localdb-services.ts` — `recurringService`
> **Database**: `recurringDB`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<RecurringTransaction[]>` | All recurring items |
| `getAllActive` | `(householdId: string) => Promise<RecurringTransaction[]>` | Active status only |
| `getUpcoming` | `(householdId: string, days?: number) => Promise<RecurringTransaction[]>` | Due within N days (default 30), sorted by nextDueDate ASC |
| `create` | `(data: Omit<...>) => Promise<RecurringTransaction>` | Status defaults to 'ACTIVE' |
| `update` | `(id: string, data: Partial<...>) => Promise<RecurringTransaction>` | Partial update |
| `delete` | `(id: string) => Promise<void>` | Removes doc |
| `processPayment` | `(id: string, accountId: string, actualDate?: string) => Promise<void>` | **See logic below** |

### Process Payment Logic

```
1. Get recurring item
2. Create actual transaction via transactionService.create():
   - amount: recurring.amount
   - type: recurring.type (EXPENSE, etc.)
   - description: "Recurring: {recurring.name}"
   - categoryId: recurring.categoryId
   - accountId: provided accountId or recurring.accountId
3. Calculate next due date based on frequency:
   - WEEKLY: +7 days
   - MONTHLY: +1 month
   - QUARTERLY: +3 months  
   - YEARLY: +1 year
4. Update: lastPaidDate = actualDate, nextDueDate = calculated date
```

---

## 10. Budget Service

> **Source**: `lib/localdb-services.ts` — `budgetService`
> **Database**: `budgetsDB`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(householdId: string) => Promise<Budget[]>` | All budgets |
| `getById` | `(id: string) => Promise<Budget \| undefined>` | Single budget |
| `create` | `(data: Omit<...>) => Promise<Budget>` | Standard create |
| `update` | `(id: string, data: Partial<Budget>) => Promise<Budget>` | Partial update |
| `delete` | `(id: string) => Promise<void>` | Removes doc |
| `getActiveEventBudgets` | `() => Promise<Budget[]>` | Event budgets with ACTIVE status |
| `addPlanItem` | `(budgetId: string, item: any) => Promise<any>` | Appends to `planItems[]`, auto-generates item ID |
| `removePlanItem` | `(budgetId: string, itemId: string) => Promise<void>` | Filters out plan item by ID |
| `activate` | `(budgetId: string) => Promise<Budget>` | Sets `status: 'ACTIVE'` |

### Budget Modes

| Mode | Description |
|------|-------------|
| `MONTHLY` | Standard monthly budget with category limits |
| `EVENT` | One-time event budget (wedding, trip, etc.) with plan items |

---

## 11. Household Service

> **Source**: `lib/localdb-services.ts` — `householdService`
> **Stored in**: `accountsDB` with fixed `_id: 'household_metadata'`

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCurrent` | `() => Promise<Household \| null>` | Gets the `household_metadata` doc |
| `create` | `(name: string, owner: {id, name, email}) => Promise<Household>` | Creates household with invite code `'INV-' + uuid.substring(0,8)`, owner as first member |
| `update` | `(data: Partial<Household>) => Promise<Household>` | Updates household metadata |
| `mockJoin` | `(code: string) => Promise<boolean>` | Placeholder for guest joining |

---

## 12. Shared Data Service

> **Source**: `lib/localdb-services.ts` — `sharedDataService`
> **Database**: `sharedDB`

Used for **household sharing** — the OWNER publishes snapshots, GUESTs read them.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `publishSnapshot` | `(householdId: string) => Promise<void>` | **Owner: publishes current month data** |
| `getSharedTransactions` | `() => Promise<SharedTransaction[]>` | **Guest: reads shared transactions** |
| `getSharedBalances` | `() => Promise<SharedAccountBalance[]>` | **Guest: reads shared balances** |

### Publish Snapshot Logic

```
1. Get current month's transactions (1st to last day)
2. Get all active accounts and credit cards
3. Get all categories (build name lookup map)
4. Clear all existing docs in sharedDB (bulk delete)
5. Transform and insert:
   - Each transaction → SharedTransaction (with category name, account name resolved)
     - Stored with _id: "tx_{transactionId}", docType: "TRANSACTION"
   - Each account → SharedAccountBalance
     - Stored with _id: "bal_{accountId}", docType: "BALANCE"
   - Each credit card → SharedAccountBalance (balance = -outstanding)
     - Stored with _id: "bal_{cardId}", docType: "BALANCE"
```

---

## 13. Hooks Layer

> **Source**: `hooks/useLocalData.ts`

All hooks follow the same pattern:

```typescript
function useEntity() {
  const [data, setData] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const householdId = await getHouseholdId();
    const result = await entityService.getAll(householdId);
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return events.on(EVENTS.ENTITY_CHANGED, load); // auto-refresh on events
  }, [load]);

  const add = useCallback(async (data) => {
    const result = await entityService.create(data);
    events.emit(EVENTS.ENTITY_CHANGED);
    return result;
  }, []);

  // update, delete follow same pattern...

  return { data, loading, add, update, delete, refresh: load };
}
```

### Hook Reference

#### `useTransactions()`

```typescript
returns {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (data: Omit<Transaction, 'id'|'createdAt'|'updatedAt'|'householdId'>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
// Emits: TRANSACTIONS_CHANGED + ACCOUNTS_CHANGED on every mutation
// Subscribes to: TRANSACTIONS_CHANGED
```

#### `useAccounts()`

```typescript
returns {
  accounts: Account[];
  loading: boolean;
  addAccount: (data: Omit<Account, 'id'|'createdAt'|'updatedAt'|'householdId'>) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
// Emits: ACCOUNTS_CHANGED
// Subscribes to: ACCOUNTS_CHANGED
```

#### `useCategories()`

```typescript
returns {
  categories: Category[];
  loading: boolean;
  addCategory: (data: Omit<Category, 'id'|'createdAt'|'updatedAt'|'householdId'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
// Emits: CATEGORIES_CHANGED
// Subscribes to: CATEGORIES_CHANGED
```

#### `useCreditCards()`

```typescript
returns {
  creditCards: CreditCard[];
  loading: boolean;
  addCreditCard: (data: Omit<CreditCard, 'id'|'createdAt'|'updatedAt'|'householdId'>) => Promise<CreditCard>;
  updateCreditCard: (id: string, data: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
// Emits: CREDIT_CARDS_CHANGED
// Subscribes to: CREDIT_CARDS_CHANGED
```

#### `useLoans()`

```typescript
returns {
  loans: Loan[];
  loading: boolean;
  addLoan: (data: Omit<Loan, 'id'|'createdAt'|'updatedAt'|'householdId'>) => Promise<Loan>;
  updateLoan: (id: string, data: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
// Emits: LOANS_CHANGED
// Subscribes to: LOANS_CHANGED
```

#### `useBudgets()`

```typescript
returns {
  budgets: Budget[];
  loading: boolean;
  addBudget: (data: Omit<Budget, 'id'|'createdAt'|'updatedAt'|'householdId'>) => Promise<Budget>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
// Emits: BUDGETS_CHANGED
// Subscribes to: BUDGETS_CHANGED
```

#### `useAnalytics(months?: number)`

```typescript
// Default: months = 12
returns {
  monthlyData: MonthlyStats[];    // { month, income, expense, savings }
  categoryData: CategoryBreakdown[]; // { categoryId, categoryName, amount, percentage, color }
  loading: boolean;
  refresh: () => Promise<void>;
}
// NO event subscription — call refresh() manually or on screen focus
```

---

## 14. Replication / Sync Engine

> **Source**: `lib/replication.ts` (429 lines)

### Sync State (RxJS)

```typescript
import { BehaviorSubject } from 'rxjs';

interface SyncState {
  status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'DISABLED' | 'BLOCKED';
  lastSync?: Date;
  error?: string;
  pendingChanges?: number;
}

export const syncState$: BehaviorSubject<SyncState>;
```

### Remote Database Naming

```
Remote DB name = `hh_{sanitizedHouseholdId}_{collection}`
Example: hh_household123_transactions
```

Where `collection` is one of: `accounts`, `transactions`, `categories`, `creditcards`, `loans`, `budgets`, `recurring`, `shared`

### Configuration

| Source | Priority | Key |
|--------|----------|-----|
| Environment variable | 1st | `NEXT_PUBLIC_COUCHDB_URL` |
| localStorage | 2nd | `couchdb_url` |
| None | 3rd | Sync disabled |

### Authentication

- If CouchDB URL contains credentials → Basic auth
- Otherwise → Clerk Bearer token via `getToken()`

### API

```typescript
// Start syncing all 8 databases
initializeReplication(householdId: string, getToken: () => Promise<string>): Promise<void>

// Stop all sync handlers
stopReplication(): void

// Force immediate sync attempt
triggerManualSync(): Promise<void>

// Enable/disable auto-sync
setAutoSync(enabled: boolean): void

// Clean up after logout
resetReplicationState(): void
```

### Mobile Equivalent

Replace PouchDB replication with:
- **PouchDB + pouchdb-adapter-react-native-sqlite** for persistent storage
- Same replication API works with PouchDB in React Native
- Use `NetInfo` from `@react-native-community/netinfo` for connectivity-aware sync
- Use `AppState` from React Native for foreground/background sync control

---

## 15. Analytics Engine

> **Source**: `lib/analytics.ts` (515 lines)

All functions are async and query transactions directly from PouchDB.

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `calculateMonthlyStats` | `(householdId, startDate, endDate) → MonthlyStats[]` | Monthly income/expense/savings aggregation |
| `calculateCategoryBreakdown` | `(householdId, startDate, endDate) → CategoryBreakdown[]` | Category-level totals with percentages. Handles split transactions. Excludes INVESTMENT and DEBT from expense totals |
| `calculateSubCategoryBreakdown` | `(householdId, categoryId, startDate, endDate) → SubCategoryBreakdown[]` | Breakdown by sub-categories |
| `calculateTrends` | `(householdId) → TrendData` | Month-over-month growth percentages |
| `calculateSavingsRate` | `(householdId, startDate, endDate) → number` | `(income - expense) / income * 100` |
| `getTopSpendingCategories` | `(householdId, startDate, endDate, limit?) → CategoryBreakdown[]` | Top N expense categories |
| `calculateNetWorth` | `(householdId) → number` | Total account balances + CC debt |
| `getCashFlowSummary` | `(householdId) → CashFlowSummary` | Current month income/expense/net |

### EMI & Financial Calculators

| Function | Signature | Description |
|----------|-----------|-------------|
| `calculateEMI` | `(principal, rate, tenure) → number` | Standard EMI formula |
| `calculateAmortizationSchedule` | `(principal, rate, tenure) → AmortizationRow[]` | Full amortization table with month, principal, interest, balance |
| `calculateCreditCardInterest` | `(outstanding, apr) → MonthlyInterest` | Monthly interest on outstanding |
| `calculateCompoundInterest` | `(principal, rate, years, freq) → number` | General compound interest |
| `formatCurrency` | `(amount, currency?) → string` | INR format with `Intl.NumberFormat('en-IN')` |

### Category Breakdown — Split Handling

```typescript
// If transaction has splits:
if (tx.isSplit && tx.splits) {
    for (const split of tx.splits) {
        // Each split has its own categoryId and amount
        // Add split.amount to split.categoryId bucket
    }
} else {
    // Add tx.amount to tx.categoryId bucket  
}
// Excludes INVESTMENT and DEBT types from expense breakdown
```

### MonthlyStats Type

```typescript
interface MonthlyStats {
  month: string;       // "YYYY-MM" format
  income: number;
  expense: number;
  investment: number;
  debt: number;
  savings: number;     // income - expense
}
```

### CategoryBreakdown Type

```typescript
interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;  // of total expense
  count: number;       // transaction count
}
```

---

## 16. Financial Math Utilities

> **Source**: `lib/financial-math.ts`

Pure synchronous functions (no DB access):

```typescript
// Sum of all account balances
calculateTotalLiquidCash(accounts: Account[]): number

// Sum of all credit card currentOutstanding
calculateTotalCreditCardDebt(creditCards: CreditCard[]): number

// liquidCash - creditCardDebt
calculateAvailableBalance(accounts: Account[], creditCards: CreditCard[]): number

// Sum of all loan outstandingPrincipal
calculateTotalLoanOutstanding(loans: Loan[]): number

// liquidCash - creditCardDebt - loanOutstanding
calculateNetWorth(accounts: Account[], creditCards: CreditCard[], loans: Loan[]): number

// Sum of transaction amounts (filtered by type)
calculateTransactionTotal(transactions: Transaction[], type?: string): number

// spent / budgetAmount * 100
calculateBudgetUtilization(spent: number, budgetAmount: number): number
```

---

## 17. Mobile Implementation Notes

### Database Layer

| Web | Mobile |
|-----|--------|
| PouchDB 9.0 + IndexedDB adapter | PouchDB + `pouchdb-adapter-react-native-sqlite` or WatermelonDB |
| 8 singleton DB instances | Same pattern; initialize in app entry |
| `initDB()` creates 15+ indexes | Same Mango indexes work in RN PouchDB |

### Alternative: WatermelonDB

If PouchDB performance is insufficient on mobile, consider WatermelonDB:
- SQLite-backed, lazy loading
- Built-in sync protocol  
- Better large dataset performance
- Requires schema migration system

### State Management

| Web Pattern | Mobile Equivalent |
|-------------|-------------------|
| `useState` + `useCallback` + `events.on()` | Same pattern works in React Native |
| `useEffect` cleanup returns unsubscribe | Same |
| Module-level `currentHouseholdId` | Same (singleton module state) |

### Authentication

| Web (Clerk) | Mobile Options |
|-------------|---------------|
| `@clerk/nextjs` | `@clerk/clerk-expo` |
| `useAuth()`, `useUser()` | Same hooks available |
| `publicMetadata.householdId` | Same Clerk user object |
| localStorage cache | `expo-secure-store` or `AsyncStorage` |

### Key Dependencies Mapping

| Web Package | Mobile Package |
|-------------|---------------|
| `pouchdb-browser` | `pouchdb-react-native` + SQLite adapter |
| `uuid` | `uuid` (same, or `expo-crypto` for `randomUUID()`) |
| `rxjs` | `rxjs` (same) |
| `date-fns` | `date-fns` (same) |
| `@google/generative-ai` | `@google/generative-ai` (same) |
| `jspdf` | `react-native-html-to-pdf` or `expo-print` |
| `exceljs` | `xlsx` library or server-side generation |
| `recharts` | `victory-native` or `react-native-chart-kit` |
| `framer-motion` | `react-native-reanimated` |
| `lucide-react` | `lucide-react-native` |

### Service Layer Portability

The entire service layer (`localdb-services.ts`) is **framework-agnostic** — it only depends on PouchDB and uuid. It can be copied to the React Native project with minimal changes:

1. Replace `import { ... } from './pouchdb'` with RN PouchDB setup
2. Keep all business logic (balance updates, EMI calc, statement generation) as-is
3. Keep the event bus (`events.ts`) as-is — it's pure JS
4. Keep all hooks (`useLocalData.ts`) as-is — they use standard React hooks
5. Remove `'use client'` directives (Next.js-specific)
6. Replace `localStorage` usage in `getUserRole()` with `AsyncStorage`

### Suggested File Structure for Mobile

```
src/
  lib/
    db-types.ts          ← Copy from web (no changes)
    pouchdb.ts           ← Rewrite for RN adapter
    events.ts            ← Copy from web (no changes)
    localdb-services.ts  ← Copy from web (minimal changes)
    analytics.ts         ← Copy from web (no changes)
    financial-math.ts    ← Copy from web (no changes)
    replication.ts       ← Adapt for RN (NetInfo, AppState)
  hooks/
    useLocalData.ts      ← Copy from web (remove 'use client')
  context/
    AuthContext.tsx       ← Rewrite for Clerk Expo
    LocalFirstContext.tsx ← Adapt for RN (remove 'use client', use AppState)
```
