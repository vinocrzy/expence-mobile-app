# Expense Mobile App — Business Logic Reference

> **Source Reference**: Expense-Web (`expence-web/frontend/lib/`)
> **Purpose**: Detailed business rules, formulas, and logic that MUST be replicated exactly in the mobile app.

---

## Table of Contents

1. [Transaction Business Logic](#1-transaction-business-logic)
2. [Account Balance Management](#2-account-balance-management)
3. [Credit Card Business Logic](#3-credit-card-business-logic)
4. [Loan Business Logic](#4-loan-business-logic)
5. [Budget Business Logic](#5-budget-business-logic)
6. [Recurring Transaction Logic](#6-recurring-transaction-logic)
7. [Analytics Engine](#7-analytics-engine)
8. [Financial Math Utilities](#8-financial-math-utilities)
9. [Insights Engine](#9-insights-engine)
10. [AI Integration (Gemini)](#10-ai-integration-gemini)
11. [Report Generation](#11-report-generation)
12. [Household & Shared Data](#12-household--shared-data)
13. [Backup & Encryption](#13-backup--encryption)
14. [Category Suggestion Logic](#14-category-suggestion-logic)

---

## 1. Transaction Business Logic

> **Source**: `lib/localdb-services.ts` — `transactionService`

### Transaction Types

| Type | Balance Effect on Source Account | Credit Card Effect |
|------|--------------------------------|-------------------|
| `INCOME` | **Adds** amount to account balance | **Reduces** outstanding |
| `EXPENSE` | **Subtracts** amount from account balance | **Increases** outstanding |
| `TRANSFER` | **Subtracts** from source, **Adds** to destination | N/A (uses accounts) |
| `INVESTMENT` | **Subtracts** amount from account balance | **Increases** outstanding |
| `DEBT` | **Subtracts** amount from account balance | **Increases** outstanding |

### Create Transaction Flow

```
1. Determine if accountId refers to an Account or a CreditCard:
   - Try accountsDB.get(accountId) first
   - If 404 → try creditcardsDB.get(accountId)

2. If Account found:
   - INCOME: balance = currentBalance + amount
   - EXPENSE/TRANSFER/INVESTMENT/DEBT: balance = currentBalance - amount
   - Save updated account with new balance

3. If CreditCard found:
   - EXPENSE/DEBT: outstanding = currentOutstanding + amount
   - INCOME (payment): outstanding = currentOutstanding - amount
   - Save updated credit card with new outstanding

4. If type === 'TRANSFER' && transferAccountId exists:
   - Get destination account
   - destinationBalance = currentBalance + amount  (always adds for destination)
   - Save updated destination account

5. Generate UUID for transaction ID
6. Attach householdId, userId, createdByName, userColor, timestamps
7. Save to PouchDB with _id = id
```

### Update Transaction Flow

```
1. Fetch old transaction from PouchDB

2. REVERT old transaction effects:
   a. If Account:
      - INCOME: balance = balance - oldAmount
      - EXPENSE/TRANSFER/INVESTMENT/DEBT: balance = balance + oldAmount
   b. If CreditCard:
      - INCOME: outstanding = outstanding + oldAmount
      - EXPENSE/DEBT: outstanding = outstanding - oldAmount
   c. If old type was TRANSFER with transferAccountId:
      - destinationBalance = destinationBalance - oldAmount (revert the add)

3. APPLY new transaction effects:
   a. If Account:
      - INCOME: balance = balance + newAmount
      - EXPENSE/TRANSFER/INVESTMENT/DEBT: balance = balance - newAmount
   b. If CreditCard:
      - EXPENSE/DEBT: outstanding = outstanding + newAmount
      - INCOME: outstanding = outstanding - newAmount
   c. If new type is TRANSFER with transferAccountId:
      - destinationBalance = destinationBalance + newAmount

4. Save updated transaction with new _rev
```

### Delete Transaction Flow

```
1. Fetch transaction from PouchDB
2. REVERT balance effects (same logic as update step 2)
3. If TRANSFER, revert destination account effect
4. Remove document from PouchDB
```

### Split Transactions

```typescript
// Validation: Sum of split amounts must equal total transaction amount (±0.01 tolerance)
if (isSplit && splits.length > 0) {
    const totalSplits = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplits - amount) > 0.01) {
        throw new Error('Split amount mismatch');
    }
}
// Then calls normal create() — balance effects use total amount, not individual splits
```

### Bulk Update

- Used for bulk category reassignment, description changes, date changes
- Does NOT update account balances (restricted to non-financial fields)
- Uses `PouchDB.bulkDocs()` for batch efficiency

---

## 2. Account Balance Management

> **Source**: `lib/localdb-services.ts` — `accountService`

### Balance Rules

- Balance is stored on the Account document itself (denormalized)
- Balance is **never recalculated from transactions** — it's updated incrementally
- Every transaction create/update/delete modifies the relevant account balance atomically (within same async call)

### Archive vs Delete

- **Archive**: Sets `isArchived: true` — account still exists, excluded from active lists
- **Delete**: Removes document entirely
- Check `hasTransactions(accountId)` before allowing delete (returns `true` if any transaction references this account)

### Total Balance Calculation

```typescript
async calculateTotalBalance(householdId: string): Promise<number> {
    const accounts = await this.getAllActive(householdId); // Excludes archived
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
}
```

---

## 3. Credit Card Business Logic

> **Source**: `lib/localdb-services.ts` — `creditCardService`

### Statement Generation

```
Input: creditCardId

1. Get card from PouchDB
2. Determine billing cycle:
   - billingDay = card.billingCycle || 1
   - cycleEnd = last occurrence of (billingDay - 1) (may be previous month if today < billingDay)
   - cycleStart = cycleEnd - 1 month, set to billingDay

3. Filter transactions for this card in date range [cycleStart, cycleEnd]

4. Calculate:
   - expenses = sum of EXPENSE type transactions in cycle
   - payments = sum of INCOME type transactions in cycle (payments received)
   - previousBalance = last statement's closingBalance (or 0 if first statement)
   - closingBalance = previousBalance + expenses - payments
   - minimumDue = closingBalance * 0.05  (5% of closing balance)
   - dueDate = cycleEnd + 20 days (20-day grace period)

5. Check for duplicate statement (same cycleEnd date) → skip if exists
6. Prepend new statement to card.statements array
7. Set status: closingBalance <= 0 ? 'PAID' : 'UNPAID'
8. Save updated card
```

### Record Payment

```typescript
async recordPayment(id: string, amount: number): Promise<void> {
    const card = await this.getById(id);
    const updatedOutstanding = (card.currentOutstanding || 0) - amount;
    await this.update(id, { currentOutstanding: Math.max(0, updatedOutstanding) });
}
```

### Outstanding Tracking

- `currentOutstanding` is updated in real-time as transactions are created/deleted
- EXPENSE/DEBT transactions → **increase** outstanding
- INCOME transactions (payments) → **decrease** outstanding
- This is handled in `transactionService.create()`, not in `creditCardService`

---

## 4. Loan Business Logic

> **Source**: `lib/localdb-services.ts` — `loanService`

### EMI Calculation Formula

Standard Equated Monthly Installment:

$$EMI = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$$

Where:
- $P$ = Principal amount
- $r$ = Monthly interest rate = `annualRate / 12 / 100`
- $n$ = Tenure in months

```typescript
calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / tenureMonths; // Zero interest edge case
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
}
```

### Loan Creation with Initial Paid EMIs

When creating a loan with `initialPaidEmis` (for tracking an existing loan):

```typescript
// Calculate how much principal has been paid in prior EMIs
let balance = principal;
const r = interestRate / 12 / 100;

for (let i = 0; i < initialPaidEmis; i++) {
    const interest = balance * r;
    const principalComponent = emiAmount - interest;
    balance -= principalComponent;
}
outstandingPrincipal = Math.max(0, Math.round(balance * 100) / 100);
```

### Record Loan Payment

```typescript
async recordPayment(id: string, amount: number): Promise<void> {
    const loan = await this.getById(id);
    const updatedOutstanding = (loan.outstandingPrincipal || 0) - amount;
    const newStatus = updatedOutstanding <= 0 ? 'CLOSED' : loan.status || 'ACTIVE';
    const normalizedPaidEmis = (loan.paidEmis || 0) + 1;

    await this.update(id, {
        outstandingPrincipal: Math.max(0, updatedOutstanding),
        paidEmis: normalizedPaidEmis,
        status: newStatus      // Auto-close when fully paid
    });
}
```

### Amortization Schedule

> **Source**: `lib/analytics.ts` — `calculateAmortizationSchedule()`

```typescript
interface AmortizationEntry {
    month: number;
    emiAmount: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
}

// For each month:
interestPaid = remainingBalance * monthlyRate;
principalPaid = emi - interestPaid;
remainingBalance -= principalPaid;
```

---

## 5. Budget Business Logic

> **Source**: `lib/localdb-services.ts` — `budgetService`

### Budget Modes

| Mode | Description | Key Fields |
|------|-------------|------------|
| `EVENT` | One-time budgets (wedding, vacation) | `startDate`, `endDate`, `totalBudget`, `planItems` |
| `RECURRING` | Monthly/periodic budgets | `period`, `categoryId`, `totalBudget` |
| `CATEGORY` | Per-category spending limits | `budgetLimitConfig[]` with `{ categoryId, amount }` |

### Budget Status Values

- `PLANNING` — Draft mode, not yet active
- `ACTIVE` — Currently being tracked
- `COMPLETED` — Budget period has ended

### Plan Items (Event Budgets)

```typescript
// Adding a plan item
async addPlanItem(budgetId: string, item: { name, unitAmount, quantity, totalAmount }) {
    const newItem = { ...item, id: generateId() };
    // Append to existing planItems array
    await update(budgetId, { planItems: [...existing, newItem] });
}

// Removing a plan item
async removePlanItem(budgetId: string, itemId: string) {
    const filtered = planItems.filter(i => i.id !== itemId);
    await update(budgetId, { planItems: filtered });
}
```

### Budget Utilization

```typescript
function calculateBudgetUtilization(spent: number, limit: number): number {
    if (limit === 0) return 0;
    return (spent / limit) * 100;
}

// Status determination (used in UI):
// < 75%  → ON_TRACK (green)
// 75-100% → WARNING (yellow)
// > 100% → OVER_BUDGET (red)
```

---

## 6. Recurring Transaction Logic

> **Source**: `lib/localdb-services.ts` — `recurringService`

### Process Payment Flow

```
1. Get recurring item from PouchDB
2. Create actual transaction via transactionService.create():
   - amount: recurring.amount
   - type: recurring.type
   - description: "Recurring: {recurring.name}"
   - date: actualDate (defaults to now)
   - categoryId: recurring.categoryId
   - accountId: selected or recurring.accountId

3. Advance nextDueDate based on frequency:
   - MONTHLY:    nextDueDate.setMonth(+1)
   - QUARTERLY:  nextDueDate.setMonth(+3)
   - YEARLY:     nextDueDate.setFullYear(+1)
   - WEEKLY:     nextDueDate.setDate(+7)
   - DAILY:      nextDueDate.setDate(+1)

4. Update recurring item with:
   - lastPaidDate = actualDate
   - nextDueDate = calculated next date
```

### Upcoming Items Query

```typescript
async getUpcoming(householdId: string, days: number = 30): Promise<RecurringTransaction[]> {
    // Fetch all active recurring items
    // Filter: nextDueDate >= now AND nextDueDate <= now + days
    // Sort: ascending by nextDueDate
}
```

---

## 7. Analytics Engine

> **Source**: `lib/analytics.ts` (515 lines)

### Monthly Stats

```typescript
interface MonthlyStats {
    month: string;    // 'YYYY-MM' format
    income: number;
    expense: number;
    investment: number;
    debt: number;
    net: number;      // income - expense (investments/debt excluded from net)
}
```

Groups transactions by month, sums by type. Net = Income - Expense only.

### Category Breakdown

```typescript
interface CategoryBreakdown {
    categoryId: string;
    categoryName: string;
    color?: string;
    amount: number;
    percentage: number;        // (amount / total) * 100
    transactionCount: number;
}
```

**Special handling for split transactions:**
- When `isSplit === true`, each split is counted individually by its `categoryId`
- Each split contributes its own `amount` to the category total

**Category exclusion for EXPENSE breakdown:**
- Categories with type `INVESTMENT` or `DEBT` are excluded from the expense category breakdown
- This prevents investment/debt transactions (which are typed as EXPENSE in legacy data) from polluting expense analytics

### Sub-Category Breakdown

Drills down within a specific parent category:
- Filters transactions by `categoryId` or splits with matching `categoryId`
- Groups by `subCategoryId`
- Inherits parent category color

### Trends (Daily/Weekly)

```typescript
interface TrendData {
    date: string;        // 'YYYY-MM-DD' for daily, week-start for weekly
    income: number;
    expense: number;
    investment: number;
    debt: number;
}
```

### Savings Rate

$$\text{Savings Rate} = \frac{\text{Income} - \text{Expense}}{\text{Income}} \times 100$$

Returns 0 if income is 0.

### Cash Flow Summary

```typescript
interface CashFlowSummary {
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;       // income - expense
    savingsRate: number;       // percentage
    averageDailyIncome: number;  // income / days in period
    averageDailyExpense: number; // expense / days in period
}
```

### Top Spending Categories

Returns top N categories from expense breakdown, sorted by amount descending.

### Net Worth

```
NetWorth = totalAccountBalance + totalInvestments
```

Where `totalInvestments` = sum of all INVESTMENT type transactions (all-time).

---

## 8. Financial Math Utilities

> **Source**: `lib/financial-math.ts`

Pure functions for dashboard calculations:

| Function | Formula |
|----------|---------|
| `calculateTotalLiquidCash(accounts)` | Sum of all non-archived account balances |
| `calculateTotalCreditCardDebt(cards)` | Sum of all `currentOutstanding` |
| `calculateAvailableBalance(accounts, cards)` | Liquid Cash - CC Debt |
| `calculateTotalLoanOutstanding(loans)` | Sum of all `outstandingPrincipal` |
| `calculateNetWorth(accounts, cards, loans, investments)` | (Cash + Investments) - (CC Debt + Loans) |
| `calculateTransactionTotal(transactions, type)` | Filter by type → sum amounts |
| `calculateBudgetUtilization(spent, limit)` | `(spent / limit) * 100`, returns 0 if limit is 0 |

### Additional Financial Formulas

> **Source**: `lib/analytics.ts`

**Credit Card Monthly Interest:**
$$\text{Interest} = \text{Outstanding} \times \frac{\text{APR}}{365 \times 100} \times \text{Days}$$

**Compound Interest:**
$$A = P \times \left(1 + \frac{r}{n}\right)^{n \times t}$$

Where $r$ = annual rate / 100, $n$ = compounding frequency (default: 12), $t$ = years.

---

## 9. Insights Engine

### V2 Engine (Active — Used by API)

> **Source**: `lib/insights/` (7 files)

```typescript
interface Insight {
    id: string;
    type: 'WARNING' | 'TIP' | 'ACHIEVEMENT' | 'OBSERVATION';
    title: string;
    message: string;
    score: number;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface InsightResponse {
    insights: Insight[];
    summary: InsightSummary;
}
```

**Analysis Modules:**

| Module | File | Analysis |
|--------|------|----------|
| Anomaly Detection | `insights/anomalies.ts` | Flags expenses > 5× category average |
| Cashflow Projection | `insights/cashflow.ts` | Burn rate projection, month-end balance estimate, SAFE/WARNING/CRITICAL status |
| Lifestyle Analysis | `insights/lifestyle.ts` | Weekend vs weekday spending surge detection |
| Savings Analysis | `insights/savings.ts` | Month-over-month savings rate trends, achievements when improving |

**Utility Functions** (`insights/utils.ts`):
- `calculateMonthlyAverage(transactions)` — Average monthly spending
- `getDistinctCategories(transactions)` — Unique categories used
- `groupByMonth(transactions)` — Group transactions by YYYY-MM

**Entry Point** (`insights/index.ts`):
```typescript
export function generateInsights(transactions, categories): InsightResponse {
    // 1. Build AnalysisContext from transactions + categories
    // 2. Run all 4 analysis modules
    // 3. Combine, rank by priority + score
    // 4. Return top insights + summary
}
```

### V1 Engine (Legacy)

> **Source**: `lib/insights-logic.ts`

Standalone function with inline analysis:
- Weekend vs weekday spending comparison
- Spending spike detection (> 4× daily average)
- Subscription/recurring pattern detection
- Lifestyle habit check (food/shopping keyword frequency)
- Savings rate trend analysis
- Debt payoff projection
- Burn rate projection with month-end estimate

---

## 10. AI Integration (Gemini)

> **Source**: `app/actions/gemini-transaction.ts` (Server Action in web — API call in mobile)

### Purpose

Parse natural language text into structured transaction data.

### Models (Tried in Order)

1. `gemini-1.5-flash` (fastest)
2. `gemini-1.5-pro` (fallback)
3. `gemini-pro` (final fallback)

### Input

```typescript
interface ParseInput {
    text: string;        // "Spent 500 on groceries at DMart"
    context: {
        categories: string[];   // Available category names
        accounts: string[];     // Available account names
    };
}
```

### Output

```typescript
interface ParseResult {
    amount: number;
    date: string;             // ISO string (defaults to today if not specified)
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT' | 'DEBT';
    categoryName?: string;    // Matched from context.categories
    accountName?: string;     // Matched from context.accounts
    splits?: {
        amount: number;
        categoryName: string;
        note?: string;
    }[];
}
```

### Split Transaction Parsing

Handles inputs like: "500 total, 200 for food, 300 for fuel"

### Mobile Adaptation

- Cannot use Next.js server actions in React Native
- Call Gemini API directly from the mobile app (API key stored securely)
- Or proxy through a lightweight API endpoint
- `isGeminiConfigured()` checks if API key is set

---

## 11. Report Generation

> **Source**: `lib/reports/` (5 files)

### Report Types (11)

| Report Type | Description |
|------------|-------------|
| `EXPENSE` | All expense transactions with category breakdown |
| `INCOME` | All income transactions with source breakdown |
| `INVESTMENT` | Investment transaction summary |
| `DEBT` | Debt payment tracking |
| `ACCOUNT_SUMMARY` | Account balances and transaction counts |
| `LOAN` | Loan status, EMI schedule, payments |
| `CREDIT_CARD` | Credit card statements and payment history |
| `BUDGET_VS_ACTUAL` | Budget targets vs actual spending |
| `TRIP_EVENT` | Event budget expense breakdown |
| `YEARLY_SUMMARY` | 12-month consolidated report |
| `CONSOLIDATED` | Everything combined |

### Export Formats

- **PDF**: `jspdf` + `jspdf-autotable`
- **Excel**: `exceljs`

### Data Pipeline

```
User Selection → exportReport(type, format, filters)
  → reportDataFetcher.fetchReportData(type, filters)
      → Queries PouchDB services
      → Resolves category/account names from IDs
      → Handles split transactions (expands into individual rows)
      → Builds summary sections (totals, averages)
      → Builds category breakdown with percentages
  → pdfGenerator.generatePDF(data) | excelGenerator.generateExcel(data)
      → Creates binary file
  → Browser download via Blob URL / Web Share API
```

### Report Filters

```typescript
interface ReportFilters {
    startDate: Date;
    endDate: Date;
    accountIds?: string[];    // Filter by specific accounts
    categoryIds?: string[];   // Filter by specific categories
    format: 'PDF' | 'EXCEL';
}
```

### PDF Generation Details

- Custom header: colored bar, title, date range, generation timestamp
- Manual pie chart rendering (sector drawing with trigonometry)
- `jspdf-autotable` for data tables
- Category breakdown table with color indicators

### Excel Generation Details

- Styled header row: purple background, white bold text
- Summary section before data
- Category breakdown sheet
- Auto-fit column widths

### Mobile Adaptation

- **PDF**: Use `expo-print` or `react-native-html-to-pdf`
- **Excel**: `exceljs` works in RN with `react-native-fs` for file writing
- **Sharing**: Use `expo-sharing` instead of browser download
- **File Storage**: Use `expo-file-system` for temp file management

---

## 12. Household & Shared Data

> **Source**: `lib/localdb-services.ts` — `householdService`, `sharedDataService`

### Household Creation

```typescript
// Household metadata is stored in accountsDB with _id = 'household_metadata'
{
    id: householdId,
    name: "Family Name",
    ownerId: owner.id,
    inviteCode: 'INV-' + uuid().substring(0, 8).toUpperCase(),
    members: [{ userId, name, email, role: 'OWNER', joinedAt }],
    _id: 'household_metadata'
}
```

### Shared Data Publishing (Owner)

The owner periodically publishes a snapshot of current month's data to `sharedDB`:

```
1. Get current month date range
2. Fetch: transactions, active accounts, active credit cards, categories
3. Clear all existing docs in sharedDB (fetch all → bulk delete)
4. Transform and insert new docs with docType prefix:
   - Transactions → _id: 'tx_{id}', docType: 'TRANSACTION'
   - Account balances → _id: 'bal_{id}', docType: 'BALANCE'
   - Credit cards → _id: 'bal_{id}', docType: 'BALANCE' (negative balance for liability)
5. Category names and account names are resolved and stored in shared docs
```

### Shared Data Reading (Guest)

```typescript
getSharedTransactions(): // Query sharedDB where docType === 'TRANSACTION'
getSharedBalances():     // Query sharedDB where docType === 'BALANCE'
```

### Auto-Publishing via Hook

> **Source**: `hooks/useHouseholdPublisher.ts`

When `role === 'OWNER'`, the hook listens to PouchDB change events on all databases and auto-publishes snapshots when data changes.

---

## 13. Backup & Encryption

> **Source**: `lib/backup.ts`, `lib/encryption.ts`

### Backup

- Export all PouchDB databases to JSON
- Import JSON to restore data
- Client-side only (no server involved)

### Encryption

- Client-side encryption utilities for sensitive data
- Used for backup file encryption before export

### Mobile Adaptation

- Use `expo-file-system` for backup file storage
- Use `expo-sharing` for backup export
- Use `expo-document-picker` for backup import
- Encryption utilities can be reused as-is

---

## 14. Category Suggestion Logic

> **Source**: `app/api/suggest-category/route.ts`

Keyword-based category matching (no AI required):

```typescript
// Keyword → Category mapping
const keywords = {
    'Transport': ['uber', 'ola', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'parking'],
    'Groceries': ['grocery', 'vegetables', 'fruits', 'milk', 'bread', 'rice', 'dmart', 'bigbasket'],
    'Food': ['restaurant', 'cafe', 'zomato', 'swiggy', 'food', 'lunch', 'dinner', 'breakfast'],
    'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'amazon prime', 'hotstar'],
    // ... extensive keyword list
};

// Logic: Match description keywords against category keywords
// Returns best matching category name
```

### Mobile Adaptation

- Implement as a local utility function (no API needed)
- Same keyword map, same matching logic
- Can run entirely offline
