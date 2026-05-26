'use client';

import { useMemo, useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants/database';
import { useAuth } from '@/lib/auth/authContext';
import { logActivity } from '@/lib/services/activityService';

type IntentRole = 'member' | 'institutional_buyer' | 'seller';

interface SearchIntent {
  id: string;
  role: IntentRole;
  title: string;
  queryLabel: string;
  description: string;
  href: string;
  keywords: string[];
}

type SearchTrigger =
  | 'intent_chip_click'
  | 'intent_result_click'
  | 'search_submit_exact'
  | 'search_submit_best_match'
  | 'search_submit_fallback';

interface PendingNavigation {
  trigger: SearchTrigger;
  intentId?: string;
  query: string;
  role: IntentRole;
  targetHref: string;
  targetPath: string;
  startedAt: number;
}

const ROLE_INTENTS: SearchIntent[] = [
  {
    id: 'member-investment-products',
    role: 'member',
    title: 'Investment Products',
    queryLabel: 'investment products',
    description: 'Member investment opportunities and products',
    href: '/member/investments',
    keywords: ['member', 'investment', 'products', 'opportunity', 'returns'],
  },
  {
    id: 'member-savings-plans',
    role: 'member',
    title: 'Savings Plans',
    queryLabel: 'savings plans',
    description: 'Member savings plans and cooperative savings tools',
    href: '/member-savings',
    keywords: ['member', 'savings', 'plans', 'deposit', 'goal'],
  },
  {
    id: 'member-transaction-history',
    role: 'member',
    title: 'Transaction History',
    queryLabel: 'transaction history',
    description: 'Order and transaction history records',
    href: '/orders',
    keywords: ['member', 'transaction', 'history', 'orders', 'payments'],
  },
  {
    id: 'wholesale-institutional-products',
    role: 'institutional_buyer',
    title: 'Institutional Products',
    queryLabel: 'institutional products',
    description: 'Bulk and institutional-grade product sourcing',
    href: '/products?q=institutional%20products',
    keywords: ['wholesale', 'institutional', 'products', 'bulk', 'procurement'],
  },
  {
    id: 'wholesale-reports',
    role: 'institutional_buyer',
    title: 'Reports',
    queryLabel: 'reports',
    description: 'Compliance and operational reports',
    href: '/wholesale/compliance',
    keywords: ['wholesale', 'reports', 'compliance', 'audit', 'analytics'],
  },
  {
    id: 'wholesale-accounts',
    role: 'institutional_buyer',
    title: 'Accounts',
    queryLabel: 'accounts',
    description: 'Institutional account controls and profile management',
    href: '/wholesale/profile',
    keywords: ['wholesale', 'accounts', 'profile', 'team', 'settings'],
  },
  {
    id: 'wholesale-large-portfolios',
    role: 'institutional_buyer',
    title: 'Large Portfolios',
    queryLabel: 'large portfolios',
    description: 'Portfolio scale and procurement oversight',
    href: '/wholesale/portfolio',
    keywords: ['wholesale', 'large', 'portfolios', 'portfolio', 'institutional'],
  },
  {
    id: 'seller-clients',
    role: 'seller',
    title: 'Clients',
    queryLabel: 'clients',
    description: 'Buyer relationships and account management',
    href: '/seller/clients',
    keywords: ['seller', 'clients', 'buyers', 'relationships', 'accounts'],
  },
  {
    id: 'seller-product-catalogues',
    role: 'seller',
    title: 'Product Catalogues',
    queryLabel: 'product catalogues',
    description: 'Seller inventory and product catalogue management',
    href: '/seller/products',
    keywords: ['seller', 'product', 'catalogues', 'inventory', 'listing'],
  },
  {
    id: 'seller-leads',
    role: 'seller',
    title: 'Leads',
    queryLabel: 'leads',
    description: 'Inquiry pipeline and incoming buyer demand',
    href: '/seller/inquiries',
    keywords: ['seller', 'leads', 'inquiries', 'pipeline', 'demand'],
  },
  {
    id: 'seller-campaigns',
    role: 'seller',
    title: 'Campaigns',
    queryLabel: 'campaigns',
    description: 'Promotions and campaign execution surfaces',
    href: '/offers',
    keywords: ['seller', 'campaigns', 'promotions', 'offers', 'marketing'],
  },
];

function normalizeRole(role: string): IntentRole {
  if (role === USER_ROLES.INSTITUTIONAL_BUYER || role === 'wholesale_buyer') {
    return 'institutional_buyer';
  }

  if (role === USER_ROLES.SELLER) {
    return 'seller';
  }

  return 'member';
}

export default function RoleIntentSearch({ currentRole }: { currentRole: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const typedTelemetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypedSignatureRef = useRef('');
  const lastLandedSignatureRef = useRef('');
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);

  const role = normalizeRole(currentRole);

  const roleIntents = useMemo(() => {
    return ROLE_INTENTS.filter((intent) => intent.role === role);
  }, [role]);

  const filteredIntents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return roleIntents;
    }

    return roleIntents.filter((intent) => {
      const haystack = [
        intent.title,
        intent.queryLabel,
        intent.description,
        ...intent.keywords,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, roleIntents]);

  const trackTelemetry = useCallback(
    async (eventType: 'product_search' | 'navigation' | 'page_view', eventData: Record<string, unknown>) => {
      if (!user?.uid) return;

      const userMetadata = {
        userRole: role,
        userEmail: user.email || '',
        userName: user.displayName || '',
      };

      const deviceInfo = typeof window === 'undefined'
        ? undefined
        : {
            platform: navigator.platform,
            browser: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
          };

      await logActivity(user.uid, eventType, eventData, userMetadata, deviceInfo);
    },
    [role, user?.displayName, user?.email, user?.uid]
  );

  const executeIntent = (intent: SearchIntent, trigger: SearchTrigger, sourceQuery: string) => {
    setQuery(intent.queryLabel);
    setIsOpen(false);

    void trackTelemetry('navigation', {
      interactionStage: 'intent_clicked',
      trigger,
      searchSurface: 'role_intent_layer',
      roleIntent: role,
      intentId: intent.id,
      intentLabel: intent.queryLabel,
      targetHref: intent.href,
      sourceQuery,
    });

    pendingNavigationRef.current = {
      trigger,
      intentId: intent.id,
      query: sourceQuery,
      role,
      targetHref: intent.href,
      targetPath: intent.href.split('?')[0],
      startedAt: Date.now(),
    };

    router.push(intent.href);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      setIsOpen(true);
      return;
    }

    const exact = roleIntents.find((intent) => intent.queryLabel.toLowerCase() === normalizedQuery);
    if (exact) {
      executeIntent(exact, 'search_submit_exact', query.trim());
      return;
    }

    const firstMatch = filteredIntents[0];
    if (firstMatch) {
      executeIntent(firstMatch, 'search_submit_best_match', query.trim());
      return;
    }

    const fallbackHref = `/products?q=${encodeURIComponent(query.trim())}`;

    void trackTelemetry('product_search', {
      interactionStage: 'submitted',
      trigger: 'search_submit_fallback',
      searchSurface: 'role_intent_layer',
      roleIntent: role,
      searchQuery: query.trim(),
      queryLength: query.trim().length,
      resultsCount: 0,
      fallbackUsed: true,
      targetHref: fallbackHref,
    });

    pendingNavigationRef.current = {
      trigger: 'search_submit_fallback',
      query: query.trim(),
      role,
      targetHref: fallbackHref,
      targetPath: '/products',
      startedAt: Date.now(),
    };

    router.push(fallbackHref);
    setIsOpen(false);
  };

  useEffect(() => {
    if (typedTelemetryTimerRef.current) {
      clearTimeout(typedTelemetryTimerRef.current);
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || normalizedQuery.length < 2 || !isOpen) {
      return;
    }

    typedTelemetryTimerRef.current = setTimeout(() => {
      const signature = `${role}:${normalizedQuery}:${filteredIntents.length}`;
      if (lastTypedSignatureRef.current === signature) {
        return;
      }

      lastTypedSignatureRef.current = signature;
      void trackTelemetry('product_search', {
        interactionStage: 'typed',
        trigger: 'search_input',
        searchSurface: 'role_intent_layer',
        roleIntent: role,
        searchQuery: query.trim(),
        queryLength: query.trim().length,
        resultsCount: filteredIntents.length,
        topIntentIds: filteredIntents.slice(0, 5).map((intent) => intent.id),
      });
    }, 600);

    return () => {
      if (typedTelemetryTimerRef.current) {
        clearTimeout(typedTelemetryTimerRef.current);
      }
    };
  }, [filteredIntents, isOpen, query, role, trackTelemetry]);

  useEffect(() => {
    const pending = pendingNavigationRef.current;
    if (!pending || !pathname) {
      return;
    }

    if (pathname !== pending.targetPath) {
      return;
    }

    const signature = `${pending.trigger}:${pending.targetHref}:${pathname}:${pending.query}`;
    if (lastLandedSignatureRef.current === signature) {
      return;
    }

    lastLandedSignatureRef.current = signature;
    pendingNavigationRef.current = null;

    void trackTelemetry('page_view', {
      interactionStage: 'route_landed',
      trigger: pending.trigger,
      searchSurface: 'role_intent_layer',
      roleIntent: pending.role,
      intentId: pending.intentId,
      searchQuery: pending.query,
      targetHref: pending.targetHref,
      landedPath: pathname,
      navigationLatencyMs: Date.now() - pending.startedAt,
    });
  }, [pathname, trackTelemetry]);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search intent: investment products, reports, leads..."
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0E4B78] hover:bg-[#0C3F66] text-white"
        >
          Search
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {roleIntents.map((intent) => (
          <button
            key={intent.id}
            type="button"
            onClick={() => executeIntent(intent, 'intent_chip_click', query.trim() || intent.queryLabel)}
            className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {intent.queryLabel}
          </button>
        ))}
      </div>

      {isOpen && filteredIntents.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
          {filteredIntents.slice(0, 8).map((intent) => (
            <button
              key={intent.id}
              type="button"
              onClick={() => executeIntent(intent, 'intent_result_click', query.trim() || intent.queryLabel)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{intent.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{intent.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
