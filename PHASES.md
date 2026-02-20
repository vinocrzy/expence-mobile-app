# Expence Mobile App — Build Phases

> React Native (Expo SDK 54) mobile app mirroring the Expense-Web Next.js application.

---

## Progress Overview

| Phase | Name | Status | Commit | Files | Lines |
|-------|------|--------|--------|-------|-------|
| 1 | Project Setup & Foundation | ✅ Complete | `7d3495e` | 37 | ~1,200 |
| 2 | Database & Core Services | ✅ Complete | `02c272b` | 8 | +2,999 |
| 3 | Authentication | ✅ Complete | `5974866` | 12 | +2,820 |
| 4 | Navigation Shell | ✅ Complete | `5f46fba` | 16 | +1,015 |
| 5 | Design System | ✅ Complete | `047e304` | 31 | +3,423 |
| 6 | Core Screens | ✅ Complete | `5b2558e` | 9 | +1,744 |
| 7 | Guest Mode (No-Auth) | ✅ Complete | `0ef254f` | 8 | +638 |
| 8 | Financial Features | 🔲 Not Started | — | — | — |
| 9 | Analytics & Charts | 🔲 Not Started | — | — | — |
| 10 | Settings & Household | 🔲 Not Started | — | — | — |
| 11 | Sync & Polish | 🔲 Not Started | — | — | — |

**Total so far:** 115 files, ~13,800 lines

---

## Phase 1: Project Setup & Foundation ✅

**Commit:** `7d3495e`

**What was built:**
- Expo SDK 54 project (`expo init`, TypeScript strict, React 19.1, RN 0.81.5)
- All core dependencies installed:
  - `@react-navigation/native`, `bottom-tabs`, `native-stack`
  - `react-native-reanimated`, `react-native-gesture-handler`
  - `expo-linear-gradient`, `expo-haptics`, `expo-blur`
  - `lucide-react-native`, `react-native-svg`
  - `@gorhom/bottom-sheet`
- Path aliases (`@/` → `src/`) via `babel-plugin-module-resolver`
- Constants system: `COLORS` (dark theme), `SPACING`, `BORDER_RADIUS`, `FONT_SIZE`, `ICON_SIZE`
- Navigation skeleton: `TabNavigator`, `RootNavigator`, type definitions
- 8 placeholder screens: Dashboard, Transactions, Finances, Budgets, More, Settings, Profile, Analytics

---

## Phase 2: Database & Core Services ✅

**Commit:** `02c272b`

**What was built:**
- PouchDB modular packages: `pouchdb-core`, `pouchdb-find`, `pouchdb-mapreduce`, `pouchdb-replication`, `pouchdb-adapter-http`, `pouchdb-adapter-memory`
- 8 database singletons with memory adapter (`src/lib/pouchdb.ts`)
- Full service layer ported from web:
  - `localdb-services.ts` — CRUD for transactions, accounts, categories, budgets, credit cards, loans, recurring, households
  - `financial-math.ts` — EMI, amortization, prepayment, interest calculations
  - `analytics.ts` — spending by category, monthly trends, budget utilization, savings rate
- 7 React hooks: `useLocalData.ts` — `useTransactions`, `useAccounts`, `useCategories`, `useBudgets`, `useCreditCards`, `useLoans`, `useRecurring`
- TypeScript types: `db-types.ts` and `pouchdb.d.ts`

---

## Phase 3: Authentication ✅

**Commit:** `5974866`

**What was built:**
- Clerk Expo SDK: `@clerk/clerk-expo`, `expo-secure-store`, `expo-web-browser`, `expo-auth-session`
- SecureStore-backed token cache (`src/lib/auth.ts`)
- `AuthContext` provider mapping Clerk user to local shape (id, email, name, color)
- Hydrates PouchDB services with user/household IDs
- `SignInScreen` — email/password + OAuth stubs (Google/Apple), dark theme
- `SignUpScreen` — registration + email verification flow
- `AuthNavigator` — SignIn/SignUp stack
- `RootNavigator` — conditional auth vs main app rendering
- `App.tsx` wrapped in ClerkProvider → ClerkLoaded → SafeAreaProvider → NavigationContainer

