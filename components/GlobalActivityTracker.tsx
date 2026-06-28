'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { logActivity } from '@/lib/services/activityService';

export const GLOBAL_ACTIVITY_EVENT = 'coop-commerce:activity';

export function emitGlobalActivity(
  eventType: string,
  eventData: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(GLOBAL_ACTIVITY_EVENT, {
      detail: { eventType, eventData },
    })
  );
}

export default function GlobalActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, currentRole } = useAuth();
  const lastPageRef = useRef('');
  const sessionRef = useRef('');

  useEffect(() => {
    if (!sessionRef.current) {
      sessionRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const query = searchParams.toString();
    const page = `${pathname}${query ? `?${query}` : ''}`;
    if (lastPageRef.current === page) return;
    lastPageRef.current = page;

    void logActivity(
      user.uid,
      'page_view',
      {
        page,
        pageTitle: document.title,
        referrer: document.referrer || undefined,
        sessionId: sessionRef.current,
      },
      {
        userRole: currentRole || undefined,
      },
      {
        platform: navigator.platform,
        browser: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      }
    );
  }, [currentRole, pathname, searchParams, user]);

  useEffect(() => {
    if (!user?.uid) return;

    const handleActivity = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | {
            eventType?: string;
            eventData?: Record<string, unknown>;
          }
        | undefined;

      if (!detail?.eventType) return;

      void logActivity(
        user.uid,
        detail.eventType,
        { ...(detail.eventData || {}), sessionId: sessionRef.current },
        {
          userRole: currentRole || undefined,
        },
        {
          platform: navigator.platform,
          browser: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }
      );
    };

    window.addEventListener(GLOBAL_ACTIVITY_EVENT, handleActivity);
    return () =>
      window.removeEventListener(GLOBAL_ACTIVITY_EVENT, handleActivity);
  }, [currentRole, user]);

  useEffect(() => {
    if (!user?.uid) return;

    const record = (eventType: string, eventData: Record<string, unknown>) => {
      void logActivity(
        user.uid,
        eventType,
        { ...eventData, sessionId: sessionRef.current, page: window.location.pathname },
        { userRole: currentRole || undefined }
      );
    };
    const handleError = (event: ErrorEvent) => {
      record('page_error', {
        message: event.message || 'Browser error',
        source: event.filename || undefined,
        line: event.lineno || undefined,
      });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      record('error', {
        message:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason || 'Unhandled promise rejection'),
      });
    };
    const handleOffline = () => record('network_error', { state: 'offline' });
    const handlePageHide = () => record('page_exit', { page: window.location.pathname });

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [currentRole, user]);

  return null;
}
