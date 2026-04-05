/**
 * Animation Utilities
 * Reusable animation functions and CSS animations
 */

import { AnimationTiming } from '@/lib/theme/spacing';

/**
 * Get animation CSS for fade-in effect
 */
export const getFadeInAnimation = (duration: number = AnimationTiming.pageFade) => `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  animation: fadeIn ${duration}ms ease-in forwards;
`;

/**
 * Get animation CSS for slide-up effect
 */
export const getSlideUpAnimation = (duration: number = AnimationTiming.pageSlide) => `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  animation: slideUp ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

/**
 * Get animation CSS for fade-in with scale
 */
export const getFadeInScaleAnimation = (duration: number = AnimationTiming.normal) => `
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  animation: fadeInScale ${duration}ms ease-out forwards;
`;

/**
 * Get animation CSS for bounce effect
 */
export const getBounceAnimation = (duration: number = 600) => `
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }
  
  animation: bounce ${duration}ms ease-in-out infinite;
`;

/**
 * Get animation CSS for pulse effect
 */
export const getPulseAnimation = (duration: number = 2000) => `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  animation: pulse ${duration}ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

/**
 * Get animation CSS for shimmer loading effect
 */
export const getShimmerAnimation = () => `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  animation: shimmer 2s infinite;
`;

/**
 * Page transition animation styles
 */
export const PageTransitionAnimations = {
  fade: {
    name: 'pageTransitionFade',
    css: `
      @keyframes pageTransitionFade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
    duration: AnimationTiming.pageFade,
  },
  slideUp: {
    name: 'pageTransitionSlideUp',
    css: `
      @keyframes pageTransitionSlideUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    duration: AnimationTiming.pageSlide,
  },
  slideLeft: {
    name: 'pageTransitionSlideLeft',
    css: `
      @keyframes pageTransitionSlideLeft {
        from {
          opacity: 0;
          transform: translateX(40px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
    duration: AnimationTiming.pageSlide,
  },
} as const;

/**
 * Spring animation configuration
 */
export const SpringAnimations = {
  bounce: {
    tension: 300,
    friction: 10,
  },
  gentle: {
    tension: 200,
    friction: 26,
  },
  molasses: {
    tension: 280,
    friction: 60,
  },
} as const;

/**
 * Cubic bezier easing functions
 */
export const EasingFunctions = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOutCubic: 'cubic-bezier(0.33, 0.66, 0.66, 1)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  elasticOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

/**
 * Utility function to calculate animation delay
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50) => {
  return index * baseDelay;
};

/**
 * Create Tailwind CSS animation utility classes
 */
export const TailwindAnimationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideLeft: 'animate-slide-left',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;

/**
 * Animation delay classes for staggering
 */
export const AnimationDelayClasses = {
  delay0: 'animation-delay-0',
  delay100: 'animation-delay-100',
  delay200: 'animation-delay-200',
  delay300: 'animation-delay-300',
  delay400: 'animation-delay-400',
  delay500: 'animation-delay-500',
} as const;
