/**
 * Sentry Instrumentation
 * Server-side error tracking and performance monitoring
 * 
 * This file is loaded automatically by Next.js when:
 * - NODE_ENV=production
 * - NEXT_RUNTIME environment variable is set
 * 
 * Sentry Configuration:
 * - Organization: 8-gigabytes
 * - Project: javascript-nextjs
 * - Platform: Next.js
 */

import * as Sentry from '@sentry/nextjs';

// Initialize Sentry for Server-side
export async function register() {
  // Only initialize in production or when explicitly enabled
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      // Sentry DSN - provided by Sentry during project setup
      dsn: process.env.SENTRY_DSN || 
        'https://7dd040b41779c621b6b083a6ff77a44f@o4511166305468416.ingest.us.sentry.io/4511166410326016',
      
      // Environment
      environment: process.env.NODE_ENV || 'development',
      
      // Release version
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      
      // Enable tracing for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Server integration
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
      
      // Debug mode
      debug: process.env.NODE_ENV === 'development',
      
      // Before send hook - filter out sensitive data
      beforeSend(event, hint) {
        // Filter out errors in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        
        // Don't send 404 errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error && error.message?.includes('404')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'chrome-extension://',
        'moz-extension://',
        
        // Ignore network errors that are expected
        'NetworkError',
        'Failed to fetch',
        
        // Firebase authentication known issues
        'auth/popup-blocked',
        'auth/cancelled-popup-request',
      ],
      
      // Deny URLs - don't capture events from these URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        
        // Analytics
        /analytics/,
        /segment/,
      ],
    });
  }
}
