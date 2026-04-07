/**
 * Google Analytics Integration
 * Tracks user behavior and conversions
 */

// Initialize Google Analytics
declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

export const initializeGoogleAnalytics = (measurementId: string) => {
  if (typeof window !== 'undefined' && !window.gtag) {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }
};

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

export const trackConversion = (value: number, currency: string = 'NGN', transactionId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      value: value,
      currency: currency,
      transaction_id: transactionId,
    });
  }
};

export const trackUserSignup = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: 'firebase',
    });
  }
};

export const trackUserLogin = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: 'email',
    });
  }
};