**Known workaround:** Installed with `--legacy-peer-deps` due to react-dom peer conflict

---

## Phase 4: Navigation Shell ✅

**Commit:** `5f46fba`

**What was built:**
- **TabNavigator** — 5 tabs (Home, Activity, FAB, Wallet, More) with haptic feedback
- **Center FAB** — gradient button (blue→purple), elevated above tab bar, triggers action sheet
- **RootNavigator** — 16 stack screens registered (detail views, settings, household, analytics, reports, recurring, budgets)
- **MoreScreen** — sectioned iOS-style menu:
  - User avatar card with Clerk image/initials
  - 5 groups: Insights & Reports, Financial, Household, Management, Account
  - Sign-out with confirmation dialog
- **ScreenHeader** — reusable header: safe-area inset, back button, large/regular title, right action
- **FAB** — gradient floating action button with haptics and shadow
- 10 placeholder detail screens: AccountDetail, CreditCardDetail, LoanDetail, BudgetDetail, BudgetPlan, Recurring, Reports, Household, SharedDashboard, SettingsCategories

---

## Phase 5: Design System ✅

**Commit:** `047e304`

**28 reusable UI components + animation library:**

| Category | Components |
|----------|------------|
| **Core Primitives** | `AnimatedPressable`, `Button` (6 variants), `GlassCard`, `Badge`, `Avatar` (gradient ring), `Divider`, `IconCircle` |
| **Form** | `TextInputField` (animated focus ring), `AmountInput` (currency prefix), `SegmentedControl`, `SelectField` (bottom sheet picker), `SwitchRow` (animated toggle) |
| **Feedback** | `BottomSheetModal`, `ConfirmDialog`, `EmptyState`, `ErrorBanner`, `LoadingScreen`, `SkeletonLoader` (5 shape presets) |
| **Cards & Lists** | `HeroCard` (gradient balance), `StatCard`, `TransactionRow`, `SectionHeader`, `FilterBar`, `FilterChip`, `ListItem`, `QuickActionSheet` (6-action grid) |
| **Status** | `SyncStatusPill` (5 states), `AnimatedAmount` (spring number) |

**Animation library:** `src/lib/animations.ts` — spring/timing presets, entering/exiting/layout animation configs for reanimated.

**Barrel export:** `@/components/ui` — single import for all components.

**QuickActionSheet** wired to TabNavigator FAB button.

---

## Phase 6: Core Screens 🔲

**Goal:** Build the 4 main tab screens with real data + TransactionModal.

**Planned work:**
- **DashboardScreen** — Hero balance card, stat cards (income/expense/savings), upcoming payments, recent transactions
- **TransactionsScreen** — Filterable list with search, type pills, date grouping, pull-to-refresh
- **TransactionModal** — Full form: type toggle, amount, title, category/account select, date picker, notes
- **FinancesScreen** — Accounts list, credit cards summary, loans overview with balances
- **BudgetsScreen** — Budget cards with progress bars, utilization indicators

---

## Phase 6: Core Screens ✅

**Commit:** `5b2558e`

