/**
 * Code Splitting & Lazy Loading Configuration
 * 
 * Implements dynamic imports and lazy loading patterns for:
 * - React components (lazy-load heavy components)
 * - Routes (split bundle by page)
 * - Third-party libraries (load on demand)
 * - Heavy computations (defer non-critical work)
 * 
 * @author Performance Team
 * @version 1.0.0
 */

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

/**
 * Component loading strategy types
 */
export enum LoadingStrategy {
  EAGER = 'eager', // Load immediately
  LAZY = 'lazy', // Load on first use
  INTERACTION = 'interaction', // Load on user interaction
  VIEWPORT = 'viewport', // Load when visible in viewport
  IDLE = 'idle', // Load in idle time
}

/**
 * Create a lazy-loaded component with fallback
 * 
 * @param importFunc - Async import function
 * @param options - Lazy loading options
 * @returns Lazy-loaded component
 * 
 * @example
 * const HeavyModal = createLazyComponent(
 *   () => import('@/components/HeavyModal'),
 *   { 
 *     fallback: <Loading />,
 *     ssr: false 
 *   }
 * )
 */
export function createLazyComponent(
  importFunc: () => Promise<any>,
  options: {
    fallback?: React.ReactNode;
    ssr?: boolean;
    loading?: React.ComponentType<any>;
  } = {}
) {
  return dynamic(importFunc, {
    loading: options.loading,
    ssr: options.ssr ?? true,
  });
}

/**
 * Create multiple lazy-loaded components in parallel
 * 
 * @param componentMap - Map of component names to import functions
 * @param options - Shared lazy loading options
 * @returns Map of lazy-loaded components
 * 
 * @example
 * const components = createLazyComponents({
 *   Modal: () => import('@/components/Modal'),
 *   Drawer: () => import('@/components/Drawer'),
 * });
 */
export function createLazyComponents(
  componentMap: Record<string, () => Promise<any>>,
  options: {
    fallback?: React.ReactNode;
    ssr?: boolean;
  } = {}
) {
  const lazyComponents: Record<string, React.ComponentType> = {};

  for (const [name, importFunc] of Object.entries(componentMap)) {
    lazyComponents[name] = dynamic(importFunc, {
      ssr: options.ssr ?? true,
    });
  }

  return lazyComponents;
}

/**
 * Route-based code splitting configuration
 * Maps routes to their bundled components
 */
export const routeCodeSplitting = {
  '/': {
    component: () => import('@/components/HomeScreen'),
    priority: 'high',
    preload: true,
    bundle: 'home',
  },
  '/products': {
    component: () => import('@/components/HomeScreen'), // Products section
    priority: 'high',
    preload: true,
    bundle: 'products',
  },
  '/offers': {
    component: () => import('@/components/OfferScreen'),
    priority: 'medium',
    preload: false,
    bundle: 'offers',
  },
  '/cart': {
    component: () => import('@/components/CartScreen'),
    priority: 'high',
    preload: true,
    bundle: 'cart',
  },
  '/messages': {
    component: () => import('@/components/MessageScreen'),
    priority: 'medium',
    preload: false,
    bundle: 'messages',
  },
  '/account': {
    component: () => import('@/components/MyNCDFCOOPScreen'),
    priority: 'medium',
    preload: false,
    bundle: 'account',
  },
};

/**
 * Get lazy-loaded component for a route
 * 
 * @param route - Route path
 * @returns Lazy-loaded component
 * 
 * @example
 * const OfferComponent = getLazyRouteComponent('/offers');
 */
export function getLazyRouteComponent(route: string) {
  const routeConfig = routeCodeSplitting[route as keyof typeof routeCodeSplitting];

  if (!routeConfig) {
    console.warn(`No code splitting configuration for route: ${route}`);
    return null;
  }

  return dynamic(routeConfig.component as any, {
    ssr: true,
  });
}

/**
 * Component-level lazy loading configuration
 * Defines which heavy components should be lazy-loaded
 */
export const componentLazyLoadingConfig = {
  // Modals and overlays (heavy, used on demand)
  ConfirmDialog: {
    strategy: LoadingStrategy.INTERACTION,
    size: 'large', // ~50KB
    priority: 'low',
  },
  ImageGallery: {
    strategy: LoadingStrategy.LAZY,
    size: 'large', // ~80KB
    priority: 'low',
  },
  RichTextEditor: {
    strategy: LoadingStrategy.INTERACTION,
    size: 'xlarge', // ~150KB
    priority: 'low',
  },

  // Charts and visualizations
  AnalyticsChart: {
    strategy: LoadingStrategy.VIEWPORT,
    size: 'medium', // ~40KB
    priority: 'low',
  },

  // Heavy data tables
  DataTable: {
    strategy: LoadingStrategy.LAZY,
    size: 'medium', // ~60KB
    priority: 'low',
  },

  // Payment forms (security-sensitive)
  PaymentForm: {
    strategy: LoadingStrategy.INTERACTION,
    size: 'large', // ~100KB
    priority: 'high',
  },

  // Maps (external dependency)
  Map: {
    strategy: LoadingStrategy.VIEWPORT,
    size: 'xlarge', // ~200KB
    priority: 'low',
  },
};

