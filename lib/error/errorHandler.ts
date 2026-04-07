/**
 * Error Handling Utilities
 * Centralized error handling, logging, and user feedback
 */

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  code: string;
  message: string;
  level: ErrorLevel;
  context?: Record<string, any>;
  timestamp: Date;
}

/**
 * Application error classes
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error. Please check your connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  constructor(message: string = 'Server error. Please try again later') {
    super(message);
    this.name = 'ServerError';
  }
}

/**
 * Error handler class with logging and categorization
 */
export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;

  /**
   * Log informational messages
   */
  static logInfo(code: string, message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${code}: ${message}`);
    }
  }

  /**
   * Log an error for debugging
   */
  static logError(
    code: string,
    message: string,
    level: ErrorLevel = 'error',
    context?: Record<string, any>
  ): void {
    const error: AppError = {
      code,
      message,
      level,
      context,
      timestamp: new Date(),
    };

    // Add to log (in production, send to error tracking service)
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[${level.toUpperCase()}] ${code}`);
      console.error(message);
      if (context) console.table(context);
      console.groupEnd();
    }

    // Could send to Sentry or other error tracking here
    // if (level === 'critical') {
    //   Sentry.captureException(new Error(message), { context });
    // }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: Error | string): string {
    if (typeof error === 'string') {
      return error;
    }

    switch (error.name) {
      case 'ValidationError':
        return 'Please check your input and try again';
      case 'AuthenticationError':
        return 'Please log in to continue';
      case 'AuthorizationError':
        return 'You do not have permission to perform this action';
      case 'NotFoundError':
        return 'The requested item was not found';
      case 'NetworkError':
        return 'Network error. Please check your connection and try again';
      case 'ServerError':
        return 'Something went wrong. Please try again later';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  /**
   * Handle API errors with standardized response
   */
  static handleApiError(
    error: any
  ): { message: string; code: string; level: ErrorLevel } {
    let message = 'An error occurred';
    let code = 'UNKNOWN_ERROR';
    let level: ErrorLevel = 'error';

    if (error.response?.status === 404) {
      message = 'Resource not found';
      code = 'NOT_FOUND';
    } else if (error.response?.status === 401) {
      message = 'Please log in to continue';
      code = 'UNAUTHORIZED';
      level = 'warning';
    } else if (error.response?.status === 403) {
      message = 'You do not have permission to perform this action';
      code = 'FORBIDDEN';
      level = 'warning';
    } else if (error.response?.status === 400) {
      message = error.response.data?.message || 'Invalid request';
      code = 'BAD_REQUEST';
    } else if (error.response?.status === 500) {
      message = 'Server error. Please try again later';
      code = 'SERVER_ERROR';
      level = 'critical';
    } else if (error.code === 'ECONNREFUSED') {
      message = 'Could not connect to server. Please check your connection';
      code = 'CONNECTION_ERROR';
      level = 'critical';
    } else if (error.message === 'Network Error' || !navigator.onLine) {
      message = 'No internet connection. Please check your connection';
      code = 'NETWORK_ERROR';
    }

    return { message, code, level };
  }

  /**
   * Get all logged errors
   */
  static getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by level
   */
  static getErrorsByLevel(level: ErrorLevel): AppError[] {
    return this.errorLog.filter((e) => e.level === level);
  }

  /**
   * Check if there are any critical errors
   */
  static hasCriticalErrors(): boolean {
    return this.errorLog.some((e) => e.level === 'critical');
  }
}

/**
 * Handle Firebase authentication errors
 */
export const handleFirebaseAuthError = (error: any): string => {
  const errorCode = error.code || '';

  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again';
    case 'auth/email-already-in-use':
      return 'Email already in use. Please log in instead';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later';
    default:
      return error.message || 'Authentication error. Please try again';
  }
};

/**
 * Handle Firestore database errors
 */
export const handleFirestoreError = (error: any): string => {
  const errorCode = error.code || '';

  switch (errorCode) {
    case 'permission-denied':
      return 'You do not have permission to access this resource';
    case 'not-found':
      return 'The requested document was not found';
    case 'already-exists':
      return 'This item already exists';
    case 'unavailable':
      return 'Database is temporarily unavailable. Please try again';
    case 'unauthenticated':
      return 'Please log in to continue';
    default:
      return error.message || 'Database error. Please try again';
  }
};

/**
 * Handle Firebase Storage errors
 */
export const handleStorageError = (error: any): string => {
  const errorCode = error.code || '';

  switch (errorCode) {
    case 'storage/object-not-found':
      return 'File not found';
    case 'storage/bucket-not-found':
      return 'Storage bucket not found';
    case 'storage/project-not-found':
      return 'Project not found';
    case 'storage/unauthenticated':
      return 'Please log in to upload files';
    case 'storage/unauthorized':
      return 'You do not have permission to perform this action';
    case 'storage/retry-limit-exceeded':
      return 'Upload failed. Please try again';
    case 'storage/invalid-argument':
      return 'Invalid file. Please check and try again';
    case 'storage/server-file-wrong-size':
      return 'File size mismatch. Please try again';
    default:
      return error.message || 'Upload error. Please try again';
  }
};

/**
 * Retry helper for failed operations
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
};

/**
 * Create a timeout promise
 */
export const timeoutPromise = <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
};
