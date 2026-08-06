"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, CreditCard, Truck, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";

type CoopXOnboardingProps = {
  initialSlide?: number;
};

const SLIDES = [
  {
    image: "/images/onboarding/coopx-figma-1.jpg",
    title: "Welcome to CoopX",
    subtitle: "Nigeria's controlled trade infrastructure for reliable buying and selling.",
    features: null,
  },
  {
    image: "/images/onboarding/coopx-figma-2.jpg",
    title: "Membership Benefits",
    subtitle: "Unlock exclusive discounts at every tier — from Bronze to Platinum.",
    features: [
      { icon: "🥉", title: "Bronze", description: "5% off every purchase" },
      { icon: "🥈", title: "Silver", description: "10% member discount" },
      { icon: "🥇", title: "Gold", description: "15% on all products" },
      { icon: "💎", title: "Platinum", description: "20% maximum savings" },
    ],
  },
  {
    image: "/images/onboarding/coopx-figma-3.jpg",
    title: "Unlock Wholesale Power",
    subtitle: "Take your business further with our cooperative wholesale platform.",
    features: [
      { icon: "tag", title: "Wholesale-priced products", description: "" },
      { icon: "truck", title: "Dedicated delivery support", description: "" },
      { icon: "card", title: "Flexible payment terms", description: "" },
      { icon: "chart", title: "Sales analytics & insights", description: "" },
    ],
  },
] as const;

function Brand() {
  return (
    <div className="inline-flex rounded-xl bg-white" aria-label="CoopX">
      <Image
        src="/images/logo/coopx-logo-nav.jpg"
        alt="CoopX"
        width={196}
        height={50}
        className="h-auto w-40 object-contain sm:w-48"
        priority
      />
    </div>
  );
}

function WholesaleIcon({ name }: { name: string }) {
  const className = "h-6 w-6 text-emerald-700";
  if (name === "truck") return <Truck className={className} aria-hidden="true" />;
  if (name === "card") return <CreditCard className={className} aria-hidden="true" />;
  if (name === "chart") return <BarChart3 className={className} aria-hidden="true" />;
  return <span className="text-xl" aria-hidden="true">🏷️</span>;
}

