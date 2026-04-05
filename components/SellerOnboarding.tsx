'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';

// Step 1: Landing
export function SellerOnboardingStep1({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-6">🚀</div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Start Your Selling Journey
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Reach verified buyers in our NCDFCOOP cooperative and start earning money from your products.
      </p>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Why Sell on NCDFCOOP?</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 text-left">
          <li>✓ Reach verified members and bulk buyers</li>
          <li>✓ Competitive seller commission rates</li>
          <li>✓ Built-in payment and logistics support</li>
          <li>✓ Dedicated seller support team</li>
        </ul>
      </div>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Start Selling
      </button>
    </div>
  );
}

// Step 2: Business Setup
export function SellerOnboardingStep2({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    location: '',
    category: '',
    targetCustomer: 'individual',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Set Up Your Business Profile
      </h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Business Name *
          </label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Business Type *
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="individual">Individual Seller</option>
            <option value="business">Business</option>
            <option value="cooperative">Cooperative</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Location *
          </label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="City/State"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Primary Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          >
            <option value="">Select a category</option>
            <option value="groceries">Groceries & Food</option>
            <option value="clothing">Clothing & Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="home">Home & Garden</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Target Customer *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.targetCustomer === 'individual'}
                onChange={() => setFormData({ ...formData, targetCustomer: 'individual' })}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">Individual Customers</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.targetCustomer === 'bulk'}
                onChange={() => setFormData({ ...formData, targetCustomer: 'bulk' })}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">Bulk Buyers</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 3: Upload First Product
export function SellerOnboardingStep3({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    price: '',
    quantity: '',
    moq: '1',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Upload Your First Product
      </h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            🟡 <strong>Your product will be reviewed before it goes live.</strong> This ensures quality and trust.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Price (₦) *
          </label>
          <input
            type="number"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Available Quantity *
          </label>
          <input
            type="number"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Minimum Order Quantity
          </label>
          <input
            type="number"
            value={formData.moq}
            onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Submit Product
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 4: Product Review Status
export function SellerOnboardingStep4({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">🟡</div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Product Submitted for Review
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Your product will be reviewed by our team within 24-48 hours to ensure quality and compliance.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Why Approval Matters</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>✓ <strong>Quality Assurance:</strong> We verify product authenticity</li>
          <li>✓ <strong>Buyer Trust:</strong> Buyers know what they're getting</li>
          <li>✓ <strong>Fraud Prevention:</strong> Platform-wide protection</li>
          <li>✓ <strong>Export Compliance:</strong> Legal requirements met</li>
        </ul>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You can submit more products while awaiting review. Your dashboard will show approval status.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Add Another Product
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}

// Main Seller Onboarding Component
export default function SellerOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleNext = async (data?: any) => {
    setLoading(true);
    try {
      if (step === 4) {
        // Complete onboarding and redirect to home
        router.push('/home');
      } else {
        setStep(step + 1);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded-full transition-all ${
                  s <= step
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Step {step} of 5
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {step === 1 && <SellerOnboardingStep1 onNext={handleNext} />}
          {step === 2 && <SellerOnboardingStep2 onNext={handleNext} onBack={handleBack} />}
          {step === 3 && <SellerOnboardingStep3 onNext={handleNext} onBack={handleBack} />}
          {step === 4 && <SellerOnboardingStep4 onNext={handleNext} onBack={handleBack} />}
        </div>
      </div>
    </div>
  );
}
