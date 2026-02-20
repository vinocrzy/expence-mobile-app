# Expense Mobile App — Screen Specifications

> **Source Reference**: Expense-Web (`expence-web/frontend/app/`)
> **Purpose**: Complete screen-by-screen specification for React Native implementation.

---

## Table of Contents

1. [Navigation Architecture](#1-navigation-architecture)
2. [Screen Specifications](#2-screen-specifications)
3. [Modal Specifications](#3-modal-specifications)
4. [Hook Usage Matrix](#4-hook-usage-matrix)
5. [Modal Usage Matrix](#5-modal-usage-matrix)

---

## 1. Navigation Architecture

### Bottom Tab Bar (Mobile — 5 items)

| Position | Label | Icon | Route | Type |
|----------|-------|------|-------|------|
| 1 | Home | `House` | `/dashboard` | Tab |
| 2 | Wallet | `Wallet` | `/finances` | Tab |
| 3 | **[+]** | Plus circle | — | FAB (Quick Action Sheet) |
| 4 | Budgets | `PieChart` | `/budgets` | Tab |
| 5 | Menu | `Menu` | — | Opens drawer/bottom sheet |

### Quick Action Sheet (FAB Menu)

Spring-animated bottom sheet with 6 quick actions:

| Action | Type | Behavior |
|--------|------|----------|
| Add Expense | Primary | Opens `TransactionModal` with type=EXPENSE |
| Add Income | Primary | Opens `TransactionModal` with type=INCOME |
| Transfer | Secondary | Opens `TransactionModal` with type=TRANSFER |
| Pay EMI | Secondary | Navigates to `/loans` |
| Pay Card | Secondary | Navigates to `/credit-cards` |
| Subscribe | Secondary | Navigates to `/recurring?action=add` |

Uses haptic feedback (`navigator.vibrate(10)` → `expo-haptics` in mobile).

### Menu Drawer Groups

| Group | Items | Routes |
|-------|-------|--------|
| 1 | Analytics, Reports | `/analytics`, `/reports` |
| 2 | Subscriptions & EMIs | `/recurring` |
| 3 | All Activity, Manage Categories | `/transactions`, `/settings/categories` |
| 4 | My Profile, App Settings | `/profile`, `/settings` |
| 5 | Log Out | — |

### React Native Navigation Mapping

```
RootNavigator (Stack)
├── AuthFlow (Stack)
│   ├── SignIn
│   └── SignUp
└── MainFlow (Stack)
    ├── MainTabs (Bottom Tab Navigator)
    │   ├── Dashboard (Stack)
    │   │   └── DashboardScreen
    │   ├── Finances (Stack)
    │   │   ├── FinancesScreen
    │   │   ├── AccountsScreen
    │   │   ├── AccountDetailScreen ([id])
    │   │   ├── CreditCardsScreen
    │   │   ├── CreditCardDetailScreen ([id])
    │   │   ├── LoansScreen
    │   │   └── LoanDetailScreen ([id])
    │   ├── AddButton (dummy tab → opens QuickActionSheet)
    │   ├── Budgets (Stack)
    │   │   ├── BudgetsListScreen
    │   │   ├── BudgetCreateScreen
    │   │   ├── BudgetDetailScreen ([id])
    │   │   ├── BudgetEditScreen ([id])
    │   │   └── BudgetPlanScreen ([id])
    │   └── Menu (drawer or bottom sheet)
    ├── Transactions (Stack)
    ├── Analytics (Stack)
    ├── Recurring (Stack)
    ├── Reports (Stack)
    ├── Settings (Stack)
    │   └── CategoriesScreen
    ├── Profile (Stack)
    ├── Household (Stack)
    │   └── SharedDashboard
    └── Debug (Stack)
```

---

## 2. Screen Specifications

### 2.1 Dashboard (`/dashboard`)

**Description**: Main home screen with financial overview, charts, and widgets.

**Hooks**: `useAuth`, `useAccounts`, `useTransactions`, `useCategories`, `useCreditCards`
**Services**: `accountService`, `creditCardService`, `transactionService`, `recurringService`
**Analytics**: `getCashFlowSummary`, `calculateTrends`, `calculateCategoryBreakdown`
**Financial Math**: `calculateAvailableBalance`, `calculateTotalLiquidCash`, `calculateTotalCreditCardDebt`, `calculateTotalLoanOutstanding`, `calculateTransactionTotal`, `calculateNetWorth`

**State**:
- `cashFlow` (CashFlowSummary)
- `trendData[]` (TrendData)
- `categoryBreakdown[]` (CategoryBreakdown)
- `netWorth`, `availableBalance`, `investmentTotal`, `debtTotal`, `totalLoanOutstanding`
- `upcomingTxs[]` (RecurringTransaction — next 14 days)
- `isModalOpen`, `selectedTransaction`
- `showLiabilities` (toggle)

**Layout** (top to bottom):
1. **NativeHeader** — Greeting ("Good morning, {firstName}"), Clerk avatar, notification bell
2. **StatsRow** — Horizontal scroll of stat cards:
   - Available Balance (hero gradient card, large)
   - Income (this month)
   - Expense (this month)
   - Savings Rate (%)
3. **Assets/Liabilities Panel** — Toggleable section showing:
   - Total Cash, Total CC Debt, Net Worth, Total Loan Outstanding
4. **CashFlowChart** — Recharts BarChart with income/expense/investment/debt columns by time period
5. **RecentActivity** — Last 5 transactions via `TransactionCard` component, "See All" link
6. **InsightsWidget** — Fetches from `/api/insights`, shows prioritized insights cards
7. **Upcoming Payments** — Next 14 days of recurring items, "See All" → `/recurring`
8. **BudgetWidget** — Active recurring budget progress bars
9. **FinancialHealth** — SVG circular gauge (0-100 score, based on savings rate × 2)
10. **TopCategories** — Filterable category expense breakdown with localStorage-persisted exclusions

**Modals**: `TransactionModal` (edit existing transaction from RecentActivity)
**FAB**: Links to `/transactions` (desktop only)

---

### 2.2 Transactions (`/transactions`)

**Description**: Full transaction list with list/calendar view toggle, filtering, and CRUD.

**Hooks**: `useTransactions`, `useAccounts`, `useCreditCards`, `useCategories`

**State**:
- `viewMode`: `'LIST' | 'CALENDAR'`
- `currentMonth` (Date)
- `isModalOpen`, `editingTransaction`
- `selectedDate`, `isDayDetailsOpen`
- `quickEditTransaction`, `isQuickEditOpen`
- `showFilters`, `filterType` (ALL/EXPENSE/INCOME/TRANSFER/INVESTMENT/DEBT)
- `filterCategories[]`, `filterAccounts[]`

**Layout**:
1. **NativeHeader**
2. **View Toggle** — List / Calendar segmented control
3. **Filter Bar** — Horizontal scroll type filter chips + expandable filter drawer
4. **Content**:
   - List mode: `TransactionList` component (grouped by date, uses `TransactionCard`)
   - Calendar mode: `CalendarView` component (monthly calendar with day totals)
5. **Mobile FAB** (+) — Opens `TransactionModal` for new transaction

**Modals**:
- `TransactionModal` (create/edit)
- `DayDetailsModal` (calendar day drill-down, shows all transactions for selected date)
- `QuickEditModal` (inline category/amount edit)

**Data**: All transactions, accounts + credit cards (merged as `allAccounts`), categories

---

### 2.3 Accounts (`/accounts`)

**Description**: List of all bank accounts/wallets with CRUD actions.

**Hooks**: `useAccounts`
**Services**: `accountService.hasTransactions`

**State**: `isModalOpen`, `editingAccount`, `confirmModal` (title/message/onConfirm/isDangerous)

**Layout**:
1. **NativeHeader**
2. **Add Account** button
3. **Account cards** — Each shows: name, type badge, balance, currency
   - Action buttons: Edit, Archive, Delete
   - Delete blocked if account has transactions (shows warning)

**Modals**: `AccountModal` (create/edit), `ConfirmationModal` (archive/delete)
**Navigation**: Tap card → `/accounts/[id]`

---

### 2.4 Account Detail (`/accounts/[id]`)

**Description**: Account details with analytics and transaction history.

**Services**: `accountService.getById`, `transactionService.getAll`, `categoryService.getAll`

**State**: `account`, `transactions[]`, `categories[]`, `loading`

**Layout**:
1. **NativeHeader** with back button
2. **Account header** — Name, type, balance
3. **Monthly breakdown** — This month income/expense/investment/debt
4. **Charts**:
   - `AreaChart` — Balance/income/expense trend
   - `PieChart` — Expense category breakdown
   - `PieChartDetailsList` — Mobile-only list of pie segments
5. **Transaction list** — `TransactionCard` components filtered to this account

---

### 2.5 Finances (`/finances`)

**Description**: Financial overview — Available Balance, Cash, CC Debt, Loans.

**Hooks**: `useAuth`, `useAccounts`, `useLoans`, `useCreditCards`
**Financial Math**: `calculateTotalLiquidCash`, `calculateTotalCreditCardDebt`, `calculateAvailableBalance`, `calculateTotalLoanOutstanding`

**Layout**:
1. **NativeHeader** ("My Finances")
2. **Hero gradient card** — Available Balance (Cash - CC Debt)
3. **Grid**: Total Cash card + Credit Card Due card
4. **Bank Accounts section** — List of active accounts with balances
5. **Credit Cards section** — List with outstanding amounts
6. **Loans section** — List with outstanding principal

**Navigation**: Each section links deeper → `/accounts`, `/credit-cards`, `/loans`

---

### 2.6 Budgets List (`/budgets`)

**Description**: All budgets with progress tracking.

**Hooks**: `useBudgets`
**Services**: `transactionService.getAll`, `getHouseholdId`

**Derived Data**: `budgetsWithSpent` — Merges budget config with computed `totalSpent` from transaction filtering by category + date range.

**Layout**:
1. **NativeHeader**
2. **New Budget** button → `/budgets/create`
3. **Budget cards** — Each shows:
   - Name, mode badge (EVENT/RECURRING/CATEGORY)
   - Progress bar (spent / total)
   - Per-category breakdown (if CATEGORY mode)
   - Action menu: View detail, Edit, Delete, Archive

**Modals**: `ConfirmationModal` (delete/archive)
**Navigation**: `/budgets/[id]`, `/budgets/create`, `/budgets/edit/[id]`

---

### 2.7 Budget Create (`/budgets/create`)

**Description**: Create new budget with category limits.

**Hooks**: `useCategories`, `useBudgets`

**State**: `name`, `budgetMode` (RECURRING/EVENT), `status` (ACTIVE/PLANNING), `startDate`, `endDate`, `categoryLimits[]` ({ categoryId, amount })

**Layout**:
1. **Back button** + header
2. **Budget Details card** — Name input, mode toggle (RECURRING/EVENT), status selector, date pickers
3. **Category Limits card** — Dynamic rows:
   - Category dropdown + amount input + remove button per row
   - "Add Category Limit" button
4. **Total Budget** display (sum of all category limits)
5. **Create button**

---

### 2.8 Budget Detail (`/budgets/[id]`)

**Description**: Budget analytics with spending breakdown.

**Services**: `budgetService.getById`, `transactionService.getAll`, `categoryService.getAll`, `accountService.getAll`, `creditCardService.getAll`

**Layout**:
1. **NativeHeader** with back + edit buttons
2. **Budget overview** — Name, dates, total budget vs spent
3. **Per-category spending** — Progress bars per category
4. **Charts**: PieChart + BarChart for spending breakdown
5. **Transaction list** — Filtered to budget's categories and date range

**Navigation**: Edit button, Plan button (for EVENT budgets)

---

### 2.9 Budget Plan (`/budgets/[id]/plan`)

**Description**: Item-level planning for EVENT budgets.

**Services**: `budgetService.getById`, `budgetService.addPlanItem`, `budgetService.removePlanItem`

**Layout**:
1. **Back button** + header
2. **Plan items list** — Each item: name, unit amount × quantity = total
3. **Add item form** — Name, unit amount, quantity inputs
4. **Total planned amount** display

---

### 2.10 Credit Cards (`/credit-cards`)

**Description**: Credit card list with visual card displays.

**Hooks**: `useCreditCards`

**Layout**:
1. **NativeHeader**
2. **Add Card** button
3. **Credit card grid** — Each card shows:
   - Card name, bank name, last 4 digits
   - Gradient styling
   - Utilization bar (outstanding / limit)
   - Outstanding, available credit, limit amounts

**Modals**: `CreditCardModal` (create)
**Navigation**: Tap card → `/credit-cards/[id]`

---

### 2.11 Credit Card Detail (`/credit-cards/[id]`)

**Description**: Card details, payment recording, and transaction history.

**Hooks**: `useAccounts`
**Services**: `creditCardService.getById`, `transactionService.getByAccount`, `categoryService.getAll`

**State**: `card`, `transactions[]`, `categories[]`, `isPaymentOpen`, `isTransactionModalOpen`, `transactionInitialData`, `pendingPaymentUpdate`

**Layout**:
1. **NativeHeader** with back button
2. **Card details header** — Outstanding, limit, APR, billing cycle
3. **Make Payment** button
4. **Statement generation** button
5. **Transaction list** — Last 50 transactions for this card

**Modals**: `CreditCardPaymentModal`, `TransactionModal` (records payment as INCOME transaction)

---

### 2.12 Loans (`/loans`)

**Description**: Loan list with progress tracking.

**Hooks**: `useLoans`, `useAccounts`

**Layout**:
1. **NativeHeader**
2. **New Loan** button
3. **Loan cards** — Each shows:
   - Name, lender, type, status badge (ACTIVE/CLOSED)
   - Progress bar: principal paid percentage
   - Outstanding amount, interest rate, EMI amount

**Modals**: `LoanModal` (create)
**Navigation**: Tap card → `/loans/[id]`

---

### 2.13 Loan Detail (`/loans/[id]`)

**Description**: Loan details with EMI schedule, amortization charts, and payment actions.

**Hooks**: `useAccounts`
**Services**: `loanService.getById`

**State**: `loan`, `isPrepaymentOpen`, `processingEmi`, `paymentModalOpen`, `isTransactionModalOpen`, `transactionInitialData`, `pendingPaymentUpdate`

**Layout**:
1. **NativeHeader** with back button
2. **Loan details** — Outstanding, principal, rate, tenure, EMI amount, paid EMIs
3. **Payment actions** — Pay EMI button, Prepayment button
4. **EMI Schedule table** — Month-by-month principal/interest/balance
5. **Amortization charts** — PieChart (principal vs interest), BarChart (monthly breakdown)

**Modals**: `PrepaymentModal`, `LoanPaymentModal`, `TransactionModal` (records EMI as DEBT transaction)

---

### 2.14 Analytics (`/analytics`)

**Description**: Charts and financial analysis with drill-down.

**Hooks**: `useTransactions`, `useCategories`

**State**: `range` (MONTH/QUARTER/YEAR), `selectedCategoryIds[]`, `selectedDrilldownCategory`

**Layout**:
1. **NativeHeader**
2. **Range selector** — `NativeSegmentedControl` (Month/Quarter/Year)
3. **Category filter** — `MultiSelect` dropdown for category filtering
4. **Monthly trend BarChart** — Income/Expense/Investment/Debt by month
5. **Expense PieChart** — Category breakdown
6. **Drill-down view** — Sub-category breakdown when a category is selected
7. **Filtered transaction list**

**UI Components**: `NativeSegmentedControl`, `MultiSelect`

---

### 2.15 Recurring/Subscriptions (`/recurring`)

**Description**: Manage recurring payments and subscriptions.

**Services**: `recurringService.getAllActive`, `accountService.getAllActive`, `recurringService.processPayment`

**State**: `items[]`, `accounts[]`, `isModalOpen`, `editingItem`, `payModalOpen`, `itemToPay`, `selectedPayAccount`

**URL Params**: `?action=add` auto-opens create modal

**Layout**:
1. **NativeHeader**
2. **Add Subscription** button
3. **Recurring items list** — Sorted by nextDueDate:
   - Name, amount, frequency badge, next due date
   - Status colors: overdue (red), due soon (yellow), upcoming (normal)
   - Pay button per item
4. **Payment confirmation flow** — Select account → confirm → `processPayment()`

**Modals**: `RecurringModal` (create/edit)

---

### 2.16 Reports (`/reports`)

**Description**: Report generation hub.

**Hooks**: `useAuth`, `useReportExport`

**Layout**:
1. **NativeHeader**
2. **Feature card** — Explains report capabilities
3. **Quick Reports** — Pre-configured report buttons:
   - "This Month Expenses" (EXCEL format)
   - "Yearly Summary" (PDF format)
4. **Custom Report Builder** button → opens `ReportBuilderModal`

**Modals**: `ReportBuilderModal` — 11 report types, format picker (PDF/Excel), date presets, account/category multi-select filters

---

### 2.17 Settings (`/settings`)

**Description**: App configuration — sync, backup, updates.

**Hooks**: `useUser` (Clerk), `useServiceWorker`
**Imports**: `downloadBackup`, `readBackupFile`, `importBackup`

**Layout**:
1. **NativeHeader**
2. **Auto Update toggle** (web-only — skip in mobile)
3. **SyncStatusIndicator** — Current sync status with manual sync button + auto-sync toggle
4. **Backup section**:
   - Export JSON button (downloads full PouchDB backup)
   - Import JSON button (file picker → restore)
5. **Navigation links**: Manage Categories, Profile

---

### 2.18 Category Management (`/settings/categories`)

**Description**: CRUD for expense/income/investment/debt categories.

**Hooks**: `useAuth`, `useCategories`

**State**: `isModalOpen`, `editingCategory`, `filter` (ALL/EXPENSE/INCOME/INVESTMENT/DEBT)

**Layout**:
1. **NativeHeader**
2. **Add Category** button
3. **Segmented filter** bar (ALL/EXPENSE/INCOME/INVESTMENT/DEBT)
4. **Grouped category list**:
   - Expense categories
   - Income categories
   - Investment categories
   - Debt categories
5. **Each item**: Color dot, name, type badge, active/inactive toggle, edit button

**Modals**: `CategoryModal` (create/edit) — Name, type, color picker, sub-categories list

---

### 2.19 Household (`/household`)

**Description**: Household management — create, share, join.

**Hooks**: `useUser` (Clerk), `useToast`
**Services**: `householdService.getCurrent`, `householdService.create`, `sharedDataService.publishSnapshot`

**State**: `household`, `copied`, `joinCode`, `joining`, `publishing`, `role` (OWNER/GUEST)

**Layout**:
1. **NativeHeader**
2. **Household info card** — Name, invite code (with copy to clipboard)
3. **Members list** — Name, email, role badge, join date
4. **Join household** — Input field for invite code
5. **Publish data** button (owner only)
6. **Role toggle** — OWNER / GUEST (persisted in localStorage)

**Navigation**: "View Dashboard" → `/shared-dashboard`

---

### 2.20 Shared Dashboard (`/shared-dashboard`)

**Description**: Read-only view of shared household data (for guests).

**Hooks**: `useSharedView`

**State**: `selectedUser` (filter by household member)

**Layout**:
1. **Back link** → `/household`
2. **Header**: "Shared Dashboard", "Live Guest View" badge
3. **User filter chips** — Filter transactions by household member
4. **Stat cards** — Total Income, Total Expense for period
5. **Transaction list** — `TransactionCard` components (read-only)

---

### 2.21 Profile (`/profile`)

**Description**: User profile management.

**Hooks**: `useUser` (Clerk), `useClerk` (signOut), `useToast`

**State**: `name`, `budgetMode`, `salaryDay`, `isSaving`

**Layout**:
1. **NativeHeader**
2. **Avatar** — iOS-style with camera overlay (Clerk image URL)
3. **Name display** + edit form
4. **Budget Mode** selector
5. **Salary Day** picker
6. **Save** button
7. **Sign Out** button

---

### 2.22 Debug (`/debug`)

**Description**: System diagnostics — auth, DB, sync, environment checks.

**Hooks**: `useAuth`, `useSyncStatus`
**PouchDB**: Direct access to `accountsDB`, `transactionsDB`, etc. via `.info()`

**State**: `dbStatus` (CHECKING/OK/ERROR), `docCount` (per-collection), `envCheck` (env var presence)

**Layout**:
1. **"System Diagnostics"** header
2. **DB Status rows** — Each collection: name, doc count, OK/ERROR badge
3. **Sync status** — online/connected/syncing/error
4. **Environment checks** — Clerk key, CouchDB URL, Gemini key presence

---

## 3. Modal Specifications

All modals follow a consistent pattern:

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void | Promise<void>;
  initialData?: any;           // For edit mode
  editingItem?: any;           // Alternative naming for initialData
}
```

**Web styling**: Fixed overlay, `z-50`, backdrop blur, glass morphism panel, form with validation.
**Mobile equivalent**: React Navigation modal, `react-native-modal`, or Expo Router modal route.

### TransactionModal (579 lines)

**Fields**:
| Field | Type | Details |
|-------|------|---------|
| Type | Segmented control | EXPENSE / INCOME / TRANSFER / INVESTMENT / DEBT |
| Amount | Number input | Currency formatted |
| Description | Text input | Free text |
| Date | Date picker | Defaults to today |
| Category | Dropdown | Filtered by transaction type |
| Sub-Category | Dropdown | Conditional, based on parent category |
| Account | Dropdown | Active accounts + credit cards |
| Transfer To | Dropdown | Visible only for TRANSFER type |
| Split Toggle | Switch | Enables split transaction mode |
| Smart Add | Text input | Gemini AI natural language input |
| Event Budget | Dropdown | Link to active event budgets |

**Split mode**: Dynamic split rows with amount + category per split. Validates total matches main amount.

### AccountModal

**Fields**: Name (text), Type (dropdown: CHECKING/SAVINGS/CASH/BANK/INVESTMENT/WALLET/OTHER), Balance (number), Currency (text, default INR)

### CategoryModal

**Fields**: Name (text), Type (dropdown: EXPENSE/INCOME/INVESTMENT/DEBT), Color (color picker), Sub-categories (dynamic list: add/remove sub-category names)

### CreditCardModal

**Fields**: Name (text), Bank Name (text), Last 4 Digits (text), Credit Limit (number), Statement Day (number 1-31), Due Days (number), APR (number)

### LoanModal

**Fields**: Name (text), Lender (text), Type (dropdown: PERSONAL/HOME/CAR/EDUCATION/etc.), Principal (number), Interest Rate (number), Tenure Months (number), Start Date (date picker), Initial Paid EMIs (number), Linked Account (dropdown)
**Live Preview**: Real-time EMI calculation displayed as user types

### RecurringModal

**Fields**: Name (text), Amount (number), Type (dropdown: EXPENSE/INVESTMENT/DEBT/INCOME), Frequency (dropdown: MONTHLY/YEARLY/QUARTERLY/WEEKLY/DAILY), Start Date (date picker), Category (dropdown), Account (dropdown)

### CreditCardPaymentModal

**Fields**: Payment Amount (number), Source Account (dropdown)

### LoanPaymentModal

**Fields**: Payment Amount (number, pre-filled with EMI), Source Account (dropdown)

### PrepaymentModal

**Fields**: Prepayment Amount (number), Source Account (dropdown)

### ReportBuilderModal (469 lines)

**Fields**:
| Field | Type | Details |
|-------|------|---------|
| Report Type | Dropdown | 11 types (EXPENSE, INCOME, INVESTMENT, DEBT, ACCOUNT_SUMMARY, LOAN, CREDIT_CARD, BUDGET_VS_ACTUAL, TRIP_EVENT, YEARLY_SUMMARY, CONSOLIDATED) |
| Format | Toggle | PDF / Excel |
| Date Range | Date presets + custom | This Month, Last Month, This Quarter, This Year, Custom |
| Accounts | Multi-select | Filter by specific accounts |
| Categories | Multi-select | Filter by specific categories |

### ConfirmationModal

**Props**: title, message, onConfirm, isDangerous (changes button color to red)

### DayDetailsModal

**Props**: date, transactions for that day, categories, accounts
Shows all transactions for a specific calendar day.

### QuickEditModal

Inline edit for a single transaction — amount and category only.

---

## 4. Hook Usage Matrix

| Hook | Screens |
|------|---------|
| `useTransactions` | Dashboard, Transactions, Analytics |
| `useAccounts` | Dashboard, Transactions, Finances, Loans, Credit Cards [id], Loans [id] |
| `useCategories` | Dashboard, Transactions, Analytics, Settings/Categories, Budgets Create |
| `useCreditCards` | Dashboard, Transactions, Finances, Credit Cards |
| `useLoans` | Finances, Loans |
| `useBudgets` | Budgets, Budgets Create |
| `useAuth` | Dashboard, Settings/Categories, Debug |
| `useSyncStatus` | Navbar, Debug, Settings |
| `useSharedView` | Shared Dashboard |
| `useReportExport` | Reports |
| `useToast` | Household, Profile |

---

## 5. Modal Usage Matrix

| Modal | Screens Where Used |
|-------|--------------------|
| `TransactionModal` | Dashboard, Transactions, Credit Cards [id], Loans [id], QuickActionSheet |
| `AccountModal` | Accounts |
| `CreditCardModal` | Credit Cards |
| `CreditCardPaymentModal` | Credit Cards [id] |
| `LoanModal` | Loans |
| `LoanPaymentModal` | Loans [id] |
| `PrepaymentModal` | Loans [id] |
| `ConfirmationModal` | Accounts, Budgets |
| `CategoryModal` | Settings/Categories |
| `RecurringModal` | Recurring |
| `ReportBuilderModal` | Reports |
| `DayDetailsModal` | Transactions |
| `QuickEditModal` | Transactions |
| `QuickActionSheet` | Navbar (global) |
