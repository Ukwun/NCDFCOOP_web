"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  CircleHelp,
  Crown,
  Gem,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMembershipPricing } from "@/lib/hooks/useMembershipPricing";
import type { MembershipTier } from "@/lib/membership/tiers";

const TIER_STYLES: Record<
  MembershipTier,
  { icon: typeof Medal; gradient: string; accent: string }
> = {
  bronze: {
    icon: Medal,
    gradient: "from-amber-950 via-amber-900 to-orange-800",
    accent: "text-amber-300",
  },
  silver: {
    icon: BadgeCheck,
    gradient: "from-slate-700 via-slate-600 to-slate-500",
    accent: "text-slate-100",
  },
  gold: {
    icon: Crown,
    gradient: "from-yellow-950 via-amber-700 to-yellow-500",
    accent: "text-yellow-200",
  },
  platinum: {
    icon: Gem,
    gradient: "from-violet-950 via-purple-800 to-fuchsia-700",
    accent: "text-fuchsia-200",
  },
};

const FAQ = [
  {
    question: "Are the displayed prices current?",
    answer:
      "Yes. The prices come from the server-owned commerce settings and refresh automatically. Your payment intent locks the displayed tier and amount before Flutterwave opens.",
  },
  {
    question: "Can a normal account change these prices?",
    answer:
      "No. Membership pricing can only be changed through the authenticated super-admin endpoint. Every change is recorded in the activity log.",
  },
  {
    question: "How do rewards points work?",
    answer:
      "Points are awarded on completed payments per ₦100 spent: Bronze earns 1, Silver 2, Gold 3, and Platinum 4.",
  },
  {
    question: "Can purchase activity improve my tier?",
    answer:
      "Yes. Qualifying spend can move you upward. The system will not move you below the tier activated by your membership payment.",
  },
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
export default function MembershipPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tiers" | "faq">("tiers");
  const { tiers, error } = useMembershipPricing();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 dark:text-white">
      <header className="sticky top-14 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              Live membership plans
            </p>
            <h1 className="truncate text-xl font-black sm:text-2xl">
              NCDFCOOP Membership
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-2xl sm:p-9">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
              <Sparkles size={14} /> Cooperative ownership, practical benefits
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Choose the membership level that fits you.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-100 sm:text-base">
              Every price is supplied by the live server. Payment amounts are
              verified independently before benefits are activated.
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100"
          >
            {error} The last verified default prices remain visible while the
            system retries.
          </div>
        )}

        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <button
            type="button"
            onClick={() => setActiveTab("tiers")}
            className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === "tiers"
                ? "bg-emerald-700 text-white shadow-lg"
                : "hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            Membership tiers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === "faq"
                ? "bg-emerald-700 text-white shadow-lg"
                : "hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            How it works
          </button>
        </div>

        {activeTab === "tiers" ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => {
              const style = TIER_STYLES[tier.id];
              const Icon = style.icon;
              return (
                <article
                  key={tier.id}
                  className={`group flex min-h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${style.gradient} text-white shadow-xl transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl motion-reduce:transform-none`}
                >
                  <div className="border-b border-white/10 p-6">
                    <Icon className={style.accent} size={30} />
                    <h3 className="mt-4 text-2xl font-black">{tier.name}</h3>
                    <p className="mt-2 text-3xl font-black">
                      {formatNaira(tier.subscriptionPrice)}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      One-time membership activation
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <ul className="space-y-3 text-sm text-white/90">
                      <li className="flex gap-2">
                        <Check size={17} className="shrink-0" />
                        {tier.discountPercentage}% member discount
                      </li>
                      <li className="flex gap-2">
                        <Check size={17} className="shrink-0" />
                        {tier.pointsPerHundredNaira} reward point
                        {tier.pointsPerHundredNaira === 1 ? "" : "s"} per ₦100
                      </li>
                      <li className="flex gap-2">
                        <Check size={17} className="shrink-0" />
                        {tier.supportLabel}
                      </li>
                      <li className="flex gap-2">
                        <Check size={17} className="shrink-0" />
                        {tier.freeShippingThreshold === 0
                          ? "Free shipping benefit"
                          : `Free shipping from ${formatNaira(tier.freeShippingThreshold)}`}
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/membership/payment?tier=${tier.id}`)
                      }
                      className="mt-7 min-h-12 w-full rounded-xl bg-white px-4 font-black text-slate-950 transition group-hover:scale-[1.02] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white/70 motion-reduce:transform-none"
                    >
                      Choose {tier.name}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {FAQ.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
              >
                <h3 className="flex items-start gap-2 font-black">
                  <CircleHelp
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.answer}
                </p>
              </article>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-400/20 dark:bg-emerald-500/10">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <ShieldCheck className="text-emerald-700 dark:text-emerald-400" />
              Server-verified membership activation
            </h2>
            <p className="mt-1 text-sm text-emerald-900/75 dark:text-emerald-100/75">
              The browser cannot activate membership by itself. Flutterwave
              verification and the locked payment intent must agree.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/member-products")}
            className="min-h-11 shrink-0 rounded-xl border border-emerald-700 px-5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-700 hover:text-white dark:border-emerald-400 dark:text-emerald-300"
          >
            Continue shopping
          </button>
        </section>
      </div>
    </main>
  );
}