/**
 * Library lazy loading configuration
 * Third-party libraries to load on demand
 */
export const libraryLazyLoadingConfig = {
  // PDF generation
  pdfLib: {
    import: () => import('pdf-lib'),
    trigger: 'export-pdf',
    size: 'large',
  },

  // Advanced charts
  recharts: {
    import: () => import('recharts'),
    trigger: 'view-analytics',
    size: 'large',
  },

  // Rich text editing
  tinymce: {
    import: () => import('tinymce'),
    trigger: 'edit-content',
    size: 'xlarge',
  },

  // Maps
  mapbox: {
    import: () => import('mapbox-gl'),
    trigger: 'view-map',
    size: 'xlarge',
  },

  // QR code generation
  qrCode: {
    import: () => import('qrcode.react'),
    trigger: 'generate-qr',
    size: 'small',
  },

  // Date/time library
  dayjs: {
    import: () => import('dayjs'),
    trigger: 'format-date',
    size: 'small',
  },
};

/**
 * Preload a route's resources
 * Useful for likely next navigation
 * 
 * @param route - Route to preload
 * 
 * @example
 * // In header, preload '/cart' for better UX
 * preloadRoute('/cart');
 */
export function preloadRoute(route: string) {
  const routeConfig = routeCodeSplitting[route as keyof typeof routeCodeSplitting];

  if (!routeConfig || !routeConfig.preload) {
    return;
  }

  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.href = `/_next/static/chunks/${routeConfig.bundle}.js`;
    document.head.appendChild(link);
  }
}

/**
 * Dynamically import a library when needed
 * 
 * @param libraryName - Library name
 * @returns Promise resolving to library
 * 
 * @example
 * const qr = await dynamicImportLibrary('qrCode');
 */
export async function dynamicImportLibrary(
  libraryName: keyof typeof libraryLazyLoadingConfig
) {
  const config = libraryLazyLoadingConfig[libraryName];

  if (!config) {
    throw new Error(`Unknown library: ${libraryName}`);
  }

  try {
    return await config.import();
  } catch (error) {
    console.error(`Failed to load library: ${libraryName}`, error);
    throw error;
  }
}

/**
 * Track chunk loading performance
 * 
 * @param chunkName - Name of the chunk
 * @param duration - Time to load chunk in ms
 * 
 * @example
 * const start = performance.now();
 * const Component = await dynamicImportLibrary('recharts');
 * trackChunkLoad('recharts', performance.now() - start);
 */
export function trackChunkLoad(chunkName: string, duration: number) {
  const isSlowLoad = duration > 500; // More than 500ms

  const metrics = {
    chunk: chunkName,
    duration: `${duration.toFixed(2)}ms`,
    slow: isSlowLoad,
    timestamp: new Date().toISOString(),
  };

  if (isSlowLoad) {
    console.warn('⚠️ Slow chunk load:', metrics);
  } else {
    console.debug('📦 Chunk loaded:', metrics);
  }

  // Send to analytics/monitoring
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'chunk_loaded', {
      chunk_name: chunkName,
      duration: duration,
      slow: isSlowLoad,
    });
  }
}

/**
 * Batch lazy import multiple chunks
 * Load multiple chunks in parallel
 * 
 * @param chunks - Array of import functions
 * @returns Promise resolving to array of imported modules
 * 
 * @example
 * const modules = await batchLazyImport([
 *   () => import('@/lib/chart'),
 *   () => import('@/lib/export'),
 * ]);
 */
export async function batchLazyImport(
  chunks: Array<() => Promise<any>>
): Promise<any[]> {
  return Promise.all(chunks.map((importFunc) => importFunc()));
}

/**
 * Create a resource hint for preloading
 * 
 * @param href - Resource URL
 * @param type - Resource type (script, style, font)
 * @param as - AS attribute value
 * 
 * @example
 * createResourceHint('/fonts/custom.woff2', 'preload', 'font');
 */
export function createResourceHint(
  href: string,
  type: 'preload' | 'prefetch' | 'preconnect',
  as?: string
) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = type;
  if (as) link.as = as;
  link.href = href;

  // For fonts, add crossorigin
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Web Workers for code splitting
 * Offload heavy computation to worker thread
 * 
 * @param workerPath - Path to worker file
 * @param data - Data to send to worker
 * @returns Promise resolving to worker result
 * 
 * @example
 * const result = await executeInWorker(
 *   '/workers/imageProcessor.js',
 *   { image, filters }
 * );
 */
export function executeInWorker(
  workerPath: string,
  data: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Web Workers only available in browser'));
      return;
    }

    const worker = new Worker(workerPath);

    worker.onmessage = (event) => {
      resolve(event.data);
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage(data);
  });
}

export default {
  LoadingStrategy,
  createLazyComponent,
  createLazyComponents,
  routeCodeSplitting,
  getLazyRouteComponent,
  componentLazyLoadingConfig,
  libraryLazyLoadingConfig,
  preloadRoute,
  dynamicImportLibrary,
  trackChunkLoad,
  batchLazyImport,
  createResourceHint,
  executeInWorker,
};
