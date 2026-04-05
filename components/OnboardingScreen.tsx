'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { trackActivity } from '@/lib/analytics/activityTracker';

interface OnboardingSlide {
  id: number;
  image: string;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    image: '/images/onboarding/community.jpg',
    title: 'Welcome to NCDFCOOP',
    description: 'Join millions of members saving, shopping, and building wealth together',
  },
  {
    id: 2,
    image: '/images/onboarding/shopping.jpg',
    title: 'Shop Smart',
    description: 'Browse exclusive products with member-only discounts and deals',
  },
  {
    id: 3,
    image: '/images/onboarding/purchases.jpg',
    title: 'Earn Rewards',
    description: 'Every purchase earns loyalty points and brings you closer to premium tiers',
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = async () => {
    await trackActivity('onboarding_skipped', { slideCount: currentSlide + 1 }, user?.uid);
    onComplete();
  };

  const handleComplete = async () => {
    await trackActivity('onboarding_completed', { totalSlides: slides.length }, user?.uid);
    onComplete();
  };

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col">
      {/* Image Container */}
      <div className="relative w-full h-1/2 bg-gradient-to-b from-blue-50 to-transparent dark:from-gray-800">
        <Image
          src={slide.image}
          alt={slide.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col justify-between p-6 md:p-8">
        {/* Text Content */}
        <div>
          {/* Progress Indicator */}
          <div className="flex gap-1 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentSlide
                    ? 'bg-blue-600 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {slide.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          {/* Next/Complete Button */}
          {currentSlide < slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Get Started
            </button>
          )}

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Skip Tour
          </button>
        </div>
      </div>
    </div>
  );
}
