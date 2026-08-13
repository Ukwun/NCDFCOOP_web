'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen({ autoNavigate = true }: { autoNavigate?: boolean }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!autoNavigate) return;

    const timer = window.setTimeout(() => {
      router.push('/signin');
    }, 500);

    return () => window.clearTimeout(timer);
  }, [autoNavigate, router]);

  return (
    <main
      className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#052E21] px-5 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      aria-label="CoopX is loading"
    >
      <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-lime-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative w-full max-w-2xl text-center">
        <div className="coopx-logo-intro relative mx-auto overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
          <Image
            src="/images/logo/coopx-logo-full.jpg"
            alt="CoopX — Powering the Agri Value Chain"
            width={1400}
            height={510}
            className="h-auto w-full object-contain"
            priority
          />
          <span className="coopx-logo-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/75 to-transparent" aria-hidden="true" />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-400" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 animation-delay-200" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white/75 animation-delay-400" />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-[0.22em] text-emerald-100 sm:text-base">
          CONNECTING THE AGRI VALUE CHAIN
        </p>
      </div>

      <style jsx global>{`
        @keyframes coopxLogoEnter {
          0% { opacity: 0; transform: translateY(20px) scale(0.88); filter: blur(8px); }
          65% { opacity: 1; transform: translateY(-3px) scale(1.02); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes coopxLogoSheen {
          0%, 28% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          42% { opacity: 0.9; }
          70%, 100% { transform: translateX(470%) skewX(-18deg); opacity: 0; }
        }
        .coopx-logo-intro {
          animation: coopxLogoEnter 550ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .coopx-logo-sheen {
          animation: coopxLogoSheen 800ms ease-out 200ms both;
        }
        @media (prefers-reduced-motion: reduce) {
          .coopx-logo-intro,
          .coopx-logo-sheen {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