export default function CoopXOnboarding({ initialSlide = 0 }: CoopXOnboardingProps) {
  const router = useRouter();
  const { completeOnboarding, user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(Math.min(Math.max(initialSlide, 0), SLIDES.length - 1));
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState("");
  const touchStartX = useRef<number | null>(null);
  const slide = SLIDES[currentSlide];

  useEffect(() => {
    router.prefetch("/signin");
    router.prefetch("/signup");
    router.prefetch("/role-selection");
  }, [router]);

  const moveTo = useCallback((index: number) => {
    setCurrentSlide((index + SLIDES.length) % SLIDES.length);
  }, []);

  const continueTo = async (destination: "/signin" | "/signup") => {
    if (isNavigating) return;
    setError("");
    setIsNavigating(true);
    try {
      await completeOnboarding();
      router.push(user && destination === "/signup" ? "/role-selection" : destination);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "We could not continue. Please try again.");
      setIsNavigating(false);
    }
  };

  return (
    <main
      className="min-h-[100dvh] bg-white px-4 py-4 text-slate-950 sm:px-6 sm:py-6 lg:flex lg:items-center lg:px-8"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") moveTo(currentSlide - 1);
        if (event.key === "ArrowRight") moveTo(currentSlide + 1);
      }}
    >
      <div className="mx-auto grid w-full max-w-[1440px] overflow-hidden rounded-[2rem] bg-white lg:min-h-[min(930px,calc(100dvh-48px))] lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        <section
          className="group relative min-h-[38dvh] overflow-hidden rounded-[1.75rem] bg-emerald-950 sm:min-h-[48dvh] lg:min-h-0"
          aria-label={`Onboarding slide ${currentSlide + 1} of ${SLIDES.length}: ${slide.title}`}
          onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
            if (Math.abs(delta) > 55) moveTo(currentSlide + (delta < 0 ? 1 : -1));
            touchStartX.current = null;
          }}
        >
          {SLIDES.map((item, index) => (
            <div
              key={item.image}
              className={`absolute inset-0 bg-no-repeat transition-all duration-700 ease-out motion-reduce:transition-none ${index === currentSlide ? "scale-100 opacity-100" : "pointer-events-none scale-[1.025] opacity-0"}`}
              style={{
                backgroundImage: `url(${item.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden="true"
            />
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />

          <button
            type="button"
            onClick={() => moveTo(currentSlide - 1)}
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition hover:scale-105 hover:bg-black/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 lg:opacity-0"
            aria-label="Previous onboarding slide"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => moveTo(currentSlide + 1)}
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition hover:scale-105 hover:bg-black/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 lg:opacity-0"
            aria-label="Next onboarding slide"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2" role="tablist" aria-label="Onboarding slides">
            {SLIDES.map((item, index) => (
              <button
                type="button"
                key={item.title}
                onClick={() => moveTo(index)}
                className={`h-3 rounded-full border border-white/40 shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 ${index === currentSlide ? "w-10 bg-white" : "w-3 bg-white/50 hover:scale-110 hover:bg-white/85"}`}
                aria-label={`Show slide ${index + 1}: ${item.title}`}
                aria-selected={index === currentSlide}
                role="tab"
              />
            ))}
          </div>
        </section>

        <section className="flex min-h-[560px] items-center px-2 py-10 sm:px-10 lg:px-8 lg:py-12 xl:px-16">
          <div key={currentSlide} className="coopx-onboarding-enter mx-auto w-full max-w-[520px]">
            <Brand />
            <div className="mt-12 lg:mt-16">
              <h1 className="text-[2.15rem] font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl">{slide.title}</h1>
              <p className="mt-4 max-w-lg text-base font-medium leading-6 text-slate-500 sm:text-xl sm:leading-7">{slide.subtitle}</p>
            </div>

            {slide.features && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-5">
                {slide.features.map((feature) => (
                  <article key={feature.title} className="min-h-32 rounded-xl border border-slate-200 bg-slate-50 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow-lg motion-reduce:transform-none sm:min-h-36 sm:p-6">
                    <div className="flex items-center gap-3">
                      {currentSlide === 2 ? <WholesaleIcon name={feature.icon} /> : <span className="text-xl" aria-hidden="true">{feature.icon}</span>}
                      <h2 className="text-lg font-bold leading-5 text-emerald-900 sm:text-xl">{feature.title}</h2>
                    </div>
                    {feature.description && <p className="mt-5 text-base font-medium leading-6 text-slate-500 sm:text-lg">{feature.description}</p>}
                  </article>
                ))}
              </div>
            )}

            <div className={`${slide.features ? "mt-8" : "mt-16"} space-y-4`}>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button
                type="button"
                onClick={() => void continueTo("/signin")}
                disabled={isNavigating}
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-6 font-bold text-emerald-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/25 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
              >
                Login to an existing account
                <UserCircle className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void continueTo("/signup")}
                disabled={isNavigating}
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-emerald-800 px-6 font-bold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/30 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
              >
                {isNavigating ? "Opening your account…" : "Create a new account"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-7 text-center text-sm leading-6 text-slate-500 sm:text-base">
              Creating a CoopX account means you agree to the{" "}
              <Link href="/privacy" className="font-semibold text-slate-950 underline underline-offset-2 hover:text-emerald-800">Privacy Policy</Link>{" "}
              and{" "}
              <Link href="/terms" className="font-semibold text-slate-950 underline underline-offset-2 hover:text-emerald-800">Terms of Service</Link>.
            </p>
          </div>
        </section>
      </div>
      <style jsx global>{`
        @keyframes coopxOnboardingEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .coopx-onboarding-enter {
          animation: coopxOnboardingEnter 450ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .coopx-onboarding-enter { animation: none; }
        }
      `}</style>
    </main>
  );
}
