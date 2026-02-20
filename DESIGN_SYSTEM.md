# Expense Mobile App — Design System

> **Source Reference**: Expense-Web (`expence-web/frontend/`)
> **Purpose**: Complete visual design reference for React Native implementation.

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Component Patterns](#3-component-patterns)
4. [Animation Presets](#4-animation-presets)
5. [Glass Morphism](#5-glass-morphism)
6. [Loading States](#6-loading-states)
7. [Currency Formatting](#7-currency-formatting)
8. [Safe Area & PWA Patterns](#8-safe-area--pwa-patterns)
9. [Icon System](#9-icon-system)
10. [Chart Styling](#10-chart-styling)

---

## 1. Color System

### Base Theme: **Dark-First**

The entire app uses a dark theme inspired by iOS dark mode.

| Token | Web Value | Usage | RN Equivalent |
|-------|-----------|-------|---------------|
| `--background` | `#000000` | App background | `'#000000'` |
| `--foreground` | `#ededed` | Primary text | `'#ededed'` |
| Surface | `#1c1c1e` | Card backgrounds (iOS dark) | `'#1c1c1e'` |
| Surface/80 | `rgba(28,28,30,0.8)` | Glass panels | `'rgba(28,28,30,0.8)'` |
| Border | `rgba(255,255,255,0.05)` | Subtle borders | `'rgba(255,255,255,0.05)'` |
| Muted text | `text-gray-400` | Secondary text | `'#9ca3af'` |
| Dimmed text | `text-gray-500` | Tertiary text | `'#6b7280'` |

### Transaction Type Colors

| Type | Text Color | Background | Icon |
|------|-----------|------------|------|
| INCOME | `text-emerald-400` (#34d399) | `bg-emerald-500/10` | `ArrowDownLeft` |
| EXPENSE | `text-rose-400` (#fb7185) | `bg-rose-500/10` | `ArrowUpRight` |
| TRANSFER | `text-blue-400` (#60a5fa) | `bg-blue-500/10` | `ArrowLeftRight` |
| INVESTMENT | `text-amber-400` (#fbbf24) | `bg-amber-500/10` | `TrendingUp` |
| DEBT | `text-purple-400` (#c084fc) | `bg-purple-500/10` | `Receipt` |

### React Native Color Map

```typescript
export const COLORS = {
  background: '#000000',
  foreground: '#ededed',
  surface: '#1c1c1e',
  surfaceAlpha: 'rgba(28,28,30,0.8)',
  border: 'rgba(255,255,255,0.05)',
  borderLight: 'rgba(255,255,255,0.1)',
  
  // Text
  textPrimary: '#ededed',
  textSecondary: '#9ca3af',  // gray-400
  textTertiary: '#6b7280',   // gray-500
  textMuted: '#4b5563',      // gray-600
  
  // Transaction types
  income: '#34d399',          // emerald-400
  incomeBg: 'rgba(16,185,129,0.1)',
  expense: '#fb7185',         // rose-400
  expenseBg: 'rgba(244,63,94,0.1)',
  transfer: '#60a5fa',        // blue-400
  transferBg: 'rgba(59,130,246,0.1)',
  investment: '#fbbf24',      // amber-400
  investmentBg: 'rgba(245,158,11,0.1)',
  debt: '#c084fc',            // purple-400
  debtBg: 'rgba(168,85,247,0.1)',
  
  // Accent gradients
  heroGradientStart: '#2563eb',   // blue-600
  heroGradientEnd: '#9333ea',     // purple-600
  
  // Status
  success: '#22c55e',         // green-500
  warning: '#f59e0b',         // amber-500
  error: '#ef4444',           // red-500
  info: '#3b82f6',            // blue-500
  
  // Budget utilization
  budgetOnTrack: '#22c55e',
  budgetWarning: '#f59e0b',
  budgetOver: '#ef4444',
  
  // Financial health gauge
  healthExcellent: '#22c55e',
  healthHealthy: '#84cc16',
  healthFair: '#f59e0b',
  healthPoor: '#ef4444',
};
```

### Gradient Patterns

| Pattern | Web Classes | Usage |
|---------|------------|-------|
| Hero card | `bg-gradient-to-br from-blue-600 to-purple-600` | Available Balance, main stats |
| Income gradient | `bg-gradient-to-r from-emerald-500/20 to-emerald-600/10` | Income stat card |
| Expense gradient | `bg-gradient-to-r from-rose-500/20 to-rose-600/10` | Expense stat card |
| Credit card | Various gradients per bank | Card display in credit-cards page |

**Mobile implementation**: Use `expo-linear-gradient` or `react-native-linear-gradient` for gradient backgrounds.

---

## 2. Typography

### Font Family

| Web | Mobile Recommendation |
|-----|----------------------|
| Geist Sans (variable, `--font-geist-sans`) | System font (San Francisco on iOS, Roboto on Android) or `expo-font` with Inter |
| Geist Mono (variable, `--font-geist-mono`) | System monospace or `SpaceMono` |

### Font Sizes (Tailwind → RN)

| Tailwind | Size | RN fontSize | Usage |
|----------|------|------------|-------|
| `text-xs` | 12px | 12 | Badges, timestamps |
| `text-sm` | 14px | 14 | Secondary text, labels |
| `text-base` | 16px | 16 | Body text |
| `text-lg` | 18px | 18 | Section headers |
| `text-xl` | 20px | 20 | Card titles |
| `text-2xl` | 24px | 24 | Page headers |
| `text-3xl` | 30px | 30 | Large amounts |
| `text-4xl` | 36px | 36 | Hero stat (Available Balance) |

### Font Weights

| Tailwind | Weight | RN fontWeight |
|----------|--------|---------------|
| `font-normal` | 400 | `'400'` |
| `font-medium` | 500 | `'500'` |
| `font-semibold` | 600 | `'600'` |
| `font-bold` | 700 | `'700'` |

---

## 3. Component Patterns

### Card Pattern

```
Web: bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6
```

```typescript
// React Native equivalent
const cardStyle = {
  backgroundColor: 'rgba(28,28,30,0.8)',
  borderRadius: 24,     // rounded-3xl ≈ 24
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.05)',
  padding: 24,
};
```

### Button Patterns

| Variant | Web Classes | Usage |
|---------|------------|-------|
| Primary | `bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2` | Main actions |
| Danger | `bg-red-600 hover:bg-red-700 text-white rounded-xl` | Delete actions |
| Ghost | `bg-white/5 text-white rounded-xl` | Secondary actions |
| Outline | `border border-white/10 text-gray-400 rounded-xl` | Tertiary actions |
| FAB | `w-14 h-14 rounded-full bg-blue-600 shadow-lg` | Floating action button |

### Input Pattern

```
Web: bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
     placeholder:text-gray-500 focus:border-blue-500
```

```typescript
// React Native equivalent
const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: '#ffffff',
  fontSize: 16,
};
```

### Badge Pattern

```
Small colored pill: px-2 py-0.5 rounded-full text-xs font-medium
  INCOME:     bg-emerald-500/20 text-emerald-400
  EXPENSE:    bg-rose-500/20 text-rose-400
  TRANSFER:   bg-blue-500/20 text-blue-400
  INVESTMENT: bg-amber-500/20 text-amber-400
  DEBT:       bg-purple-500/20 text-purple-400
  ACTIVE:     bg-green-500/20 text-green-400
  CLOSED:     bg-gray-500/20 text-gray-400
```

### Progress Bar Pattern

```
Container: h-2 bg-white/5 rounded-full overflow-hidden
Fill:      h-full rounded-full transition-all
  < 75%:   bg-emerald-500
  75-100%: bg-amber-500
  > 100%:  bg-rose-500
```

### Transaction Card Component

Each transaction card shows:
- Left: Type icon (colored circle background + icon)
- Center: Description (bold), Category name (muted), Date (small, gray)
- Right: Amount (type-colored), Account name (small)
- Expandable: Split details (if `isSplit`)

### Stats Row (Horizontal Scroll)

- Horizontal `ScrollView` with snap-to-card behavior
- First card: Hero gradient (Available Balance) — larger
- Subsequent cards: Income, Expense, Savings Rate — standard size
- Card height: ~120px, width: ~160px (or ~280px for hero)

### Bottom Sheet / Action Sheet

Used for QuickActionSheet, mobile menu:
- Spring animation from bottom (`y: '100%'` → `y: 0`)
- Drag-to-dismiss gesture
- Backdrop overlay with blur
- Handle bar at top

**Mobile**: Use `@gorhom/bottom-sheet` or `react-native-modal`

---

## 4. Animation Presets

> **Source**: `lib/motion.ts`

### Framer Motion → Reanimated Mapping

| Preset | Web (Framer Motion) | Mobile (Reanimated) |
|--------|---------------------|---------------------|
| `fadeInUp` | `{ opacity: 0→1, y: 10→0 }` | `FadeInUp.duration(300)` |
| `fadeIn` | `{ opacity: 0→1 }` | `FadeIn.duration(300)` |
| `scaleIn` | `{ opacity: 0→1, scale: 0.95→1 }` | `FadeIn.duration(300).withInitialValues({ transform: [{ scale: 0.95 }] })` |
| `slideUpSheet` | `{ y: '100%'→0 }` | `SlideInDown` or `translateY` spring animation |
| `staggerContainer` | `staggerChildren: 0.05` | Use `entering` prop with delay per item index |

### Web Animation Config

```typescript
// Easing (iOS-like)
const EASE = [0.25, 0.1, 0.25, 1.0]; // Cubic bezier

// Standard transition
const TRANSITION = { ease: EASE, duration: 0.3 };

// Spring transition
const SPRING_TRANSITION = { type: 'spring', stiffness: 300, damping: 30 };

// Variants
const fadeInUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
};

const slideUpSheet = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
};

const staggerContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.05 } },
};
```

### Mobile Animation Approach

```typescript
// react-native-reanimated v3
import Animated, { 
    FadeInUp, FadeIn, SlideInDown,
    withSpring, withTiming, useSharedValue, 
    useAnimatedStyle 
} from 'react-native-reanimated';

// List item stagger
const entering = FadeInUp.delay(index * 50).duration(300);

// Sheet animation  
const slideUp = SlideInDown.springify().damping(25).stiffness(300);

// Amount animation (AnimatedAmount component)
// Use withTiming or withSpring for number transitions
```

### Haptic Feedback

```
Web: navigator.vibrate(10)
Mobile: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
```

Used on: tab switches, quick action selection, segmented control changes.

---

## 5. Glass Morphism

### Web Pattern

```css
.glass-panel {
    background: rgba(28, 28, 30, 0.8);  /* #1c1c1e at 80% */
    backdrop-filter: blur(24px);          /* backdrop-blur-xl */
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Mobile Equivalent

React Native doesn't support `backdrop-filter` natively. Options:
1. **`expo-blur`** — `BlurView` component for true blur effects
2. **Semi-transparent background** — Just use `rgba(28,28,30,0.95)` without blur (simpler, more performant)
3. **`@react-native-community/blur`** — Alternative blur library

```typescript
// Option 1: expo-blur
import { BlurView } from 'expo-blur';
<BlurView intensity={80} tint="dark" style={styles.glassPanel}>
    {children}
</BlurView>

// Option 2: Simple semi-transparent (recommended for performance)
const glassPanel = {
    backgroundColor: 'rgba(28,28,30,0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
};
```

---

## 6. Loading States

### Skeleton Pattern

Every page implements skeleton loading with animated placeholders matching the final layout shape.

```
Web: animate-pulse bg-white/5 rounded-xl
```

```typescript
// React Native skeleton
const skeletonStyle = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
};
// Use react-native-reanimated for pulse animation:
// opacity oscillating between 0.3 and 1.0
```

### Loading Screen (Full-Screen Splash)

```
Centered layout:
  - Gradient logo icon (Wallet icon)
  - "PocketTogether" branding text
  - Spinner (Loader2 icon, rotating)
  - Dark background (#000000)
```

### AnimatedAmount Component

Smooth number transitions when amounts change:
- Spring-based animation
- Uses Framer Motion `useSpring` in web
- Mobile: Use `react-native-reanimated` `withSpring` or `withTiming`

---

## 7. Currency Formatting

### Default: INR (Indian Rupees)

```typescript
function formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
// Output: ₹1,00,000 (Indian number system: lac, crore grouping)
```

### Percentage Formatting

```typescript
function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}
```

### Mobile Note

`Intl.NumberFormat` works in React Native (Hermes engine supports it). If using older JSC, may need `intl` polyfill.

---

## 8. Safe Area & PWA Patterns

### Web Safe Area (for reference)

```css
:root {
    --safe-area-inset-top: env(safe-area-inset-top, 0px);
    --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

.pt-safe { padding-top: var(--safe-area-inset-top); }
.pb-safe { padding-bottom: var(--safe-area-inset-bottom); }
```

### Mobile Safe Area

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
// or
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

### PWA Native Feel (Web — skip these in mobile)

```css
/* These are NOT needed in React Native */
-webkit-user-select: none;          /* RN handles this natively */
-webkit-tap-highlight-color: transparent;
-webkit-touch-callout: none;
touch-action: manipulation;
overscroll-behavior-y: none;        /* RN handles this natively */
```

---

## 9. Icon System

### Web: Lucide React

```typescript
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, TrendingUp, Receipt } from 'lucide-react';
```

### Mobile Options

1. **`lucide-react-native`** — Same icons, same API (recommended for consistency)
2. **`@expo/vector-icons`** — Includes Ionicons, MaterialIcons, etc.

### Transaction Type Icons

| Type | Icon Name | Lucide Component |
|------|-----------|-----------------|
| INCOME | `ArrowDownLeft` | Arrow pointing down-left (money coming in) |
| EXPENSE | `ArrowUpRight` | Arrow pointing up-right (money going out) |
| TRANSFER | `ArrowLeftRight` | Bidirectional arrow |
| INVESTMENT | `TrendingUp` | Upward trend line |
| DEBT | `Receipt` | Receipt document |

### Common Icons Used

| Context | Icon |
|---------|------|
| Dashboard | `House` |
| Wallet/Finances | `Wallet` |
| Budgets | `PieChart` |
| Settings | `Settings` |
| Profile | `User` |
| Add | `Plus`, `PlusCircle` |
| Back | `ChevronLeft`, `ArrowLeft` |
| Menu | `Menu`, `MoreVertical` |
| Search | `Search` |
| Filter | `Filter`, `SlidersHorizontal` |
| Calendar | `Calendar` |
| Edit | `Pencil`, `Edit2` |
| Delete | `Trash2` |
| Archive | `Archive` |
| Copy | `Copy` |
| Share | `Share2` |
| Download | `Download` |
| Close | `X` |
| Check | `Check` |
| Bell | `Bell` |
| Sync | `RefreshCw` |

---

## 10. Chart Styling

### Web: Recharts

Charts use dark theme with subtle grid lines:

```typescript
// Common chart config
{
    background: 'transparent',
    gridStroke: 'rgba(255,255,255,0.05)',
    axisTextColor: '#6b7280',     // gray-500
    tooltipBg: '#1c1c1e',
    tooltipBorder: 'rgba(255,255,255,0.1)',
}
```

### Chart Types Used

| Chart | Library | Where Used |
|-------|---------|------------|
| BarChart | Recharts | Dashboard (CashFlowChart), Analytics, Budget Detail |
| PieChart | Recharts | Analytics, Account Detail, Budget Detail, Loan Detail |
| AreaChart | Recharts | Account Detail (balance trend) |

### Mobile Chart Libraries

| Web (Recharts) | Mobile Alternative |
|----------------|-------------------|
| `BarChart` | `victory-native` BarChart or `react-native-chart-kit` |
| `PieChart` | `victory-native` VictoryPie |
| `AreaChart` | `victory-native` VictoryArea |

### Color Scheme for Charts

```typescript
// Income/Expense bars
const barColors = {
    income: '#22c55e',       // green-500
    expense: '#ef4444',      // red-500
    investment: '#f59e0b',   // amber-500
    debt: '#8b5cf6',         // violet-500
};

// Pie chart uses category colors from Category.color field
// Default palette if no color set:
const defaultPieColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];
```

### Financial Health Gauge

SVG circular gauge (0-100):
- **Score calculation**: `Math.min(100, Math.max(0, savingsRate * 2))`
- **Levels**:
  - 75-100: Excellent (green)
  - 50-74: Healthy (lime)
  - 25-49: Fair (amber)
  - 0-24: Needs Attention (red)

**Mobile implementation**: Use `react-native-svg` for the circular gauge, or `react-native-circular-progress`.

---

## Spacing Reference

| Tailwind | pixels | Usage |
|----------|--------|-------|
| `p-1` / `m-1` | 4px | Tight spacing |
| `p-2` / `m-2` | 8px | Between inline items |
| `p-3` / `m-3` | 12px | Content padding |
| `p-4` / `m-4` | 16px | Standard card padding |
| `p-5` / `m-5` | 20px | Section spacing |
| `p-6` / `m-6` | 24px | Large card padding |
| `p-8` / `m-8` | 32px | Page margins |
| `gap-2` | 8px | Grid/flex gap |
| `gap-3` | 12px | Card list gap |
| `gap-4` | 16px | Section gap |
| `gap-6` | 24px | Large section gap |

## Border Radius Reference

| Tailwind | pixels | Usage |
|----------|--------|-------|
| `rounded-lg` | 8px | Small elements, badges |
| `rounded-xl` | 12px | Inputs, buttons |
| `rounded-2xl` | 16px | Cards |
| `rounded-3xl` | 24px | Glass panels, modal containers |
| `rounded-full` | 9999px | FAB, avatars, pills, progress bars |