**What was built:**
- **DashboardScreen** (347 lines) — hero gradient balance card, horizontal-scroll stat cards (income, expense, savings rate, total debt), assets vs liabilities summary, recent transactions list (latest 8), pull-to-refresh
- **TransactionsScreen** (259 lines) — search bar with icon, type filter pills (ALL/EXPENSE/INCOME/TRANSFER/INVESTMENT/DEBT), date-grouped SectionList, long-press-to-delete with Alert confirmation, pull-to-refresh, empty state
- **TransactionModal** (270 lines) — full CRUD bottom-sheet form with 5-type SegmentedControl, AmountInput with currency symbol, description, account/category SelectFields (filtered by type), transfer destination, DateTimePicker. Cancel/Save footer
- **FinancesScreen** (280 lines) — hero available balance, two-column cash/CC due summary, sectioned lists for bank accounts, credit cards (with outstanding), loans (with principal). Navigation to detail screens
- **BudgetsScreen** (251 lines) — active budget cards with gradient progress bars, spent calculation from transactions (monthly or event date range), percentage display, over-budget warnings with AlertTriangle icon
- **TabNavigator wiring** — QuickActionSheet now opens TransactionModal with pre-selected type (expense/income/transfer/investment/debt)
- **New dependency:** `@react-native-community/datetimepicker`
- **PHASES.md** tracking document created

**Key patterns:**
- All screens use `useSafeAreaInsets()` for safe area handling
- Pull-to-refresh via `RefreshControl` on all list screens
- Financial formatting: `₹{n}` with Indian locale, K/L abbreviations
- Data from hooks: `useTransactions`, `useAccounts`, `useCreditCards`, `useLoans`, `useCategories`, `useBudgets`
- Financial math utils: `calculateAvailableBalance`, `calculateTotalLiquidCash`, etc.

---

## Phase 7: Guest Mode (No-Auth) ✅

**Commit:** `0ef254f`

**What was built:**
- **WelcomeScreen** (`src/screens/auth/WelcomeScreen.tsx`) — branded onboarding entry point
  - Hero gradient header with app logo
  - Three feature highlights (track expenses, data on device, sync later)
  - "Sign In" gradient button → Clerk auth flow
  - "Continue as Guest" outline button → local-only mode
  - Haptic feedback on both actions
- **AuthContext guest mode** (`src/context/AuthContext.tsx`) — extended with:
  - `isGuest: boolean` flag, `enterGuestMode()`, `exitGuestMode()`
  - Guest ID generated via `uuid` and persisted in AsyncStorage
  - PouchDB services hydrated with guest identifiers (all CRUD works identically)
  - Clerk sync skipped when in guest mode
- **RootNavigator 3-way branch** (`src/navigation/RootNavigator.tsx`):
  - `!isLoaded && !isGuest` → loading spinner
  - `isGuest || isSignedIn` → main app stack
  - `else` → AuthNavigator (Welcome → SignIn/SignUp)
- **AuthNavigator updated** (`src/navigation/AuthNavigator.tsx`):
  - Initial mode changed from `'signin'` to `'welcome'`
  - Welcome → SignIn / SignUp / Guest three-way flow
- **SyncStatusPill** (`src/components/ui/SyncStatusPill.tsx`) — added `LOCAL_ONLY` state
  - Smartphone icon, purple accent, "Local Only" label
- **MoreScreen** (`src/screens/settings/MoreScreen.tsx`) — guest-aware:
  - Guest: generic "G" avatar, "Guest" name, "Sign in to enable sync" subtitle
  - Household section hidden for guest users
  - "Sign Out" replaced with "Sign In" button (with data preservation alert)
- **useGuestMigration hook** (`src/hooks/useGuestMigration.ts`) — scaffolded:
  - Detects previous guest session after sign-in
  - Prompts: "Keep Data" (merge) or "Start Fresh" (discard)
  - Placeholder for bulk PouchDB doc re-tagging (Phase 10+)

**Key files:**
| File | Action | Lines |
|------|--------|-------|
| `src/screens/auth/WelcomeScreen.tsx` | New | +231 |
| `src/context/AuthContext.tsx` | Modified | +73 (161→234) |
| `src/navigation/RootNavigator.tsx` | Modified | +6 (98→104) |
| `src/navigation/AuthNavigator.tsx` | Modified | +15 (18→33) |
| `src/hooks/useGuestMigration.ts` | New | +145 |
| `src/components/ui/SyncStatusPill.tsx` | Modified | +7 (130→137) |
| `src/screens/settings/MoreScreen.tsx` | Modified | +60 (380→440) |

