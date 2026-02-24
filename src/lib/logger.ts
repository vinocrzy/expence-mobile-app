/**
 * App-wide error / warning logger.
 *
 * – In development:  writes to Metro console with structured output.
 * – In production:   silences verbose logs but always records errors.
 * – Provides a simple in-memory circular buffer (last 50 entries) so the
 *   ErrorBoundary or a crash-report screen can surface recent history.
 */

import { Platform } from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

// ─── Circular buffer ─────────────────────────────────────────────────────────

const MAX_ENTRIES = 50;
const _buffer: LogEntry[] = [];

function record(entry: LogEntry) {
  if (_buffer.length >= MAX_ENTRIES) {
    _buffer.shift();
  }
  _buffer.push(entry);
}

/** Return a copy of recent log entries (newest last). */
export function getRecentLogs(): LogEntry[] {
  return [..._buffer];
}

/** Format the recent log buffer as a plain string (for copy/share). */
export function formatLogsForReport(): string {
  return _buffer
    .map(
      (e) =>
        `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.tag}] ${e.message}` +
        (e.data ? `\n  ${JSON.stringify(e.data, null, 2)}` : ''),
    )
    .join('\n');
}

// ─── Core ────────────────────────────────────────────────────────────────────

const isDev = __DEV__;

function emit(level: LogLevel, tag: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const entry: LogEntry = { level, tag, message, data, timestamp };
  record(entry);

  if (!isDev && level !== 'error' && level !== 'fatal') return;

  const prefix = `[${level.toUpperCase()}][${tag}]`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(prefix, message, data !== undefined ? data : '');
      break;
    case 'warn':
      console.warn(prefix, message, data !== undefined ? data : '');
      break;
    case 'error':
    case 'fatal':
      console.error(prefix, message, data !== undefined ? data : '');
      break;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const logger = {
  debug: (tag: string, message: string, data?: unknown) => emit('debug', tag, message, data),
  info:  (tag: string, message: string, data?: unknown) => emit('info',  tag, message, data),
  warn:  (tag: string, message: string, data?: unknown) => emit('warn',  tag, message, data),
  error: (tag: string, message: string, data?: unknown) => emit('error', tag, message, data),
  fatal: (tag: string, message: string, data?: unknown) => emit('fatal', tag, message, data),

  /**
   * Convenience: log an Error object with its stack trace.
   * Returns the original error so it can be re-thrown if needed.
   */
  captureError(tag: string, context: string, err: unknown): Error {
    const error = err instanceof Error ? err : new Error(String(err));
    emit('error', tag, `${context}: ${error.message}`, {
      stack: error.stack,
      platform: Platform.OS,
    });
    return error;
  },
};
