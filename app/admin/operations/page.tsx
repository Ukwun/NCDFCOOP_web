"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleDollarSign,
  Gem,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/authContext";
import {
  DEFAULT_MEMBERSHIP_TIER_PRICES,
  type MembershipTierPrices,
} from "@/lib/membership/pricing";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership/tiers";

const ROLES = [
  "support_agent",
  "dispute_officer",
  "finance_operator",
  "risk_officer",
  "admin",
  "super_admin",
] as const;
const ASSIGNABLE_ROLES = ROLES.filter((role) => role !== "super_admin");

const ROLE_LABELS: Record<string, string> = {
  support_agent: "Support agent",
  dispute_officer: "Dispute officer",
  finance_operator: "Finance operator",
  risk_officer: "Risk officer",
  admin: "Administrator",
  super_admin: "Super administrator",
};

type StaffMember = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  staffStatus: string;
};

type Dispute = {
  id: string;
  orderId?: string;
  status?: string;
  reason?: string;
  description?: string;
  holdAmount?: number;
};

type Payout = {
  id: string;
  amount?: number;
  status?: string;
  sellerId?: string;
  approvalIds?: string[];
  requiredApprovals?: number;
  exceptionFlags?: string[];
};

type ApiResponse = {
  disputes?: Dispute[];
  requests?: Payout[];
  sellerCommissionPercent?: number;
  membershipTierPrices?: MembershipTierPrices;
  staff?: StaffMember[];
  message?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Operation failed.";
}

