/**
 * Sentry Error Logging Configuration
 * 
 * Setup for production error tracking and monitoring
 * Captures unhandled errors, exceptions, and performance metrics
 * 
 * Install: npm install @sentry/nextjs
 */

/**
 * Sentry DSN (Data Source Name)
 * Get this from your Sentry project settings
 * 
 * Steps to get DSN:
 * 1. Go to sentry.io and sign up (free tier available)
 * 2. Create a new project for "Next.js"
 * 3. Copy the DSN from project settings
 * 4. Add to .env.local: NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
 */

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

/**
 * Sentry initialization configuration
 * Use this in your sentry.server.config.js or sentry.client.config.js
 */
export function getSentryConfig(isDev: boolean = false) {
  return {
    dsn: SENTRY_DSN,
    
    // Environment
    environment: isDev ? 'development' : 'production',
    
    // Release version (set your app version)
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Performance Monitoring - sample rate
    tracesSampleRate: isDev ? 1.0 : 0.1, // 10% in production
    
    // Error sampling
    sampleRate: 1.0, // Capture all errors
    
    // Capture Replay for errors
    replaysSessionSampleRate: isDev ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0, // Always capture replay on error
    
    // Integrations
    integrations: [
      // Automatic HTTP client error tracking
      // Automatic Console error tracking
      // Automatic Unhandled Rejection tracking
    ],
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // See http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors that are expected
      'NetworkError',
      'TimeoutError',
      // Ignore Firebase Auth errors that are expected
      'Firebase',
      // Page unload
      'cancelled',
    ],
    
    // Allow URLs (for debugging)
    allowUrls: [
      // Only capture errors from your own domain
      /https?:\/\/([\w-]+\.)*yourdomain\.com/,
    ],
  };
}

/**
 * Initialize Sentry (call this once at app startup)
 * 
 * Usage in next.config.js:
 * const { withSentryConfig } = require("@sentry/nextjs");
 * 
 * Usage in app/layout.tsx or _app.tsx:
 * import { initializeSentry } from '@/lib/logging/sentry.config';
 * 
 * if (typeof window !== 'undefined') {
 *   initializeSentry();
 * }
 */
export function initializeSentry() {
  // Only initialize if DSN is configured
  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured. Error logging disabled.');
    return;
  }

  // Client-side initialization happens automatically with @sentry/nextjs
  console.log('✅ Sentry error logging initialized');
}

/**
 * Types for error context
 */
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  pageUrl?: string;
  userAction?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Capture an error with context
 * 
 * Usage:
 * captureError(error, {
 *   userId: user.uid,
 *   pageUrl: window.location.href,
 *   userAction: 'checkout'
 * });
 */
export function captureError(error: Error | string, context?: ErrorContext) {
  // Skip if Sentry not configured
  if (!SENTRY_DSN) {
    console.error('❌ Error:', error);
    return;
  }

  try {
    // Import Sentry dynamically to avoid issues if not installed
    const Sentry = require('@sentry/nextjs');

    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Set user context if provided
    if (context?.userId || context?.userEmail) {
      Sentry.setUser({
        id: context.userId,
        email: context.userEmail,
      });
    }

    // Set additional context
    if (context) {
      const { userId, userEmail, ...otherContext } = context;
      Sentry.setContext('custom', otherContext);
    }

    // Capture the error
    Sentry.captureException(errorObj);
  } catch (err) {
    console.error('Failed to capture error:', err);
  }
}

/**
 * Capture a message (non-error)
 * 
 * Usage:
 * captureMessage('User started checkout', 'info', { orderId: '123' });
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
) {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  try {
    const Sentry = require('@sentry/nextjs');

    if (context) {
      Sentry.setContext('custom', context);
    }

    Sentry.captureMessage(message, level);
  } catch (err) {
    console.error('Failed to capture message:', err);
  }
}

/**
 * Wrap async functions with error handling
 * 
 * Usage:
 * const result = await withErrorHandling(
 *   async () => {
 *     return await api.call();
 *   },
 *   'API call failed',
 *   { endpoint: '/api/users' }
 * );
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    captureError(error as Error, {
      ...context,
      errorMessage,
    });
    throw error;
  }
}

/**
 * Create breadcrumb for user actions
 * Helps trace what user did before error occurred
 * 
 * Usage:
 * addBreadcrumb('click', 'Clicked checkout button', { buttonId: 'btn-checkout' });
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  if (!SENTRY_DSN) return;

  try {
    const Sentry = require('@sentry/nextjs');

    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (err) {
    console.error('Failed to add breadcrumb:', err);
  }
}

/**
 * Set user context for error tracking
 * Call this after user logs in
 * 
 * Usage:
 * setUserContext(user.uid, user.email);
 */
