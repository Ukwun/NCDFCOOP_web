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
      },
      {
        userRole: currentRole || undefined,
        userEmail: user.email || undefined,
        userName: user.displayName || undefined,
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
        detail.eventData || {},
        {
          userRole: currentRole || undefined,
          userEmail: user.email || undefined,
          userName: user.displayName || undefined,
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

  return null;
}
