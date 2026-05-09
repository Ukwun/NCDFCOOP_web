'use client';

import { useRouter } from 'next/navigation';

type RiskLevel = 'low' | 'medium' | 'high';

interface TrustSignalsStripProps {
  verifiedSuppliersCount: number;
  suppliersObservedCount: number;
  transactionProtectionRate: number;
  deliveryConfidenceRate: number;
  slaRiskCount: number;
  complianceDriftLevel: RiskLevel;
}

function riskTone(level: RiskLevel) {
  if (level === 'high') return 'text-red-600 bg-red-100 border-red-200';
  if (level === 'medium') return 'text-amber-700 bg-amber-100 border-amber-200';
  return 'text-emerald-700 bg-emerald-100 border-emerald-200';
}

function riskLabel(level: RiskLevel) {
  if (level === 'high') return 'Drift High';
  if (level === 'medium') return 'Drift Medium';
  return 'Drift Low';
}

export default function TrustSignalsStrip({
  verifiedSuppliersCount,
  suppliersObservedCount,
  transactionProtectionRate,
  deliveryConfidenceRate,
  slaRiskCount,
  complianceDriftLevel,
}: TrustSignalsStripProps) {
  const router = useRouter();

  const supplierCoverage =
    suppliersObservedCount > 0
      ? Math.round((verifiedSuppliersCount / suppliersObservedCount) * 100)
      : 0;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trust & Operations Signals</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Live assurance layer for supplier verification, payment protection, and delivery execution.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${riskTone(complianceDriftLevel)}`}>
          {(complianceDriftLevel === 'high' || complianceDriftLevel === 'medium') && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
          )}
          {riskLabel(complianceDriftLevel)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="trust-card">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Verified Suppliers</p>
          <p className="text-2xl font-bold text-[#0F5A8B] dark:text-[#80C7F0] mt-1">
            {verifiedSuppliersCount}/{suppliersObservedCount || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Coverage: {supplierCoverage}%</p>
          <button onClick={() => router.push('/member-transparency')} className="trust-btn">
            Audit Suppliers
          </button>
        </article>

        <article className="trust-card">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Transaction Protection</p>
          <p className="text-2xl font-bold text-[#0F5A8B] dark:text-[#80C7F0] mt-1">{transactionProtectionRate}%</p>
          <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0F5A8B] to-[#2A9ED4] transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, transactionProtectionRate))}%` }}
            />
          </div>
          <button onClick={() => router.push('/orders')} className="trust-btn">
            Review Protected Orders
          </button>
        </article>

        <article className="trust-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Delivery Confidence</p>
              <p className="text-2xl font-bold text-[#0F5A8B] dark:text-[#80C7F0] mt-1">{deliveryConfidenceRate}%</p>
            </div>
            {slaRiskCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-red-200 text-red-700 bg-red-50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                SLA Risk: {slaRiskCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Live confidence from fulfillment outcomes.</p>
          <button onClick={() => router.push('/wholesale/orders')} className="trust-btn">
            Track Deliveries
          </button>
        </article>
      </div>

      <style jsx>{`
        .trust-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px;
          background: #ffffff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .trust-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(2, 46, 77, 0.08);
        }
        .trust-btn {
          margin-top: 12px;
          width: 100%;
          border-radius: 10px;
          background: #0f5a8b;
          color: white;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 10px;
          transition: background 0.2s ease;
        }
        .trust-btn:hover {
          background: #0b456a;
        }
      `}</style>
    </section>
  );
}
