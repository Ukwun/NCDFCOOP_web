'use client';

import OnboardingScreen1 from '@/components/OnboardingScreen1';

export default function OnboardingPage() {
  return <OnboardingScreen1 />;
}
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await completeOnboarding();
      router.push('/role-selection');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A472A] to-[#0B6B3A] text-white p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        <div className="text-6xl mb-6">🎓</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to NCDFCOOP</h1>
        <p className="text-xl text-gray-100 mb-8">
          Learn about the platform and discover how to maximize your experience
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl mb-3">🛍️</div>
            <h3 className="font-bold mb-2">Smart Shopping</h3>
            <p className="text-sm text-gray-200">Discover quality products at fair prices</p>
          </div>
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold mb-2">Save More</h3>
            <p className="text-sm text-gray-200">Earn rewards with every purchase</p>
          </div>
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="font-bold mb-2">Be Part of Community</h3>
            <p className="text-sm text-gray-200">Join our cooperative movement</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleComplete}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#C9A227] hover:bg-[#B89015] text-[#1A472A]'
            }`}
          >
            {loading ? 'Starting...' : 'Get Started →'}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-white/30 hover:bg-white/10 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
