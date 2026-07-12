'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

interface Referral {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: 'pending' | 'active' | 'completed';
  bonusEarned?: number;
}

export default function ReferralProgramPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const referralLink = useMemo(() => {
    if (!referralCode) return '';
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return `${origin}/signup?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !db) {
        setLoading(false);
        return;
      }
      try {
        const [memberSnapshot, referralSnapshot] = await Promise.all([
          getDoc(doc(db, COLLECTIONS.MEMBERS, user.uid)),
          getDocs(collection(db, COLLECTIONS.MEMBERS, user.uid, 'referrals')),
        ]);
        setReferralCode(String(memberSnapshot.data()?.referralCode || ''));
        setReferrals(referralSnapshot.docs.map((item) => {
          const data = item.data();
          const joined = data.createdAt?.toDate?.();
          return {
            id: item.id,
            name: String(data.referredName || data.name || 'Invited member'),
            email: String(data.referredEmail || data.email || ''),
            joinDate: joined ? joined.toLocaleDateString() : 'Pending signup',
            status: ['active', 'completed'].includes(data.status) ? data.status : 'pending',
            bonusEarned: Number(data.bonusEarned || 0),
          } as Referral;
        }));
      } catch {
        setNotice('Referral activity could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.uid]);

  const stats = {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter((r) => r.status !== 'pending').length,
    totalBonusEarned: referrals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.bonusEarned || 0), 0),
  };

  const copyToClipboard = async (value = referralLink) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const share = (channel: 'whatsapp' | 'twitter' | 'facebook' | 'email') => {
    if (!referralLink) return;
    const message = `Join NCDFCOOP with my referral link: ${referralLink}`;
    const targets = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      email: `mailto:?subject=${encodeURIComponent('Join me on NCDFCOOP')}&body=${encodeURIComponent(message)}`,
    };
    window.open(targets[channel], '_blank', 'noopener,noreferrer');
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
              👥 Referral Program
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Earn bonuses by inviting friends to COOP Commerce
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Referrals</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalReferrals}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {stats.activeReferrals} active referrals
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Bonus Earned</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{stats.totalBonusEarned.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              From completed referrals
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-sm">
            <p className="text-blue-100 text-sm mb-2">Next Bonus</p>
            <p className="text-3xl font-bold">₦2,500</p>
            <p className="text-xs text-blue-200 mt-2">
              Bonuses are credited after a referred member qualifies
            </p>
          </div>
        </div>

        {/* Share Your Referral Link */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            🔗 Share Your Referral Link
          </h2>

          {notice && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{notice}</p>}
          {loading && <p className="text-sm text-gray-500">Loading your referral activity…</p>}
          {!loading && referrals.length === 0 && <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">No referral activity yet. Share your unique link to get started.</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <button onClick={() => void copyToClipboard(referralCode)} disabled={!referralCode} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium">
                  Copy Code
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referral Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={() => void copyToClipboard()}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    copiedLink
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedLink ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Share on social media:
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => share('whatsapp')} disabled={!referralLink} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                📱 WhatsApp
              </button>
              <button onClick={() => share('twitter')} disabled={!referralLink} className="px-4 py-2 bg-blue-400 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                𝕏 Twitter
              </button>
              <button onClick={() => share('facebook')} disabled={!referralLink} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                f Facebook
              </button>
              <button onClick={() => share('email')} disabled={!referralLink} className="px-4 py-2 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                📧 Email
              </button>
            </div>
          </div>
        </div>

        {/* How to Earn */}
        <div className="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg p-8">
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-6">
            💡 How to Earn Referral Bonuses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 1: Share</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Send your referral link to friends and family members
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 2: They Sign Up</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                They create an account using your referral link or code
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 3: Verify</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                They complete their profile and make their first purchase (₦5,000+)
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 4: Bonus!</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Earn ₦2,500 credit + 2% of their first purchase value
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong className="text-amber-900 dark:text-amber-100">Bonus Cap:</strong> Maximum ₦50,000 per month in referral bonuses
            </p>
          </div>
        </div>

        {/* Referral Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            📊 Your Referrals
          </h2>

          <div className="space-y-4">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{referral.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{referral.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Joined: {referral.joinDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {referral.bonusEarned && (
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +₦{referral.bonusEarned.toLocaleString()}
                      </p>
                    )}
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        referral.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : referral.status === 'active'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {referral.status.charAt(0).toUpperCase() +
                        referral.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
