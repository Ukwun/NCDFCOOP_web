/**
 * Loading State and Skeleton Component Utilities
 * Helpers for displaying loading states and skeleton screens
 */

import React from 'react';

/**
 * Generic loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

/**
 * Loading skeleton component for cards
 */
export const CardSkeleton: React.FC = () => (
  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 space-y-4">
    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse" />
    </div>
  </div>
);

/**
 * Loading skeleton for a table row
 */
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

/**
 * Loading skeleton for a list of items
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Loading spinner component
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin`} />
  );
};

/**
 * Full page loading overlay
 */
export const LoadingOverlay: React.FC<{ isVisible: boolean; message?: string }> = ({
  isVisible,
  message = 'Loading...',
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-900 dark:text-white">{message}</p>
      </div>
    </div>
  );
};

/**
 * Empty state component
 */
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    <p className="text-5xl mb-4">{icon}</p>
    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </p>
    <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);

/**
 * Error state component
 */
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({
  title = 'Something went wrong',
  message,
  action,
}) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-8 text-center">
    <p className="text-3xl mb-4">⚠️</p>
    <p className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
      {title}
    </p>
    <p className="text-red-800 dark:text-red-200 mb-6">{message}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);

/**
 * Loading indicator for buttons
 */
export const LoadingButton: React.FC<{
  isLoading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({
  isLoading,
  disabled = false,
  onClick,
  children,
  variant = 'primary',
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity ${
        variantClasses[variant]
      } ${
        isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

/**
 * Progress bar component
 */
export const ProgressBar: React.FC<{
  progress: number; // 0-100
  label?: string;
}> = ({ progress, label }) => (
  <div>
    {label && (
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {progress}%
        </span>
      </div>
    )}
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  </div>
);

/**
 * Toast notification component
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const ToastNotification: React.FC<Toast & { onClose: () => void }> = ({
  type,
  message,
  duration = 3000,
  onClose,
}) => {
  const typeStyles = {
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
    error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '!',
  };

  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${typeStyles[type]}`}
    >
      <span className="font-bold text-lg">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-xl hover:opacity-70 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};

/**
 * Toast container for displaying multiple notifications
 */
export const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-4 right-4 space-y-2 max-w-sm">
    {toasts.map((toast) => (
      <ToastNotification
        key={toast.id}
        {...toast}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

/**
 * Hook for managing toast notifications
 */
export const useToastNotifications = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = (type: Toast['type'], message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string) => addToast('success', message);
  const error = (message: string) => addToast('error', message, 4000);
  const info = (message: string) => addToast('info', message);
  const warning = (message: string) => addToast('warning', message);

  return { toasts, addToast, removeToast, success, error, info, warning };
};

/**
 * Hook for managing loading state
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<Error | null>(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setErrorState = (err: Error | string) => {
    setError(
      typeof err === 'string' ? new Error(err) : err
    );
    setIsLoading(false);
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setErrorState,
    reset,
  };
};