---

## Phase 8: Financial Features ✅

**Commit:** `b54f0b5` — Phase 8: Financial Features — detail screens + modals

**Goal:** Detail screens for accounts, credit cards, loans, and budget planning.

### Deliverables

| File | Status | Lines |
|------|--------|-------|
| `src/screens/accounts/AccountDetailScreen.tsx` | Replaced | ~290 |
| `src/screens/credit-cards/CreditCardDetailScreen.tsx` | Replaced | ~340 |
| `src/screens/loans/LoanDetailScreen.tsx` | Replaced | ~340 |
| `src/screens/budgets/BudgetDetailScreen.tsx` | Replaced | ~300 |
| `src/screens/budgets/BudgetPlanScreen.tsx` | Replaced | ~280 |
| `src/components/AccountModal.tsx` | New | ~165 |
| `src/components/CreditCardPaymentModal.tsx` | New | ~210 |
| `src/components/PrepaymentModal.tsx` | New | ~175 |
| `src/components/LoanModal.tsx` | New | ~290 |
| `src/components/CategoryModal.tsx` | New | ~255 |

### Key Features
- **AccountDetailScreen:** Balance hero card, income/expense summary, quick actions (edit/archive/delete), recent transactions list
- **CreditCardDetailScreen:** Gradient card visual, utilization bar with color thresholds, statement list, pay bill modal
- **LoanDetailScreen:** EMI calculator with amortization, progress bar, principal vs interest breakdown, prepayment modal
- **BudgetDetailScreen:** Month navigation for recurring budgets, category breakdown with progress bars, over-budget warnings
- **BudgetPlanScreen:** Add/remove plan items (name/amount/qty), total vs budget display, activate button
- **AccountModal:** Name, type (6 types), balance, currency — BottomSheetModal form
- **CreditCardPaymentModal:** Amount with quick-fill buttons (min/total due), source account, date
- **PrepaymentModal:** Amount (capped at outstanding), strategy toggle (reduce tenure/EMI), date
- **LoanModal:** Full CRUD with live EMI preview calculator, linked account, start date, paid EMIs
- **CategoryModal:** Name, type segments, color picker grid (20 colors), subcategories CRUD

---

## Phase 9: Analytics & Charts 🔲

**Goal:** Charts and visualizations for spending insights.

**Planned work:**
- AnalyticsScreen — spending by category (pie/donut), monthly trends (bar), savings rate
- Chart library integration (victory-native or react-native-chart-kit)
- Date range picker
- Export functionality hooks

---

## Phase 10: Settings & Household 🔲

**Goal:** Settings, category management, household sharing.

**Planned work:**
- SettingsScreen — preferences, data management, app info
- SettingsCategoriesScreen — CRUD for custom categories with icons/colors
- ProfileScreen — user info, avatar, household membership
- HouseholdScreen — members, invitations, shared budgets
- SharedDashboardScreen — household aggregate view

---

## Phase 11: Sync & Polish 🔲

**Goal:** PouchDB ↔ CouchDB sync, offline support, app polish.

**Planned work:**
- Replication engine: bidirectional sync with conflict resolution
- Offline queue for mutations
- Push notifications (expo-notifications)
- App icon & splash screen
- Performance optimization (FlatList virtualization, memo boundaries)
- Error boundaries
- Deep linking
- Final QA pass

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, React Native 0.81.5, React 19.1 |
| Language | TypeScript 5.9 (strict) |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) |
| Auth | Clerk Expo SDK |
| Database | PouchDB (modular, memory adapter) |
| Animation | react-native-reanimated 3 |
| Gestures | react-native-gesture-handler |
| Icons | lucide-react-native |
| UI | Custom design system (28 components) |
