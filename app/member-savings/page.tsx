'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'interest';
  amount: number;
  date: string;
  description: string;
}

export default function MemberSavingsPage() {
  const router = useRouter();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([
    {
      id: '1',
      name: 'Farm Expansion Equipment',
      targetAmount: 500000,
      currentAmount: 325000,
      deadline: 'Dec 31, 2026',
      icon: '🚜',
    },
    {
      id: '2',
      name: 'Emergency Reserve',
      targetAmount: 200000,
      currentAmount: 180000,
      deadline: 'Jun 30, 2026',
      icon: '🛡️',
    },
    {
      id: '3',
      name: 'Business Growth Fund',
      targetAmount: 1000000,
      currentAmount: 420000,
      deadline: 'Dec 31, 2027',
      icon: '📈',
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 50000,
      date: 'Mar 20, 2026',
      description: 'Savings deposit to Farm Expansion fund',
    },
    {
      id: '2',
      type: 'interest',
      amount: 1250,
      date: 'Mar 15, 2026',
      description: 'Monthly interest earned (5.0% APR)',
    },
    {
      id: '3',
      type: 'deposit',
      amount: 30000,
      date: 'Mar 10, 2026',
      description: 'Auto-deposit from store credit',
    },
    {
      id: '4',
      type: 'withdrawal',
      amount: 25000,
      date: 'Mar 5, 2026',
      description: 'Withdrawal to Emergency Reserve',
    },
  ]);

  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalGoals = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const monthlyInterest = totalSavings * (0.05 / 12); // 5% APR

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
              💰 Member Savings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Track your savings goals and earn member rates
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Savings</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{totalSavings.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {((totalSavings / totalGoals) * 100).toFixed(1)}% of goals
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Monthly Interest</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{monthlyInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              5.0% APR member rate
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-sm">
            <p className="text-green-100 text-sm mb-2">Time to Goals</p>
            <p className="text-3xl font-bold">8-12 months</p>
            <p className="text-xs text-green-200 mt-2">
              Estimated at current pace
            </p>
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎯 Your Savings Goals</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              + New Goal
            </button>
          </div>

          <div className="space-y-6">
            {savingsGoals.map((goal) => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon}</span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {goal.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {goal.deadline}
                        </p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      ⋯
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ₦{goal.currentAmount.toLocaleString()} of ₦{goal.targetAmount.toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Amount Remaining */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      ₦{remaining.toLocaleString()} remaining
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Add to this goal →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Card */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-8">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
            ✨ Member Savings Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <p className="font-semibold mb-2">💳 Better Rates</p>
              <p>5.0% APR—3x better than bank savings</p>
            </div>
            <div>
              <p className="font-semibold mb-2">🔒 Insured Funds</p>
              <p>All savings guaranteed up to ₦5M</p>
            </div>
            <div>
              <p className="font-semibold mb-2">🎯 Goal Tracking</p>
              <p>Automatic reminders and progress tracking</p>
            </div>
            <div>
              <p className="font-semibold mb-2">📈 Bonus Interest</p>
              <p>0.5% extra for maintaining 6+ months</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            📋 Transaction History
          </h2>

          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      transaction.type === 'deposit'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : transaction.type === 'withdrawal'
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {transaction.type === 'deposit'
                      ? '⬇️'
                      : transaction.type === 'withdrawal'
                      ? '⬆️'
                      : '📈'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.date}
                    </p>
                  </div>
                </div>

                <p
                  className={`font-semibold text-lg ${
                    transaction.type === 'deposit' || transaction.type === 'interest'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.type === 'deposit' || transaction.type === 'interest'
                    ? '+'
                    : '-'}
                  ₦{transaction.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
            View Full History
          </button>
        </div>
      </div>
    </div>
  );
}
