'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';
import { UtilityLiveData } from '@/lib/hooks/useUtilityLiveData';

type UtilityRole = 'member' | 'institutional_buyer' | 'seller';

interface GlobalUtilityLayerProps {
  role: UtilityRole;
  kpiSummary?: string;
  liveData?: UtilityLiveData;
}

interface UtilityCard {
  id: string;
  title: string;
  description: string;
  status: string;
  actionLabel: string;
  actionRoute: string;
}

function titleCase(value: string | undefined) {
  if (!value) return '';
  return value
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function riskBadge(level: UtilityLiveData['complianceDriftLevel'] | undefined) {
  if (level === 'high') {
    return {
      label: 'Drift High',
      classes: 'text-blue-700 bg-blue-100 border-blue-200',
      pulse: true,
    };
  }
  if (level === 'medium') {
    return {
      label: 'Drift Medium',
      classes: 'text-amber-700 bg-amber-100 border-amber-200',
      pulse: true,
    };
  }
  return {
    label: 'Drift Low',
    classes: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    pulse: false,
  };
}

export default function GlobalUtilityLayer({ role, kpiSummary, liveData }: GlobalUtilityLayerProps) {
  const router = useRouter();
  const { user, currentRole, switchRole } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);

  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  const roleCards: UtilityCard[] = useMemo(() => {
    if (role === USER_ROLES.MEMBER) {
      return [
        {
          id: 'kyc',
          title: 'KYC Status',
          description: 'Identity and cooperative compliance checks.',
          status: `Status: ${String(liveData?.kycStatus || 'unknown').toUpperCase()}`,
          actionLabel: 'Review KYC',
          actionRoute: '/account',
        },
        {
          id: 'wallet-alerts',
          title: 'Wallet Alerts',
          description: 'Monitor credit, debit, and payment risk notifications.',
          status: `${liveData?.unreadAlertCount ?? 0} New Alerts`,
          actionLabel: 'Open Alerts',
          actionRoute: '/notifications',
        },
        {
          id: 'investment',
          title: 'Investment Notifications',
          description: 'Member opportunities, dividends, and offer campaigns.',
          status: `${liveData?.investmentNotificationCount ?? 0} Active Notifications`,
          actionLabel: 'View Opportunities',
          actionRoute: '/member-benefits',
        },
      ];
    }

    if (role === USER_ROLES.INSTITUTIONAL_BUYER) {
      return [
        {
          id: 'compliance-reports',
          title: 'Compliance Reports',
          description: 'Audit status for procurement and regulated categories.',
          status: `${liveData?.complianceReportsCount ?? 0} Reports Ready`,
          actionLabel: 'Open Reports',
          actionRoute: '/wholesale/orders',
        },
        {
          id: 'institutional-alerts',
          title: 'Institutional Alerts',
          description: 'Policy, SLA, and supply risk alerts for your account.',
          status: `${liveData?.institutionalAlertCount ?? 0} Priority Alerts`,
          actionLabel: 'View Alerts',
          actionRoute: '/notifications',
        },
        {
          id: 'team-management',
          title: 'Team Management',
          description: 'Control buyer roles, permissions, and access flows.',
          status: `${liveData?.teamSize ?? 0} Team Members`,
          actionLabel: 'Manage Team',
          actionRoute: '/settings',
        },
      ];
    }

    return [
      {
        id: 'leads',
        title: 'Leads',
        description: 'Inbound demand signals and buyer interest snapshots.',
        status: 'Live lead feed available',
        actionLabel: 'View Leads',
        actionRoute: '/seller/orders',
      },
      {
        id: 'sales-alerts',
        title: 'Sales Alerts',
        description: 'Order surges, conversion spikes, and stock pressure.',
        status: `${liveData?.institutionalAlertCount ?? 0} Sales Alerts`,
        actionLabel: 'Open Alerts',
        actionRoute: '/notifications',
      },
      {
        id: 'commission',
        title: 'Commission Updates',
        description: 'Settlement progress, payout windows, and reconciliations.',
        status: 'Settlement feed active',
        actionLabel: 'View Settlement',
        actionRoute: '/seller',
      },
    ];
  }, [liveData, role]);

  const drift = riskBadge(liveData?.complianceDriftLevel);

  const handleQuickRoleSwitch = async () => {
    if (switchingRole) return;

    const nextRole =
      role === USER_ROLES.MEMBER ? USER_ROLES.INSTITUTIONAL_BUYER : USER_ROLES.MEMBER;

    try {
      setSwitchingRole(true);
      await switchRole(nextRole);
      router.push('/home');
    } catch (error) {
      console.error('Role switch failed:', error);
      router.push('/role-selection');
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0E4B78] via-[#0F5E94] to-[#1373A7] text-white px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Global Utility Layer</p>
            <h2 className="text-lg sm:text-xl font-semibold">Infrastructure Console</h2>
            <p className="text-sm opacity-90">
              {kpiSummary || 'Profile, compliance, alerts, and role operations are centralized here.'}
            </p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Operator:</span> {userName}
            <span className="mx-2 opacity-70">|</span>
            <span className="font-semibold">Role:</span> {titleCase(currentRole || role)}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <button onClick={() => router.push('/account')} className="utility-btn">Profile Access</button>
          <button onClick={() => router.push('/notifications')} className="utility-btn utility-badge-wrap">
            Notifications
            {(liveData?.unreadNotificationCount || 0) > 0 && (
              <span className="utility-badge">{liveData?.unreadNotificationCount}</span>
            )}
          </button>
          <button onClick={handleQuickRoleSwitch} className="utility-btn" disabled={switchingRole}>
            {switchingRole ? 'Switching...' : 'Role Switcher'}
          </button>
          <button onClick={() => router.push('/member-transparency')} className="utility-btn">Help Center</button>
          <button onClick={() => router.push('/member-transparency')} className="utility-btn utility-badge-wrap">
            Compliance Status
            <span className={`inline-flex items-center gap-1 text-[10px] ml-1 px-1.5 py-0.5 rounded-full border ${drift.classes}`}>
              {drift.pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
              {drift.label}
            </span>
          </button>
          <button onClick={() => router.push('/settings')} className="utility-btn">Settings</button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {roleCards.map((card) => (
          <article key={card.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 min-h-[40px]">{card.description}</p>
            <p className="text-sm font-semibold text-[#0E4B78] dark:text-[#73B6E8] mb-3">{card.status}</p>
            <button
              onClick={() => router.push(card.actionRoute)}
              className="w-full px-3 py-2 rounded-lg bg-[#0E4B78] hover:bg-[#0A3B5F] text-white text-sm font-medium transition-colors"
            >
              {card.actionLabel}
            </button>
          </article>
        ))}
      </div>

      <style jsx>{`
        .utility-btn {
          position: relative;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #dbe3ec;
          background: #ffffff;
          color: #1f2937;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .utility-btn:hover {
          border-color: #0e4b78;
          color: #0e4b78;
          transform: translateY(-1px);
        }
        .utility-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }
        .utility-badge-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .utility-badge {
          min-width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #dc2626;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 0 5px;
          line-height: 18px;
          animation: pulse-badge 1.5s infinite;
        }
        @keyframes pulse-badge {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
    </section>
  );
}
