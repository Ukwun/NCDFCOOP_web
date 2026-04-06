'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FinancialReport {
  period: string;
  revenue: number;
  expenses: number;
  memberDividends: number;
  reserveFund: number;
  farmersSupport: number;
  status: 'published' | 'draft';
}

interface DistributionRecord {
  year: number;
  totalDividends: number;
  yourDividend: number;
  paymentDate: string;
}

export default function MemberTransparencyPage() {
  const router = useRouter();
  const [reports, setReports] = useState<FinancialReport[]>([
    {
      period: 'Q4 2025 (Oct-Dec)',
      revenue: 125000000,
      expenses: 45000000,
      memberDividends: 25000000,
      reserveFund: 30000000,
      farmersSupport: 25000000,
      status: 'published',
    },
    {
      period: 'Q3 2025 (Jul-Sep)',
      revenue: 112000000,
      expenses: 42000000,
      memberDividends: 22000000,
      reserveFund: 28000000,
      farmersSupport: 20000000,
      status: 'published',
    },
    {
      period: 'Q2 2025 (Apr-Jun)',
      revenue: 98000000,
      expenses: 38000000,
      memberDividends: 18000000,
      reserveFund: 25000000,
      farmersSupport: 17000000,
      status: 'published',
    },
  ]);

  const [distributions, setDistributions] = useState<DistributionRecord[]>([
    {
      year: 2025,
      totalDividends: 156000000,
      yourDividend: 12480,
      paymentDate: 'Dec 28, 2025',
    },
    {
      year: 2024,
      totalDividends: 142000000,
      yourDividend: 11360,
      paymentDate: 'Dec 29, 2024',
    },
    {
      year: 2023,
      totalDividends: 98000000,
      yourDividend: 7840,
      paymentDate: 'Dec 30, 2023',
    },
  ]);

  const currentReport = reports[0];
  const profit = currentReport.revenue - currentReport.expenses;
  const profitMargin = ((profit / currentReport.revenue) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:text-blue-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              📊 Transparency Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Full financial transparency with member oversight
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Latest Report Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Latest Financial Report
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{currentReport.period}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full">
              Published
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦{(currentReport.revenue / 1000000).toFixed(0)}M
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦{(currentReport.expenses / 1000000).toFixed(0)}M
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-200 mb-1">Net Profit</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                ₦{(profit / 1000000).toFixed(0)}M ({profitMargin}%)
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-1">Member Dividends</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                ₦{(currentReport.memberDividends / 1000000).toFixed(0)}M
              </p>
            </div>
          </div>
        </div>

        {/* Fund Allocation Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            💵 Fund Allocation (Q4 2025)
          </h3>

          <div className="space-y-4">
            {[
              {
                name: 'Member Dividends',
                amount: currentReport.memberDividends,
                percentage: (
                  (currentReport.memberDividends / profit) *
                  100
                ).toFixed(1),
                color: 'bg-blue-500',
              },
              {
                name: 'Reserve Fund',
                amount: currentReport.reserveFund,
                percentage: ((currentReport.reserveFund / profit) * 100).toFixed(1),
                color: 'bg-gray-500',
              },
              {
                name: 'Farmers Support',
                amount: currentReport.farmersSupport,
                percentage: (
                  (currentReport.farmersSupport / profit) *
                  100
                ).toFixed(1),
                color: 'bg-green-500',
              },
            ].map((fund) => (
              <div key={fund.name}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {fund.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ₦{(fund.amount / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {fund.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${fund.color}`}
                    style={{ width: `${fund.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            📑 All Financial Reports
          </h3>

          <div className="space-y-4">
            {reports.map((report) => {
              const reportProfit = report.revenue - report.expenses;
              return (
                <div
                  key={report.period}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.period}
                      </p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Revenue</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ₦{(report.revenue / 1000000).toFixed(0)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Profit</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            ₦{(reportProfit / 1000000).toFixed(0)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Dividends</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            ₦{(report.memberDividends / 1000000).toFixed(0)}M
                          </p>
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dividend History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            💚 Your Dividend History
          </h3>

          <div className="space-y-4">
            {distributions.map((dist) => (
              <div
                key={dist.year}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Year {dist.year}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paid on {dist.paymentDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Your Dividend
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ₦{dist.yourDividend.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Info */}
        <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-8">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
            🏛️ Your Governance Rights
          </h3>
          <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <li>✓ Access to all financial reports and audit findings</li>
            <li>✓ Vote on annual budget allocation and dividend distribution</li>
            <li>✓ Elect board members and audit committee (1 vote per member)</li>
            <li>✓ Attend annual member assemblies and special meetings</li>
            <li>✓ Right to audit information and financial records</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