export default function OperationsPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [staffRole, setStaffRole] = useState("support_agent");
  const [commission, setCommission] = useState("10");
  const [membershipPrices, setMembershipPrices] = useState<
    Record<MembershipTier, string>
  >({
    bronze: String(DEFAULT_MEMBERSHIP_TIER_PRICES.bronze),
    silver: String(DEFAULT_MEMBERSHIP_TIER_PRICES.silver),
    gold: String(DEFAULT_MEMBERSHIP_TIER_PRICES.gold),
    platinum: String(DEFAULT_MEMBERSHIP_TIER_PRICES.platinum),
  });
  const [loading, setLoading] = useState(true);
  const [workingKey, setWorkingKey] = useState("");

  const isSuper = user?.roles?.includes("super_admin") === true;
  const canViewDisputes =
    user?.roles?.some((role) =>
      [
        "support_agent",
        "dispute_officer",
        "risk_officer",
        "admin",
        "super_admin",
      ].includes(role),
    ) === true;
  const canDecideDisputes =
    user?.roles?.some((role) =>
      ["dispute_officer", "admin", "super_admin"].includes(role),
    ) === true;
  const canViewPayouts =
    user?.roles?.some((role) =>
      ["finance_operator", "risk_officer", "admin", "super_admin"].includes(
        role,
      ),
    ) === true;

  const call = useCallback(async (url: string, init?: RequestInit) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("Your session expired. Sign in again.");

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const data = (await response.json().catch(() => ({}))) as ApiResponse & {
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Operation failed.");
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const requests: Array<Promise<ApiResponse | null>> = [
      canViewDisputes ? call("/api/disputes") : Promise.resolve(null),
      canViewPayouts ? call("/api/payout-requests") : Promise.resolve(null),
      isSuper ? call("/api/admin/commerce-settings") : Promise.resolve(null),
      isSuper ? call("/api/admin/staff") : Promise.resolve(null),
    ];
    const results = await Promise.allSettled(requests);
    const failures: string[] = [];

    if (results[0]?.status === "fulfilled" && results[0].value) {
      setDisputes(results[0].value.disputes || []);
    } else if (results[0]?.status === "rejected") {
      failures.push(
        results[0].reason?.message || "Disputes could not be loaded.",
      );
    }

    if (results[1]?.status === "fulfilled" && results[1].value) {
      setPayouts(results[1].value.requests || []);
    } else if (results[1]?.status === "rejected") {
      failures.push(
        results[1].reason?.message || "Payouts could not be loaded.",
      );
    }

    if (isSuper) {
      if (results[2]?.status === "fulfilled" && results[2].value) {
        setCommission(String(results[2].value.sellerCommissionPercent));
        const prices =
          results[2].value.membershipTierPrices ||
          DEFAULT_MEMBERSHIP_TIER_PRICES;
        setMembershipPrices({
          bronze: String(prices.bronze),
          silver: String(prices.silver),
          gold: String(prices.gold),
          platinum: String(prices.platinum),
        });
      } else if (results[2]?.status === "rejected") {
        failures.push(
          results[2].reason?.message ||
            "Commission settings could not be loaded.",
        );
      }
      if (results[3]?.status === "fulfilled" && results[3].value) {
        setStaff(results[3].value.staff || []);
      } else if (results[3]?.status === "rejected") {
        failures.push(
          results[3].reason?.message || "Staff roster could not be loaded.",
        );
      }
    }

    if (failures.length) setError(Array.from(new Set(failures)).join(" "));
    setLoading(false);
  }, [call, canViewDisputes, canViewPayouts, isSuper]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const act = async (
    url: string,
    body: Record<string, unknown>,
    key: string,
  ) => {
    try {
      setWorkingKey(key);
      setError("");
      setNotice("");
      await call(url, { method: "PATCH", body: JSON.stringify(body) });
      setNotice("The operational record was updated successfully.");
      await load();
    } catch (operationError: unknown) {
      setError(errorMessage(operationError));
    } finally {
      setWorkingKey("");
    }
  };

  const assignRole = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter the verified email address of an existing account.");
      return;
    }

    try {
      setWorkingKey("assign");
      setError("");
      setNotice("");
      const result = await call("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, role: staffRole }),
      });
      setEmail("");
      setNotice(result.message);
      await load();
    } catch (operationError: unknown) {
      setError(errorMessage(operationError));
    } finally {
      setWorkingKey("");
    }
  };

  const revokeRole = async (staffMember: StaffMember, role: string) => {
    const confirmed = window.confirm(
      `Remove ${ROLE_LABELS[role] || role} access from ${staffMember.email}?`,
    );
    if (!confirmed) return;

    try {
      setWorkingKey(`${staffMember.id}:${role}`);
      setError("");
      setNotice("");
      const result = await call("/api/admin/staff", {
        method: "PATCH",
        body: JSON.stringify({ userId: staffMember.id, role }),
      });
      setNotice(result.message);
      await load();
    } catch (operationError: unknown) {
      setError(errorMessage(operationError));
    } finally {
      setWorkingKey("");
    }
  };

  const saveCommission = async () => {
    const value = Number(commission);
    if (!Number.isFinite(value) || value < 0 || value > 30) {
      setError("Commission must be between 0% and 30%.");
      return;
    }

    try {
      setWorkingKey("commission");
      setError("");
      setNotice("");
      const result = await call("/api/admin/commerce-settings", {
        method: "PUT",
        body: JSON.stringify({ sellerCommissionPercent: value }),
      });
      setCommission(String(result.sellerCommissionPercent));
      setNotice(
        `Seller commission is now ${result.sellerCommissionPercent}%. New orders will use this rate.`,
      );
    } catch (operationError: unknown) {
      setError(errorMessage(operationError));
    } finally {
      setWorkingKey("");
    }
  };

  const saveMembershipPrices = async () => {
    const prices = Object.fromEntries(
      MEMBERSHIP_TIERS.map((tier) => [
        tier.id,
        Number(membershipPrices[tier.id]),
      ]),
    ) as MembershipTierPrices;
    const invalidTier = MEMBERSHIP_TIERS.find(
      (tier) =>
        !Number.isInteger(prices[tier.id]) ||
        prices[tier.id] < 100 ||
        prices[tier.id] > 10_000_000,
    );
    if (invalidTier) {
      setError(
        `${invalidTier.name} must have a whole-number price between ₦100 and ₦10,000,000.`,
      );
      return;
    }

    try {
      setWorkingKey("membership-prices");
      setError("");
      setNotice("");
      const result = await call("/api/admin/commerce-settings", {
        method: "PUT",
        body: JSON.stringify({ membershipTierPrices: prices }),
      });
      const saved = result.membershipTierPrices || prices;
      setMembershipPrices({
        bronze: String(saved.bronze),
        silver: String(saved.silver),
        gold: String(saved.gold),
        platinum: String(saved.platinum),
      });
      setNotice(
        "Membership prices are live. New payment intents and public tier cards now use these amounts.",
      );
    } catch (operationError: unknown) {
      setError(errorMessage(operationError));
    } finally {
      setWorkingKey("");
    }
  };

  const activeStaff = useMemo(
    () => staff.filter((staffMember) => staffMember.staffStatus !== "inactive"),
    [staff],
  );

  return (
    <ProtectedRoute currentPath="/admin/operations" requiredRoles={[...ROLES]}>
      <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-5 shadow-2xl sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Private staff workspace
              </p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                Operations control centre
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Live queues refresh every 15 seconds. Permissions and every
                operational decision are verified again by the server.
              </p>
            </div>
            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh live data
            </button>
          </header>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
            >
              {notice}
            </div>
          )}

          {isSuper && (
            <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-300">
                    <UserCog size={20} />
                  </span>
                  <div>
                    <h2 className="font-bold">
                      Assign verified operational staff
                    </h2>
                    <p className="text-sm text-slate-400">
                      The account must already exist and have a verified email.
                      The role is server-issued and reflected in active
                      sessions.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void assignRole();
                    }}
                    placeholder="staff@company.com"
                    aria-label="Staff email address"
                    className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-slate-900 px-3 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <select
                    value={staffRole}
                    onChange={(event) => setStaffRole(event.target.value)}
                    aria-label="Operational role"
                    className="min-h-11 rounded-xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-emerald-400/60"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void assignRole()}
                    disabled={workingKey === "assign"}
                    className="min-h-11 rounded-xl bg-emerald-400 px-5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
                  >
                    {workingKey === "assign" ? "Assigning…" : "Assign role"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-sky-500/15 p-2.5 text-sky-300">
                    <CircleDollarSign size={20} />
                  </span>
                  <div>
                    <h2 className="font-bold">Seller commission</h2>
                    <p className="text-sm text-slate-400">
                      Applied to newly created orders only.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={commission}
                    onChange={(event) => setCommission(event.target.value)}
                    className="min-h-11 w-28 rounded-xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-emerald-400/60"
                    aria-label="Seller commission percentage"
                  />
                  <span className="text-sm">%</span>
                  <button
                    onClick={() => void saveCommission()}
                    disabled={workingKey === "commission"}
                    className="min-h-11 flex-1 rounded-xl bg-emerald-400 px-4 font-bold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                  >
                    {workingKey === "commission" ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {isSuper && (
            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-violet-500/[0.07] p-5 shadow-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300">
                    <Gem size={20} />
                  </span>
                  <div>
                    <h2 className="font-bold">
                      Membership subscription prices
                    </h2>
                    <p className="max-w-2xl text-sm text-slate-400">
                      Global one-time activation prices. Saving updates public
                      tier cards and all newly created payment intents. Existing
                      completed payments are never recalculated.
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  <BadgeCheck size={14} /> Server authoritative
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {MEMBERSHIP_TIERS.map((tier) => (
                  <label
                    key={tier.id}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-3 transition focus-within:border-violet-400/50 focus-within:ring-2 focus-within:ring-violet-400/10"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {tier.name}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="text-slate-400">₦</span>
                      <input
                        type="number"
                        min="100"
                        max="10000000"
                        step="100"
                        value={membershipPrices[tier.id]}
                        onChange={(event) =>
                          setMembershipPrices((current) => ({
                            ...current,
                            [tier.id]: event.target.value,
                          }))
                        }
                        aria-label={`${tier.name} membership price`}
                        className="min-h-11 min-w-0 flex-1 bg-transparent text-lg font-black outline-none"
                      />
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Changes are audit-logged with the super-admin identity and
                  apply only to payment intents created after saving.
                </p>
                <button
                  type="button"
                  onClick={() => void saveMembershipPrices()}
                  disabled={workingKey === "membership-prices"}
                  className="min-h-11 rounded-xl bg-violet-400 px-5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {workingKey === "membership-prices"
                    ? "Publishing…"
                    : "Publish tier prices"}
                </button>
              </div>
            </section>
          )}

          {isSuper && (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-emerald-300" />
                  <div>
                    <h2 className="font-bold">Operational staff roster</h2>
                    <p className="text-xs text-slate-400">
                      {activeStaff.length} active account
                      {activeStaff.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  <BadgeCheck size={14} /> Server verified
                </span>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {staff.map((staffMember) => (
                  <article
                    key={staffMember.id}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {staffMember.name || staffMember.email}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {staffMember.email}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          staffMember.staffStatus === "inactive"
                            ? "bg-slate-700 text-slate-300"
                            : "bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {staffMember.staffStatus}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {staffMember.roles
                        .filter((role) =>
                          ROLES.includes(role as (typeof ROLES)[number]),
                        )
                        .map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs"
                          >
                            <ShieldCheck
                              size={12}
                              className="text-emerald-300"
                            />
                            {ROLE_LABELS[role] || role}
                            {role !== "super_admin" && (
                              <button
                                onClick={() =>
                                  void revokeRole(staffMember, role)
                                }
                                disabled={
                                  workingKey === `${staffMember.id}:${role}`
                                }
                                aria-label={`Remove ${ROLE_LABELS[role] || role} from ${staffMember.email}`}
                                className="ml-1 rounded px-1 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-50"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                    </div>
                  </article>
                ))}
                {!loading && staff.length === 0 && (
                  <p className="p-3 text-sm text-slate-400">
                    No operational staff accounts have been assigned yet.
                  </p>
                )}
              </div>
            </section>
          )}

          <div
            className={`grid gap-6 ${
              canViewDisputes && canViewPayouts ? "xl:grid-cols-2" : ""
            }`}
          >
            {canViewDisputes && (
              <Queue title="Disputes" empty="No disputes waiting.">
                {disputes.map((dispute) => (
                  <article
                    key={dispute.id}
                    className="border-t border-white/10 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <b>Order {dispute.orderId}</b>
                      <span className="text-xs capitalize">
                        {dispute.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {dispute.reason}: {dispute.description}
                    </p>
                    <p className="mt-1 text-xs text-amber-300">
                      Held: ₦{Number(dispute.holdAmount || 0).toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton
                        label="Take case"
                        working={workingKey === `${dispute.id}:assign`}
                        onClick={() =>
                          void act(
                            "/api/disputes",
                            { disputeId: dispute.id, action: "assign" },
                            `${dispute.id}:assign`,
                          )
                        }
                        tone="sky"
                      />
                      <ActionButton
                        label="Ask seller"
                        working={workingKey === `${dispute.id}:seller`}
                        onClick={() =>
                          void act(
                            "/api/disputes",
                            {
                              disputeId: dispute.id,
                              action: "request_seller_response",
                            },
                            `${dispute.id}:seller`,
                          )
                        }
                        tone="amber"
                      />
                      {canDecideDisputes &&
                        [
                          "full_refund",
                          "release_seller",
                          "replacement",
                          "escalated",
                        ].map((decision) => (
                          <ActionButton
                            key={decision}
                            label={decision.replace(/_/g, " ")}
                            working={workingKey === `${dispute.id}:${decision}`}
                            onClick={() =>
                              void act(
                                "/api/disputes",
                                {
                                  disputeId: dispute.id,
                                  action: "resolve",
                                  decision,
                                  summary: decision,
                                },
                                `${dispute.id}:${decision}`,
                              )
                            }
                          />
                        ))}
                    </div>
                  </article>
                ))}
              </Queue>
            )}

            {canViewPayouts && (
              <Queue title="Payouts" empty="No payout requests waiting.">
                {payouts.map((payout) => (
                  <article
                    key={payout.id}
                    className="border-t border-white/10 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <b>₦{Number(payout.amount || 0).toLocaleString()}</b>
                      <span className="text-xs capitalize">
                        {payout.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Seller {payout.sellerId} · approvals{" "}
                      {(payout.approvalIds || []).length}/
                      {payout.requiredApprovals || 1}
                    </p>
                    {!!payout.exceptionFlags?.length && (
                      <p className="text-xs text-rose-300">
                        {payout.exceptionFlags.join(", ")}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <ActionButton
                        label="Approve"
                        working={workingKey === `${payout.id}:approve`}
                        onClick={() =>
                          void act(
                            "/api/payout-requests",
                            { payoutRequestId: payout.id, action: "approve" },
                            `${payout.id}:approve`,
                          )
                        }
                        tone="emerald"
                      />
                      <ActionButton
                        label="Reject"
                        working={workingKey === `${payout.id}:reject`}
                        onClick={() =>
                          void act(
                            "/api/payout-requests",
                            {
                              payoutRequestId: payout.id,
                              action: "reject",
                              reason: "Rejected by finance review",
                            },
                            `${payout.id}:reject`,
                          )
                        }
                        tone="rose"
                      />
                    </div>
                  </article>
                ))}
              </Queue>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function Queue({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : !!children;
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-xl">
      <h2 className="p-4 text-lg font-bold">{title}</h2>
      {hasChildren ? (
        children
      ) : (
        <p className="p-4 text-sm text-slate-400">{empty}</p>
      )}
    </section>
  );
}

function ActionButton({
  label,
  onClick,
  working,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  working: boolean;
  tone?: "default" | "sky" | "amber" | "emerald" | "rose";
}) {
  const tones = {
    default: "border-white/20 hover:bg-white/10",
    sky: "border-sky-400/30 bg-sky-500/20 text-sky-100",
    amber: "border-amber-400/30 bg-amber-500/20 text-amber-100",
    emerald: "border-emerald-400/30 bg-emerald-500 text-slate-950",
    rose: "border-rose-400/30 bg-rose-500/25 text-rose-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={working}
      className={`min-h-9 rounded-lg border px-3 py-1 text-xs font-bold capitalize transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 ${tones[tone]}`}
    >
      {working ? "Working…" : label}
    </button>
  );
}
