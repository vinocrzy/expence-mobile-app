/**
 * UI Component barrel export — Design System.
 *
 * Import from '@/components/ui' for all reusable components.
 */

// ─── Core primitives ─────────────────────────────────────────────────────────
export { AnimatedPressable } from './AnimatedPressable';
export { Button, type ButtonProps } from './Button';
export { GlassCard } from './GlassCard';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { Divider } from './Divider';
export { IconCircle } from './IconCircle';

// ─── Form components ─────────────────────────────────────────────────────────
export { TextInputField, type TextInputFieldProps } from './TextInputField';
export { AmountInput } from './AmountInput';
export { SegmentedControl, type Segment } from './SegmentedControl';
export { SelectField, type SelectOption } from './SelectField';
export { SwitchRow } from './SwitchRow';

// ─── Feedback / Overlay ──────────────────────────────────────────────────────
export { BottomSheetModal } from './BottomSheetModal';
export { ConfirmDialog } from './ConfirmDialog';
export { EmptyState } from './EmptyState';
export { ErrorBanner } from './ErrorBanner';
export { LoadingScreen } from './LoadingScreen';
export {
  SkeletonLine,
  SkeletonCircle,
  SkeletonRect,
  SkeletonCard,
  SkeletonRow,
} from './SkeletonLoader';

// ─── Cards & Lists ───────────────────────────────────────────────────────────
export { HeroCard } from './HeroCard';
export { StatCard } from './StatCard';
export { TransactionRow, type TransactionType } from './TransactionRow';
export { SectionHeader } from './SectionHeader';
export { FilterBar } from './FilterBar';
export { FilterChip } from './FilterChip';
export { ListItem } from './ListItem';
export { QuickActionSheet, type QuickAction } from './QuickActionSheet';

// ─── Status ──────────────────────────────────────────────────────────────────
export { SyncStatusPill, type SyncState } from './SyncStatusPill';
export { AnimatedAmount } from './AnimatedAmount';

// ─── Layout ──────────────────────────────────────────────────────────────────
export { ScreenHeader } from './ScreenHeader';
export { FAB } from './FAB';
