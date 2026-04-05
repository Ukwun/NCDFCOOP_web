'use client';

import WelcomeScreen from '@/components/WelcomeScreen';

export default function WelcomePage() {
  return <WelcomeScreen />;
}

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to NCDFCOOP Fairmarket
        </h1>
        <p className="text-xl text-gray-100 mb-8">
          Choose your role and start shopping or selling today
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="font-bold mb-2">Shop Smart</h3>
            <p className="text-sm text-gray-200">Access quality products with member discounts</p>
          </div>
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl mb-3">🏪</div>
            <h3 className="font-bold mb-2">Buy Wholesale</h3>
            <p className="text-sm text-gray-200">Bulk pricing for businesses and resellers</p>
          </div>
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-bold mb-2">Start Selling</h3>
            <p className="text-sm text-gray-200">Reach verified buyers on our marketplace</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={() => router.push('/auth/login')}
            className="px-8 py-3 bg-[#C9A227] hover:bg-[#B89015] text-[#1A472A] font-semibold rounded-lg transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-8 py-3 border-2 border-white hover:bg-white/10 text-white font-semibold rounded-lg transition-colors"
          >
            Create Account
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-300">
          NCDFCOOP Commerce - Member-focused marketplace with fair prices and community values
        </p>
      </div>
    </div>
  );
}
