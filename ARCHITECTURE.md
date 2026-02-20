# Expense Mobile App — Architecture Document

> **Source Reference**: Expense-Web (`expence-web/frontend/`)
> **Target**: React Native + Expo mobile application
> **Generated**: February 2026

---

## Table of Contents

1. [Technology Stack Mapping](#1-technology-stack-mapping)
2. [Application Architecture](#2-application-architecture)
3. [Provider Hierarchy](#3-provider-hierarchy)
4. [Data Models](#4-data-models)
5. [Database Layer](#5-database-layer)
6. [Event System](#6-event-system)
7. [Authentication](#7-authentication)
8. [Replication & Sync](#8-replication--sync)
9. [Environment Configuration](#9-environment-configuration)

---

## 1. Technology Stack Mapping

### Web → Mobile Library Mapping

| Concern | Web (Expense-Web) | Mobile (React Native) Recommendation |
|---------|-------------------|--------------------------------------|
| **Framework** | Next.js 16 (App Router) | Expo SDK ~52+ with Expo Router |
| **Language** | TypeScript 5.9 (strict) | TypeScript 5.x (strict) |
| **Auth** | `@clerk/nextjs` ^6.36.9 | `@clerk/clerk-expo` |
| **Database** | PouchDB 9.0 (IndexedDB adapter) | `pouchdb-adapter-react-native-sqlite` or `@nozbe/watermelondb` |
| **Sync** | PouchDB Replication → CouchDB | PouchDB Replication → CouchDB (same protocol) |
| **UI Framework** | Tailwind CSS v4 | `nativewind` (Tailwind for RN) or `react-native-paper` |
| **Navigation** | Next.js App Router | `expo-router` (file-based) or `@react-navigation/native` |
| **Charts** | `recharts` ^3.6.3 | `victory-native` or `react-native-chart-kit` |
| **Animations** | `framer-motion` ^12.16.0 | `react-native-reanimated` ^3.x |
| **Icons** | `lucide-react` ^0.513.0 | `lucide-react-native` or `@expo/vector-icons` |
| **PDF Generation** | `jspdf` ^3.0.1 + `jspdf-autotable` | `react-native-html-to-pdf` or `expo-print` |
| **Excel Generation** | `exceljs` ^4.4.0 | `exceljs` (works in RN with polyfills) + `react-native-fs` |
| **File Sharing** | Browser download / Web Share API | `expo-sharing` + `expo-file-system` |
| **Date Utilities** | `date-fns` ^4.1.0 | `date-fns` ^4.1.0 (same) |
| **IDs** | `uuid` ^13.0.0 | `uuid` or `expo-crypto` randomUUID |
| **Reactive State** | `rxjs` ^7.8.2 BehaviorSubject | `rxjs` ^7.8.2 (same) or React state |
| **AI Integration** | `@google/generative-ai` ^0.24.1 | `@google/generative-ai` (same, via API) |
| **Class Utils** | `clsx` ^2.1.1 | `clsx` (if using NativeWind) |
| **Haptic Feedback** | `navigator.vibrate(10)` | `expo-haptics` |
| **Secure Storage** | `localStorage` | `expo-secure-store` |
| **PWA/Offline** | Serwist service worker | Native app (inherently offline-capable) |

### Web Dependencies (37 runtime) — Full List

```
@clerk/nextjs ^6.36.9
@google/generative-ai ^0.24.1
@serwist/next ^9.5.0
clsx ^2.1.1
date-fns ^4.1.0
exceljs ^4.4.0
framer-motion ^12.16.0
jspdf ^3.0.1
jspdf-autotable ^5.0.2
lucide-react ^0.513.0
next ^16.0.8
pouchdb-adapter-http ^9.0.0
pouchdb-adapter-idb ^9.0.0
pouchdb-core ^9.0.0
pouchdb-find ^9.0.0
pouchdb-replication ^9.0.0
react ^19.2.1
react-dom ^19.2.1
recharts ^3.6.3
rxjs ^7.8.2
serwist ^9.5.0
tailwindcss ^4.1.10
uuid ^13.0.0
```

---

## 2. Application Architecture

### Architecture Pattern: **Local-First / Offline-First**

The entire application is designed around the principle that the local database (PouchDB over IndexedDB) is the **single source of truth**. There are **zero REST API calls** for CRUD operations. All data reads/writes go directly to the local database with optional async replication to CouchDB.

```
┌──────────────────────────────────────────────────┐
│                   React UI Layer                  │
│  (Pages / Screens / Components / Modals)          │
├──────────────────────────────────────────────────┤
│                   React Hooks                     │
│  (useTransactions, useAccounts, useBudgets, etc.) │
│  ↕ subscribe to Event Bus for auto-refresh        │
├──────────────────────────────────────────────────┤
│                  Service Layer                    │
│  (transactionService, accountService, etc.)       │
│  Business logic + PouchDB CRUD                    │
├──────────────────────────────────────────────────┤
│                Event Bus (Pub/Sub)                │
│  (events.emit / events.on)                        │
├──────────────────────────────────────────────────┤
│              PouchDB (8 databases)                │
│  Local storage via IndexedDB / SQLite             │
├──────────────────────────────────────────────────┤
│          Replication Engine (Optional)            │
│  PouchDB ↔ CouchDB (live + retry)                │
└──────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → Hook method (e.g., `addTransaction()`)
2. **Hook** → Service method (e.g., `transactionService.create()`)
3. **Service** → PouchDB write + business logic side-effects (balance updates)
4. **Hook** → `events.emit('TRANSACTIONS_CHANGED')` + `events.emit('ACCOUNTS_CHANGED')`
5. **All subscribed hooks** → Re-fetch from PouchDB, update React state
6. **Background** → PouchDB replication pushes changes to CouchDB (non-blocking)
7. **Remote changes** → PouchDB change listener → Event Bus → React state refresh

### SSR Strategy (Web-Specific — Not Needed in Mobile)

The web app disables SSR via a `ClientShell` wrapper using `next/dynamic({ ssr: false })`. All page components use `'use client'` directives. The mobile app is inherently client-rendered, so this pattern is not needed.

---

## 3. Provider Hierarchy

### Web Provider Stack

```
RootLayout (Server Component — web only)
  └── ClerkProvider
       └── ClientShell (dynamic import, SSR: false)
            └── AuthProvider (Clerk → local User mapping, localStorage cache)
                 └── LocalFirstProvider (PouchDB init, replication, household role)
                      └── ToastProvider (animated notifications)
                           └── IOSInstallPrompt (PWA-only, skip in mobile)
                                └── {children} + Navbar
```

### Mobile Equivalent

```
App (Expo entry)
  └── ClerkProvider (from @clerk/clerk-expo)
       └── AuthProvider (same logic, use expo-secure-store instead of localStorage)
            └── LocalFirstProvider (same logic, SQLite adapter instead of IDB)
                 └── ToastProvider (use react-native-toast or custom)
                      └── NavigationContainer / Expo Router
                           └── {screens}
```

**Source files to replicate:**
- `context/AuthContext.tsx` → Auth context (user mapping, caching)
- `context/LocalFirstContext.tsx` → DB initialization, replication setup
- `context/ToastContext.tsx` → Toast notification system

---

## 4. Data Models

> **Source**: `lib/db-types.ts`

All interfaces must be replicated **exactly** in the mobile app. These types define the PouchDB document schema.

### Account

```typescript
interface Account {
  id: string;
  name: string;
  type: string;              // 'CHECKING' | 'SAVINGS' | 'CASH' | 'BANK' | 'INVESTMENT' | 'WALLET' | 'OTHER'
  balance?: number;
  currency: string;          // Default: 'INR'
  isArchived?: boolean;
  householdId: string;
  userId?: string;           // ID of creator
  createdByName?: string;    // Display name of creator
  createdAt?: string;        // ISO date string
  updatedAt?: string;        // ISO date string
  _rev?: string;             // PouchDB revision (managed by PouchDB)
  _id?: string;              // PouchDB ID (same as `id`)
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT' | 'DEBT';
  description?: string;
  date: string;              // ISO date string
  categoryId?: string;
  subCategoryId?: string;
  accountId: string;
  householdId: string;
  userId?: string;
  createdByName?: string;
  userColor?: string;        // Visual indicator per user in household
  createdAt?: string;
  updatedAt?: string;
  _rev?: string;
  isSplit?: boolean;
  splits?: {
    id: string;
    amount: number;
    categoryId: string;
    note?: string;
  }[];
  transferAccountId?: string; // Destination account for TRANSFER type
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  type?: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'DEBT';
  icon?: string;
  color?: string;
  subCategories?: {
    id: string;
    name: string;
  }[];
  isActive?: boolean;        // Default: true
  householdId: string;
  createdAt?: string;
  updatedAt?: string;
  _rev?: string;
}
```

### CreditCard

```typescript
interface CreditCard {
  id: string;
  name: string;
  bankName?: string;
  lastFourDigits?: string;
  billingCycle?: number;      // Day of month when cycle starts
  paymentDueDay?: number;     // Days after statement for payment
  creditLimit?: number;
  currentOutstanding?: number;
  apr?: number;               // Annual Percentage Rate
  statements?: CreditCardStatement[];
  isArchived?: boolean;
  householdId: string;
  createdAt?: string;
  updatedAt?: string;
  _rev?: string;
}

interface CreditCardStatement {
  id: string;
  statementDate: string;
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  closingBalance: number;
  minimumDue: number;
  totalPayments: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL';
}
```

### Loan

```typescript
interface Loan {
  id: string;
  name: string;
  lender?: string;
  type?: string;              // 'PERSONAL' | 'HOME' | 'CAR' | 'EDUCATION' | etc.
  principal: number;
  interestRate: number;       // Annual percentage
  tenureMonths: number;
  startDate: string;
  initialPaidEmis?: number;   // EMIs already paid before tracking starts
  paidEmis?: number;          // EMIs paid via app
  emiAmount?: number;         // Auto-calculated if not provided
  outstandingPrincipal: number;
  status?: 'ACTIVE' | 'CLOSED';
  linkedAccountId?: string;   // Account for auto-debit
  isArchived?: boolean;
  householdId: string;
  createdAt?: string;
  updatedAt?: string;
  _rev?: string;
}
```

### Budget

```typescript
interface Budget {
  id: string;
  name: string;
  budgetMode?: 'EVENT' | 'RECURRING' | 'CATEGORY';
  categoryId?: string;                       // Legacy single-category mode
  budgetLimitConfig?: BudgetCategoryLimit[];  // Multi-category limits
  period?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  totalSpent?: number;
  status?: string;            // 'ACTIVE' | 'PLANNING' | 'COMPLETED'
  isArchived?: boolean;
  householdId: string;
  createdAt?: string;
  updatedAt?: string;
  planItems?: BudgetPlanItem[];
  _rev?: string;
}

interface BudgetPlanItem {
  id: string;
  name: string;
  unitAmount?: number;
  quantity?: number;
  totalAmount?: number;
}

interface BudgetCategoryLimit {
  categoryId: string;
  amount: number;
}
```

### RecurringTransaction

```typescript
interface RecurringTransaction {
  id: string;
  name: string;               // e.g., "LIC Policy", "Car Loan EMI"
  amount: number;
  type: 'EXPENSE' | 'INVESTMENT' | 'DEBT' | 'INCOME' | 'TRANSFER';
  frequency: 'MONTHLY' | 'YEARLY' | 'QUARTERLY' | 'WEEKLY' | 'DAILY';
  startDate: string;
  nextDueDate: string;
  categoryId?: string;
  accountId?: string;          // Source account to debit from
  autoPay?: boolean;           // Future feature flag
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  description?: string;
  lastPaidDate?: string;
  householdId: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  _rev?: string;
  _id?: string;
}
```

### Household

```typescript
interface Household {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;          // Format: 'INV-XXXXXXXX'
  members: {
    userId: string;
    name: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
    joinedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  _rev?: string;
  _id?: string;
}
```

### Shared Types (Guest View)

```typescript
interface SharedTransaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  categoryName: string;
  description: string;
  accountName: string;
  user: string;
}

interface SharedAccountBalance {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface SharedBudget {
  id: string;
  name: string;
  totalBudget: number;
  totalSpent: number;
}
```

---

## 5. Database Layer

> **Source**: `lib/pouchdb.ts`

### 8 PouchDB Database Instances

| # | Variable Name | DB Name | Purpose |
|---|--------------|---------|---------|
| 1 | `accountsDB` | `accounts` | Bank accounts, wallets + household_metadata doc |
| 2 | `transactionsDB` | `transactions` | All financial records |
| 3 | `categoriesDB` | `categories` | Income/Expense/Investment/Debt categories |
| 4 | `creditcardsDB` | `creditcards` | Credit card management |
| 5 | `loansDB` | `loans` | Loan tracking |
| 6 | `budgetsDB` | `budgets` | Budget planning |
| 7 | `recurringDB` | `recurring` | Recurring/subscription payments |
| 8 | `sharedDB` | `shared` | Shared household data for guest view |

### Database Configuration

```typescript
// Each DB is created with:
{
  adapter: 'idb',           // Mobile: use 'react-native-sqlite'
  auto_compaction: true      // Automatic compaction for performance
}
```

### Required Indexes

Created by `initDB()` on app startup:

```typescript
// Transaction indexes
transactionsDB.createIndex({ index: { fields: ['date'] } });
transactionsDB.createIndex({ index: { fields: ['accountId'] } });
transactionsDB.createIndex({ index: { fields: ['categoryId'] } });
transactionsDB.createIndex({ index: { fields: ['householdId', 'date'] } });      // Composite
transactionsDB.createIndex({ index: { fields: ['accountId', 'date'] } });        // Composite

// Account indexes
accountsDB.createIndex({ index: { fields: ['householdId'] } });

// Category indexes
categoriesDB.createIndex({ index: { fields: ['householdId'] } });
categoriesDB.createIndex({ index: { fields: ['type'] } });

// Credit card indexes
creditcardsDB.createIndex({ index: { fields: ['householdId'] } });

// Loan indexes
loansDB.createIndex({ index: { fields: ['householdId'] } });

// Budget indexes
budgetsDB.createIndex({ index: { fields: ['householdId'] } });
budgetsDB.createIndex({ index: { fields: ['budgetMode'] } });
budgetsDB.createIndex({ index: { fields: ['status'] } });

// Recurring indexes
recurringDB.createIndex({ index: { fields: ['householdId'] } });
recurringDB.createIndex({ index: { fields: ['nextDueDate'] } });          // For "upcoming" queries
recurringDB.createIndex({ index: { fields: ['status'] } });
```

### SSR Safety (Web-Only — Not Needed in Mobile)

The web version returns a `Proxy` object on the server side to prevent PouchDB from crashing during SSR. Mobile apps don't have SSR, so this safety layer is not needed.

### Mobile Adaptation Notes

- Replace `pouchdb-adapter-idb` with `pouchdb-adapter-react-native-sqlite`
- The `initDB()` function and index definitions can be reused as-is
- Remove the server-side proxy guard
- PouchDB core + plugins work in React Native with proper polyfills (`events`, `buffer`, `process`)

---

## 6. Event System

> **Source**: `lib/events.ts`

Simple pub/sub event bus for cross-component reactivity. When a service modifies data, it emits an event. All hooks that subscribe to that event will re-fetch data from PouchDB.

### Implementation

```typescript
type EventCallback = () => void;
const listeners: Record<string, Set<EventCallback>> = {};

export const events = {
  on(event: string, callback: EventCallback) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(callback);
    return () => { listeners[event]?.delete(callback); }; // Returns unsubscribe function
  },
  emit(event: string) {
    listeners[event]?.forEach(cb => cb());
  }
};
```

### Event Names

```typescript
export const EVENTS = {
  TRANSACTIONS_CHANGED: 'transactions_changed',
  ACCOUNTS_CHANGED: 'accounts_changed',
  CATEGORIES_CHANGED: 'categories_changed',
  BUDGETS_CHANGED: 'budgets_changed',
  LOANS_CHANGED: 'loans_changed',
  CREDIT_CARDS_CHANGED: 'credit_cards_changed',
};
```

### Event Flow Pattern

```
Service.create() → PouchDB write → Hook calls events.emit('XXX_CHANGED')
                                         ↓
                   All hooks with events.on('XXX_CHANGED') → re-fetch data
```

**Important**: Hooks emit **multiple events** when side effects occur. For example, `addTransaction()` emits both `TRANSACTIONS_CHANGED` AND `ACCOUNTS_CHANGED` because creating a transaction updates account balance.

### Mobile Adaptation

This event bus pattern works identically in React Native. Copy as-is. Alternatively, could use React Native's `DeviceEventEmitter` or `EventEmitter` from the `events` npm package.

---

## 7. Authentication

> **Source**: `context/AuthContext.tsx`

### User Interface

```typescript
interface User {
  id: string;               // clerkUser.id
  email: string;            // primaryEmailAddress
  name: string;             // fullName or username
  firstName?: string | null;
  username?: string | null;
  imageUrl?: string;
  householdId?: string;     // publicMetadata.householdId || clerkUser.id
}
```

### AuthContext API

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;   // Opens Clerk sign-in
  logout: () => void;                            // Clears cache, signs out
  refreshUser: () => Promise<void>;
  getToken: (options?: any) => Promise<string | null>;
}
```

### Authentication Flow

1. **On mount**: Load cached user from `localStorage('pocket_user_cache')` for instant display
2. **When Clerk loads**: Map Clerk user to local `User` interface:
   - `id` ← `clerkUser.id`
   - `email` ← `clerkUser.primaryEmailAddress.emailAddress`
   - `name` ← `clerkUser.fullName || clerkUser.username`
   - `householdId` ← `clerkUser.publicMetadata.householdId || clerkUser.id`
3. **Cache update**: Store mapped user in localStorage for next load
4. **Logout**: Clear cache → `signOut()` → redirect to root

### Household ID Derivation

The `householdId` serves as the data partition key. It comes from Clerk's `publicMetadata.householdId` if set, otherwise defaults to the user's Clerk ID. This means:
- **Solo users**: `householdId === userId`
- **Household users**: `householdId` is shared across all household members

### Household Roles

- **OWNER**: Default role, full CRUD access, can publish shared snapshots
- **GUEST**: Stored in `localStorage('household_role')` + `localStorage('joined_household_id')`, read-only access to shared data

### Mobile Adaptation

- Replace `@clerk/nextjs` with `@clerk/clerk-expo`
- Replace `localStorage` with `expo-secure-store` for the user cache
- The `User` interface and mapping logic remain identical
- Use `@clerk/clerk-expo`'s `useAuth()` and `useUser()` hooks

---

## 8. Replication & Sync

> **Source**: `lib/replication.ts`

### Sync State (Observable)

```typescript
// RxJS BehaviorSubject
const syncState$ = new BehaviorSubject<{
  status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'DISABLED' | 'BLOCKED';
  connected: boolean;
  lastSync?: Date;
  error?: any;
  isAutoSyncEnabled: boolean;
}>({
  status: 'DISABLED',
  connected: false,
  isAutoSyncEnabled: false,
});
```

### Remote Database Naming Convention

```
hh_{sanitizedHouseholdId}_{collectionName}
```

Example: `hh_user_abc123_transactions`

Sanitization: `householdId.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()`

### Configuration Priority

1. `NEXT_PUBLIC_COUCHDB_URL` environment variable (with embedded credentials)
2. `localStorage('couchdb_config')` JSON object: `{ enabled, url, username, password, forceEnable }`
3. Falls back to `DISABLED` if neither is set

### Authentication for CouchDB

- **Basic auth**: Extracted from URL credentials (`username:password@host`)
- **Bearer token**: From Clerk's `getToken()` if no URL credentials

### Replication Modes

**Auto-Sync (Live)**:
- `{ live: true, retry: true, batch_size: 60 }`
- Continuous bidirectional sync for all 8 databases
- Controlled by `localStorage('autoSyncEnabled')` toggle

**Manual Sync (One-Off)**:
- `{ live: false, retry: false, batch_size: 60 }`
- Triggered by user via `triggerManualSync()`
- Syncs all 6 personal collections (not recurring/shared in manual mode for some implementations)

### Key Functions

| Function | Purpose |
|----------|---------|
| `initializeReplication(getToken, personalId, viewingId?)` | Sets up live sync for all DBs |
| `stopReplication()` | Cancels all active sync handlers |
| `triggerManualSync()` | One-off sync across all collections |
| `setAutoSync(enabled)` | Persists preference + starts/stops sync |
| `resetReplicationState()` | Full cleanup on logout |

### Sync Lifecycle

```
App Init → LocalFirstProvider → initializeReplication()
  1. Load auto-sync preference from localStorage
  2. Load CouchDB config (env → localStorage → disabled)
  3. Check NEXT_PUBLIC_REPLICATION_DISSABLED flag
  4. If auto-sync disabled → DISABLED state, return
  5. Verify connection via fetch to CouchDB URL
  6. For each DB: ensure remote DB exists (PUT), start .sync()
  7. Attach change/paused/error handlers → update syncState$
```

### Shared DB Sync (Guest/Owner)

- **Owner**: Shared DB syncs to `hh_{ownerId}_shared`
- **Guest**: Shared DB syncs to `hh_{joinedHouseholdId}_shared` (read from `localStorage('joined_household_id')`)

### Mobile Adaptation

- Replication works identically in React Native with PouchDB
- Replace `localStorage` with `expo-secure-store` or `AsyncStorage`
- Replace `fetch()` for connection verification with React Native's `fetch`
- Network status: Use `@react-native-community/netinfo` for online/offline detection
- Background sync: Consider `expo-task-manager` for background replication

---

## 9. Environment Configuration

### Required Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `CLERK_PUBLISHABLE_KEY` | Yes | — | Clerk authentication (mobile uses `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`) |
| `COUCHDB_URL` | No | — | Remote CouchDB URL for sync |
| `GEMINI_API_KEY` | No | — | Google Gemini AI for smart transaction parsing |
| `REPLICATION_DISABLED` | No | `false` | Block all sync |

### Mobile Environment Setup

Use Expo's `.env` file or `app.config.ts` `extra` field:

```typescript
// app.config.ts
export default {
  expo: {
    extra: {
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      couchdbUrl: process.env.EXPO_PUBLIC_COUCHDB_URL,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    }
  }
};
```

---

## Key Architectural Principles for Mobile

1. **All business logic is in `lib/` and `hooks/`** — completely decoupled from Next.js. The service layer, analytics, financial math, insights, and backup modules can be reused with minimal changes.

2. **PouchDB is the single source of truth** — no REST API calls for data. Same protocol works in React Native.

3. **Event bus pattern** for cross-component reactivity maps directly to React Native.

4. **Clerk auth** has a React Native SDK (`@clerk/clerk-expo`) with the same API surface.

5. **The entire app is ~25 screens** with 8 data collections and consistent CRUD patterns throughout.

6. **Currency is INR (₹)** with `en-IN` locale formatting throughout.

7. **HouseholdId is the data partition key** — all queries filter by `householdId`.

8. **All dates are ISO strings** — no Date objects are stored in PouchDB.

9. **All IDs are UUIDs** generated via `uuid` v4.

10. **PouchDB `_id` always equals the entity `id`** — kept in sync for all document types.
