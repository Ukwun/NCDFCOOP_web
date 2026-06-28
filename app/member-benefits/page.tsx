'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgePercent,
  Check,
  Gift,
  Headphones,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useMemberData } from '@/lib/hooks/useMemberData';
import {
  getMembershipTier,
  MEMBERSHIP_TIERS,
} from '@/lib/membership/tiers';

function naira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MemberBenefitsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, loading } = useMemberData(user?.uid || '');
  const tier = getMembershipTier(data?.tier || user?.memberTier);
  const active = user?.membershipStatus === 'active' && data?.isActive === true;
  const tierIndex = MEMBERSHIP_TIERS.findIndex((item) => item.id === tier.id);
  const nextTier = MEMBERSHIP_TIERS[tierIndex + 1];
  const totalSpent = data?.totalSpent || 0;
  const progress = nextTier
    ? Math.min(100, Math.round((totalSpent / nextTier.minimumSpend) * 100))
    : 100;

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" aria-label="Loading member benefits" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-950 dark:text-white sm:text-2xl">Member benefits</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Live rewards and pricing attached to your account</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {!active ? (
          <section className="overflow-hidden rounded-lg border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-gray-900">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-950 dark:text-white">Activate your member pricing</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Your account is ready, but paid member benefits are not active yet. Activation is verified by the payment server before discounts and rewards are enabled.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/membership/payment')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
              >
                <Gift className="h-5 w-5" />
                Activate for {naira(5_000)}
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-lg bg-emerald-900 p-6 text-white shadow-lg md:p-8">
            <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-200">Active membership</p>
                <h2 className="mt-2 text-3xl font-bold">{tier.name} member</h2>
                <p className="mt-2 text-sm text-emerald-100">Member since {data?.memberSince || 'activation'}</p>
              </div>
              <div className="grid grid-cols-3 gap-5 text-right">
                <div>
                  <p className="text-xs text-emerald-200">Spent</p>
                  <p className="mt-1 font-bold">{naira(totalSpent)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-200">Points</p>
                  <p className="mt-1 font-bold">{(data?.rewardsPoints || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-200">Orders</p>
                  <p className="mt-1 font-bold">{data?.ordersCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-2 flex justify-between text-xs text-emerald-100">
                <span>{nextTier ? `${progress}% to ${nextTier.name}` : 'Highest tier reached'}</span>
                <span>{nextTier ? naira(nextTier.minimumSpend) : tier.name}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-emerald-950">
                <div className="h-full rounded-full bg-yellow-300 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">{tier.name} benefits</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Applied automatically when membership is active</p>
            </div>
            {active && (
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgePercent, label: 'Member pricing', value: `${tier.discountPercentage}% off retail prices` },
              { icon: Gift, label: 'Rewards', value: `${tier.pointsPerHundredNaira} point${tier.pointsPerHundredNaira > 1 ? 's' : ''} per ₦100 paid` },
              { icon: Truck, label: 'Shipping', value: tier.freeShippingThreshold === 0 ? 'Free shipping' : `Free above ${naira(tier.freeShippingThreshold)}` },
              { icon: Headphones, label: 'Support', value: tier.supportLabel },
            ].map((benefit) => (
              <article key={benefit.label} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <benefit.icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="mt-4 text-sm font-semibold text-gray-950 dark:text-white">{benefit.label}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{benefit.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-5 py-4">Tier</th>
                <th className="px-5 py-4">Spend threshold</th>
                <th className="px-5 py-4">Discount</th>
                <th className="px-5 py-4">Points / ₦100</th>
                <th className="px-5 py-4">Shipping</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERSHIP_TIERS.map((item) => (
                <tr key={item.id} className={`border-t border-gray-100 dark:border-gray-800 ${item.id === tier.id ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}>
                  <td className="px-5 py-4 font-semibold text-gray-950 dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      {item.id === tier.id && <Check className="h-4 w-4 text-emerald-700" />}
                      {item.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{naira(item.minimumSpend)}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.discountPercentage}%</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.pointsPerHundredNaira}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.freeShippingThreshold === 0 ? 'Free' : `Above ${naira(item.freeShippingThreshold)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
