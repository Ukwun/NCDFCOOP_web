/**
 * Sentry Client Configuration
 * Browser-side error tracking and performance monitoring
 * 
 * This is imported in app/layout.tsx for client-side error capture
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry for client-side error tracking
 * Called once on application startup
 */
export function initSentryClient() {
  // Skip initialization in development unless explicitly enabled
  if (typeof window === 'undefined') {
    return;
  }

  Sentry.init({
    // Sentry DSN
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 
      'https://7dd040b41779c621b6b083a6ff77a44f@o4511166305468416.ingest.us.sentry.io/4511166410326016',
    
    // Environment
    environment: process.env.NEXT_PUBLIC_ENV || 'development',
    
    // Release
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Enable tracing for performance monitoring
    tracesSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Session Replay configuration
    replaysSessionSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always replay on error
    
    // Integrations for browser
    integrations,
    
    // Debug mode
    debug: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
    
    // Custom event filtering
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.log('Sentry would capture:', event);
        return null;
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'chrome-extension://',
      'moz-extension://',
      
      // Expected network errors
      'NetworkError',
      'Failed to fetch',
      'fetch is not defined',
      
      // Firebase auth errors  
      'auth/popup-blocked',
      'auth/user-cancelled-login',
      'auth/popup-closed-by-user',
      
      // ResizeObserver errors
      'ResizeObserver loop limit exceeded',
      
      // Script loading errors
      'Script error',
    ],
    
    // Allowed URLs for error capture
    allowUrls: [
      /^https:\/\/ncdfcoop\.com\//,
      /^https:\/\/app\.ncdfcoop\.com\//,
      /^https:\/\/.*\.ncdfcoop\.com\//,
    ],
  });

  // Attach user context if available
  if (typeof window !== 'undefined' && window.__SENTRY_USER__) {
    Sentry.setUser(window.__SENTRY_USER__);
  }
}

/**
 * Set user context for Sentry
 * Call this after user authentication
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 * Call this on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, {
    level,
    tags: {
      category,
    },
  });
}

/**
 * Capture a custom exception
 */
export function captureSentryException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}
