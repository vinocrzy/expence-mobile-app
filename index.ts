// Polyfill: Buffer + process globals must be set before any PouchDB code loads
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;

import process from 'process';
(globalThis as any).process = process;

// Polyfill: must be imported before anything that touches crypto
import 'react-native-get-random-values';

import { registerRootComponent } from 'expo';
import { logger } from './src/lib/logger';

import App from './App';

// ─── Global error / unhandled-rejection capture ───────────────────────────────

/**
 * React Native's ErrorUtils intercepts uncaught JS exceptions BEFORE
 * the JS engine hard-crashes the process. Setting a custom handler lets
 * us log them and, in development, still show the RedBox.
 */
const previousGlobalHandler =
  (globalThis as any).ErrorUtils?.getGlobalHandler?.() ?? null;

(globalThis as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
  logger.fatal(
    'GlobalError',
    `${isFatal ? '[FATAL] ' : ''}${error?.message ?? 'Unknown error'}`,
    { stack: error?.stack, isFatal },
  );
  // Always propagate so React Native's own handler/RedBox still fires in dev.
  if (previousGlobalHandler) {
    previousGlobalHandler(error, isFatal);
  }
});

/**
 * Unhandled Promise rejections in React Native fire on the JS global event
 * target. Catching them here prevents silent crashes when an async operation
 * throws and nobody awaits / catches it.
 */
(globalThis as any).addEventListener?.('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason = event?.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason);
  logger.error('UnhandledRejection', message, {
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