export function setUserContext(userId: string, email?: string) {
  if (!SENTRY_DSN) return;

  try {
    const Sentry = require('@sentry/nextjs');

    Sentry.setUser({
      id: userId,
      email,
    });

    // Add breadcrumb
    addBreadcrumb('auth', 'User logged in', { userId });
  } catch (err) {
    console.error('Failed to set user context:', err);
  }
}

/**
 * Clear user context (on logout)
 * 
 * Usage:
 * clearUserContext();
 */
export function clearUserContext() {
  if (!SENTRY_DSN) return;

  try {
    const Sentry = require('@sentry/nextjs');

    Sentry.setUser(null);
    addBreadcrumb('auth', 'User logged out');
  } catch (err) {
    console.error('Failed to clear user context:', err);
  }
}

/**
 * Capture performance metrics
 * 
 * Usage:
 * startTransaction('checkout', 'Checkout process');
 * ... do work ...
 * endTransaction();
 */
let currentTransaction: any = null;

export function startTransaction(name: string, op: string) {
  if (!SENTRY_DSN) return;

  try {
    const Sentry = require('@sentry/nextjs');

    currentTransaction = Sentry.startTransaction({
      name,
      op,
    });
  } catch (err) {
    console.error('Failed to start transaction:', err);
  }
}

export function endTransaction() {
  if (currentTransaction) {
    currentTransaction.finish();
    currentTransaction = null;
  }
}

/**
 * Report performance metrics
 * 
 * Usage:
 * reportMetric('api_response_time', 245, 'milliseconds');
 */
export function reportMetric(
  name: string,
  value: number,
  unit: string = 'unit'
) {
  if (!SENTRY_DSN) return;

  try {
    const Sentry = require('@sentry/nextjs');

    // Capture as measurement
    if (currentTransaction) {
      currentTransaction.setMeasurement(name, value, unit);
    }
  } catch (err) {
    console.error('Failed to report metric:', err);
  }
}

/**
 * Environment-specific setup
 * Call this in your app initialization
 */
export function setupSentryEnvironment() {
  if (typeof window === 'undefined') return; // Server-side

  // Only initialize in production
  if (process.env.NODE_ENV === 'production' || SENTRY_DSN) {
    try {
      // Global error handler
      window.addEventListener('error', (event) => {
        captureError(event.error || new Error(event.message), {
          pageUrl: window.location.href,
          userAction: 'global_error',
        });
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        captureError(event.reason || new Error('Unhandled Promise Rejection'), {
          pageUrl: window.location.href,
          userAction: 'unhandled_rejection',
        });
      });

      console.log('✅ Sentry global error handlers registered');
    } catch (err) {
      console.error('Failed to setup Sentry environment:', err);
    }
  }
}

/**
 * Sentry setup checklist
 *
 * 1. Install: npm install @sentry/nextjs
 *
 * 2. Create account at sentry.io and get DSN
 *
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
 *    NEXT_PUBLIC_APP_VERSION=1.0.0
 *
 * 4. Update next.config.js with Sentry wrapper:
 *    ```
 *    const { withSentryConfig } = require("@sentry/nextjs");
 *    const nextConfig = { ... };
 *    module.exports = withSentryConfig(nextConfig, {
 *      org: "your-org",
 *      project: "your-project",
 *      authToken: process.env.SENTRY_AUTH_TOKEN,
 *    });
 *    ```
 *
 * 5. In app/layout.tsx, call setupSentryEnvironment() once
 *
 * 6. Use captureError() and captureMessage() throughout app
 *
 * 7. View errors in Sentry dashboard
 */
