'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Vote {
  id: string;
  title: string;
  description: string;
  options: { label: string; votes: number }[];
  deadline: string;
  category: string;
  userVote?: string;
}

export default function MemberVotingPage() {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([
    {
      id: '1',
      title: 'Annual Board Member Election',
      description: 'Vote for the next board of directors for 2026-2027',
      category: 'Governance',
      deadline: 'Apr 15, 2026',
      options: [
        { label: 'Candidate A - Okafor Chinedu', votes: 245 },
        { label: 'Candidate B - Adeyemi Adekunle', votes: 187 },
        { label: 'Candidate C - Kofi Mensah', votes: 156 },
      ],
    },
    {
      id: '2',
      title: '2026 Member Dividend Allocation',
      description: 'How should we allocate this year\'s profits?',
      category: 'Financial',
      deadline: 'Apr 20, 2026',
      options: [
        { label: '40% dividends, 60% reinvestment', votes: 412 },
        { label: '60% dividends, 40% reinvestment', votes: 368 },
        { label: '50/50 split', votes: 278 },
      ],
    },
    {
      id: '3',
      title: 'Farmer Support Fund Budget',
      description: 'Approve the budget for supporting local farmers',
      category: 'Social Impact',
      deadline: 'Apr 25, 2026',
      options: [
        { label: '₦5M annual budget (approve)', votes: 831 },
        { label: '₦3M annual budget (proposed)', votes: 127 },
        { label: 'Reject increase', votes: 45 },
      ],
      userVote: '₦5M annual budget (approve)',
    },
  ]);

  const handleVote = (voteId: string, option: string) => {
    // TODO: Submit vote to backend
    setVotes((prevVotes) =>
      prevVotes.map((v) => (v.id === voteId ? { ...v, userVote: option } : v))
    );
    alert(`Vote recorded: ${option}`);
  };

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
              🗳️ Member Voting
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Have your voice heard in cooperative decisions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Active Votes */}
        {votes.map((vote) => (
          <div key={vote.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{vote.title}</h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                  {vote.category}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{vote.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ⏱️ Voting closes: {vote.deadline}
              </p>
            </div>

            {/* Voting Options */}
            <div className="space-y-3">
              {vote.options.map((option, idx) => {
                const totalVotes = vote.options.reduce((sum, o) => sum + o.votes, 0);
                const percentage = ((option.votes / totalVotes) * 100).toFixed(1);
                const isSelected = vote.userVote === option.label;

                return (
                  <button
                    key={idx}
                    onClick={() => handleVote(vote.id, option.label)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${
                          isSelected
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {isSelected && '✓ '}
                          {option.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          isSelected
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {option.votes} votes ({percentage}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          isSelected ? 'bg-blue-600' : 'bg-blue-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {vote.userVote && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Your vote recorded: {vote.userVote}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Voting Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4">✨ Voting Guidelines</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Each member gets one vote per motion</li>
            <li>• Votes are recorded and anonymous</li>
            <li>• You can change your vote until deadline</li>
            <li>• Voting is open 24/7 until the deadline</li>
            <li>• Results are announced after voting closes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
