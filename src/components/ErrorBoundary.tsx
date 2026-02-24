/**
 * ErrorBoundary — Catches unhandled JS errors in the component tree.
 *
 * – Logs all caught errors via the central logger (also writes to Metro console).
 * – Shows a user-friendly fallback with a retry action.
 * – Provides "Copy Details" to copy the full error + recent logs to the clipboard
 *   so developers can paste them directly into a bug report or terminal.
 * – In __DEV__ mode exposes a collapsible stack trace inline.
 */

import React, { Component, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Clipboard,
  Alert,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants';
import { logger, formatLogsForReport } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  showStack: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null, showStack: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.fatal('ErrorBoundary', error.message, {
      stack: error.stack,
      componentStack: info.componentStack,
    });
    this.setState({ componentStack: info.componentStack ?? null });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, componentStack: null, showStack: false });
  };

  handleCopyDetails = () => {
    const { error, componentStack } = this.state;
    const report = [
      '=== ERROR REPORT ===',
      `Message: ${error?.message ?? 'Unknown'}`,
      '',
      '--- JS Stack ---',
      error?.stack ?? '(none)',
      '',
      '--- Component Stack ---',
      componentStack ?? '(none)',
      '',
      '--- Recent Logs ---',
      formatLogsForReport(),
    ].join('\n');

    Clipboard.setString(report);
    Alert.alert('Copied', 'Error details copied to clipboard.');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, componentStack, showStack } = this.state;

      return (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {error?.message || 'An unexpected error occurred.'}
          </Text>

          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.secondaryButton]} onPress={this.handleCopyDetails}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Copy Details</Text>
            </Pressable>
          </View>

          {__DEV__ && (
            <Pressable
              style={styles.stackToggle}
              onPress={() => this.setState((s) => ({ showStack: !s.showStack }))}
            >
              <Text style={styles.stackToggleText}>
                {showStack ? 'Hide stack trace ▲' : 'Show stack trace ▼'}
              </Text>
            </Pressable>
          )}

          {__DEV__ && showStack && (
            <View style={styles.stackBox}>
              <Text style={styles.stackText} selectable>
                {error?.stack ?? ''}
              </Text>
              {componentStack ? (
                <>
                  <Text style={[styles.stackText, { color: COLORS.warning, marginTop: SPACING.md }]}>
                    Component tree:
                  </Text>
                  <Text style={styles.stackText} selectable>
                    {componentStack}
                  </Text>
                </>
              ) : null}
            </View>
          )}
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING['3xl'],
    paddingTop: SPACING['3xl'] * 2,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
  },
  stackToggle: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stackToggleText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
  },
  stackBox: {
    marginTop: SPACING.md,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stackText: {
    fontSize: 10,
    color: COLORS.error,
    fontFamily: 'monospace' as any,
    lineHeight: 16,
  },
});
