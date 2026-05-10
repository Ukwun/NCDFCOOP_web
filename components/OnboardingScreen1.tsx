'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

const SLIDES = [
  {
    image: '/images/onboarding/onboardingweb1.jpg',
    title: 'Welcome to',
    titleAccent: 'NCDFCOOP',
    subtitle: "Nigeria's controlled trade infrastructure for reliable buying and selling",
    features: null,
  },
  {
    image: '/images/onboarding/onboardingweb2.jpg',
    title: 'Membership',
    titleAccent: 'Benefits',
    subtitle: 'Unlock exclusive discounts at every tier — from Bronze to Platinum',
    features: [
      { icon: '🥉', label: 'Bronze — 5% off every purchase' },
      { icon: '🥈', label: 'Silver — 10% member discount' },
      { icon: '🥇', label: 'Gold — 15% on all products' },
      { icon: '💎', label: 'Platinum — 20% maximum savings' },
    ],
  },
  {
    image: '/images/onboarding/onboardingweb3.jpg',
    title: 'Unlock Wholesale',
    titleAccent: 'Power',
    subtitle: 'Take your business further with our cooperative wholesale platform',
    features: [
      { icon: '🏷️', label: 'Wholesale-priced products' },
      { icon: '🚚', label: 'Dedicated delivery support' },
      { icon: '💳', label: 'Flexible payment terms' },
      { icon: '📊', label: 'Sales analytics & insights' },
    ],
  },
];

const AUTO_ADVANCE_MS = 5000;

export default function OnboardingScreen1() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so timer callbacks always see latest slide index
  const slideRef = useRef(0);

  const advanceTo = useCallback((index: number) => {
    slideRef.current = index;
    setCurrentSlide(index);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const next = (slideRef.current + 1) % SLIDES.length;
      advanceTo(next);
      // chain next tick
    }, AUTO_ADVANCE_MS);
  }, [advanceTo]);

  // Auto-advance loop
  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentSlide, resetTimer]);

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advanceTo((slideRef.current + 1) % SLIDES.length);
  };

  const handleDotClick = (i: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advanceTo(i);
  };

  const handleGetStarted = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoading(true);
    try {
      await completeOnboarding();
      router.push('/signup');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsLoading(false);
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes ob-fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ob-bgFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ob-card-content {
          animation: ob-fadeIn 400ms ease-out forwards;
        }
        .ob-bg {
          animation: ob-bgFade 600ms ease-out forwards;
        }

        .ob-glass {
          background: rgba(255, 255, 255, 0.18);
          -webkit-backdrop-filter: blur(24px);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.55);
          border-left: 1px solid rgba(255,255,255,0.3);
          border-right: 1px solid rgba(255,255,255,0.3);
        }

        .ob-dot {
          width: 8px; height: 8px; border-radius: 50%;
          transition: all 300ms ease;
          cursor: pointer;
        }
        .ob-dot-active {
          width: 24px; border-radius: 4px;
          background: ${AppColors.primary};
        }
        .ob-dot-inactive {
          background: rgba(255,255,255,0.55);
        }
        .ob-dot-inactive:hover {
          background: rgba(255,255,255,0.85);
        }

        .ob-btn-primary {
          transition: all 220ms ease;
        }
        .ob-btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .ob-btn-secondary {
          transition: all 220ms ease;
        }
        .ob-btn-secondary:hover:not(:disabled) {
          background: rgba(255,255,255,0.25) !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Background images — preloaded & cross-faded */}
      <div className="relative flex min-h-screen items-end justify-center overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={i === currentSlide ? 'ob-bg' : ''}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${s.image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              backgroundColor: AppColors.border,
              opacity: i === currentSlide ? 1 : 0,
              transition: 'opacity 600ms ease',
              zIndex: 0,
            }}
          />
        ))}

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.28)', zIndex: 1 }} />

        {/* Glass card */}
        <div
          className="ob-glass relative w-full"
          style={{
            zIndex: 2,
            minHeight: '52%',
            borderRadius: '28px 28px 0 0',
            padding: `${AppSpacing.xxxl} ${AppSpacing.xxxl} 36px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Slide content */}
          <div
            key={currentSlide}
            className="ob-card-content"
          >
            {/* Title */}
            <h2 style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.sm,
              fontFamily: '"Libre Baskerville", serif',
              lineHeight: 1.25,
            }}>
              {slide.title}{' '}
              <span style={{ color: AppColors.accent }}>{slide.titleAccent}</span>
            </h2>

            {/* Subtitle */}
            <p style={{
              ...AppTextStyles.bodyLarge,
              color: AppColors.textSecondary,
              lineHeight: '1.6',
              marginBottom: slide.features ? AppSpacing.lg : 0,
            }}>
              {slide.subtitle}
            </p>

            {/* Feature list (slides 2 & 3) */}
            {slide.features && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {slide.features.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    backdropFilter: 'blur(8px)',
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                    <span style={{ ...AppTextStyles.bodyMedium, color: AppColors.textPrimary, fontWeight: 500 }}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: dots + buttons */}
          <div>
            {/* Progress dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`ob-dot ${i === currentSlide ? 'ob-dot-active' : 'ob-dot-inactive'}`}
                  onClick={() => handleDotClick(i)}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Get Started — always goes to auth */}
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="ob-btn-primary"
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: AppColors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  ...AppTextStyles.labelLarge,
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.65 : 1,
                }}
              >
                {isLoading ? 'Loading…' : 'Get Started'}
              </button>

              {/* Next — advances slide, loops */}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="ob-btn-secondary"
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.6)',
                  borderRadius: 12,
                  ...AppTextStyles.labelLarge,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.65 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
