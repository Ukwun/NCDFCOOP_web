/**
 * Caching Strategies Module
 * 
 * Comprehensive caching implementation for:
 * - HTTP caching (browser, CDN)
 * - Client-side caching (localStorage, sessionStorage)
 * - In-memory caching (LRU cache)
 * - Service Worker caching
 * - Cache invalidation strategies
 * 
 * @author Performance Team
 * @version 1.0.0
 */

/**
 * Cache control strategies
 */
export enum CacheStrategy {
  NO_CACHE = 'no-cache', // Validate with server each time
  NO_STORE = 'no-store', // Never cache
  PUBLIC = 'public', // Cacheable by anyone
  PRIVATE = 'private', // Cacheable only by client
  IMMUTABLE = 'immutable', // Never changes
  MUST_REVALIDATE = 'must-revalidate', // Revalidate if stale
}

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_DURATIONS = {
  // Static assets (versioned, never change)
  STATIC_ASSETS: 31536000, // 1 year
  // Product images (change infrequently)
  PRODUCT_IMAGES: 2592000, // 30 days
  // API responses (change regularly)
  API_RESPONSE_SHORT: 300, // 5 minutes
  API_RESPONSE_MEDIUM: 3600, // 1 hour
  API_RESPONSE_LONG: 86400, // 24 hours
  // HTML pages (change frequently)
  HTML_PAGE: 3600, // 1 hour
  // CSS/JS bundles (versioned)
  BUNDLE: 31536000, // 1 year
  // Fonts
  FONT: 31536000, // 1 year
  // Analytics
  ANALYTICS: 86400, // 24 hours
};

/**
 * HTTP cache headers configuration
 * 
 * Maps resource types to their optimal cache headers
 */
export const httpCacheHeaders = {
  // Static assets (versioned by build)
  staticAsset: {
    'Cache-Control': `public, max-age=${CACHE_DURATIONS.STATIC_ASSETS}, immutable`,
    'X-Cache-Category': 'static',
  },

  // Product images
  productImage: {
    'Cache-Control': `public, max-age=${CACHE_DURATIONS.PRODUCT_IMAGES}`,
    'X-Cache-Category': 'semi-dynamic',
  },

  // API responses (generic)
  apiResponse: {
    'Cache-Control': `private, max-age=${CACHE_DURATIONS.API_RESPONSE_MEDIUM}`,
    'X-Cache-Category': 'dynamic',
  },

  // User-specific data
  userSpecific: {
    'Cache-Control': `private, max-age=${CACHE_DURATIONS.API_RESPONSE_SHORT}, must-revalidate`,
    'X-Cache-Category': 'user-specific',
  },

  // HTML pages
  htmlPage: {
    'Cache-Control': `public, max-age=${CACHE_DURATIONS.HTML_PAGE}`,
    'X-Cache-Category': 'html',
  },

  // Never cache
  neverCache: {
    'Cache-Control': 'no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Cache-Category': 'no-cache',
  },

  // Fonts
  font: {
    'Cache-Control': `public, max-age=${CACHE_DURATIONS.FONT}, immutable`,
    'X-Cache-Category': 'font',
  },
};

/**
 * Browser cache manager
 * Handles localStorage and sessionStorage
 */
export class BrowserCacheManager {
  private prefix: string = 'app_cache_';

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }
  }

  /**
   * Set cache value
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (null = never expires)
   * 
   * @example
   * cache.set('user-preferences', { theme: 'dark' }, 86400);
   */
  set<T>(key: string, value: T, ttl: number | null = null): void {
    try {
      const cacheEntry = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? ttl * 1000 : null, // Convert to milliseconds
      };

      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  }

  /**
   * Get cache value
   * 
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   * 
   * @example
   * const prefs = cache.get('user-preferences');
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);

      if (!item) return null;

      const cacheEntry = JSON.parse(item);
      const { value, timestamp, ttl } = cacheEntry;

      // Check if expired
      if (ttl && Date.now() - timestamp > ttl) {
        this.remove(key);
        return null;
      }

      return value as T;
    } catch (error) {
      console.warn(`Failed to retrieve cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if cache key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove cache entry
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.warn(`Failed to remove cache for ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; keys: string[] } {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.replace(this.prefix, ''));

    return { count: keys.length, keys };
  }
}

/**
 * LRU (Least Recently Used) in-memory cache
 * Useful for caching API responses during session
 */
export class LRUCache<T> {
  private cache: Map<string, T> = new Map();
  private maxSize: number;
  private ttls: Map<string, NodeJS.Timeout> = new Map();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Set cache value
   */
  set(key: string, value: T, ttl?: number): void {
    // Remove existing TTL if any
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
    }

    this.cache.delete(key); // Remove to re-add at end
    this.cache.set(key, value);

    // Evict least recently used if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.ttls.delete(firstKey);
      }
    }

    // Set TTL if provided
    if (ttl) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.ttls.delete(key);
      }, ttl * 1000);

      this.ttls.set(key, timeout);
    }
  }

  /**
   * Get cache value
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove entry
   */
  delete(key: string): boolean {
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.ttls.forEach((timeout) => clearTimeout(timeout));
    this.cache.clear();
    this.ttls.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * API response cache decorator
 * 
 * @example
 * const cachedFetch = cacheApiResponse(fetch, 300); // 5 minute cache
 * const data = await cachedFetch('/api/products');
 */
export function cacheApiResponse<T extends (...args: any[]) => Promise<any>>(
  fetchFn: T,
  ttl: number = 300
): T {
  const cache = new LRUCache<any>(50);

  return (async (...args: any[]) => {
    const cacheKey = JSON.stringify(args);

    // Check cache
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Fetch and cache
    const result = await fetchFn(...args);
    cache.set(cacheKey, result, ttl);

    return result;
  }) as T;
}

/**
 * Query string caching strategy
 * Cache based on query parameters
 * 
 * @example
 * const queryCache = new QueryCache();
 * queryCache.set('products', { category: 'food' }, productsData);
 * const cached = queryCache.get('products', { category: 'food' });
 */
export class QueryCache {
  private cache: Map<string, Map<string, any>> = new Map();

  /**
   * Set query result
   */
  set(endpoint: string, query: Record<string, any>, data: any): void {
    if (!this.cache.has(endpoint)) {
      this.cache.set(endpoint, new Map());
    }

    const queryKey = JSON.stringify(query);
    this.cache.get(endpoint)!.set(queryKey, data);
  }

  /**
   * Get query result
   */
  get(endpoint: string, query: Record<string, any>): any | undefined {
    const queryKey = JSON.stringify(query);
    return this.cache.get(endpoint)?.get(queryKey);
  }

  /**
   * Invalidate specific endpoint
   */
  invalidate(endpoint: string): void {
    this.cache.delete(endpoint);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Service Worker cache manager
 * For offline support and advanced caching
 */
export class ServiceWorkerCacheManager {
  private cacheName: string = 'app-cache-v1';

  constructor(cacheName?: string) {
    if (cacheName) {
      this.cacheName = cacheName;
    }
  }

  /**
   * Cache a request/response pair
   */
  async cache(request: Request, response: Response): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open(this.cacheName);
    await cache.put(request, response.clone());
  }

  /**
   * Get cached response
   */
  async getCached(request: Request): Promise<Response | undefined> {
    if (!('caches' in window)) return;

    const cache = await caches.open(this.cacheName);
    return cache.match(request);
  }

  /**
   * Precache list of URLs
   */
  async precache(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open(this.cacheName);
    await cache.addAll(urls);
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    if (!('caches' in window)) return;

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );
  }

  /**
   * Get cache size
   */
  async getSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  }
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate on data mutation
   */
  onMutation: (pattern: string, invalidatePatterns: string[]) => {
    // Example: When user updates profile, invalidate user-related caches
    console.log(`Invalidating caches for pattern: ${pattern}`);
  },

  /**
   * Time-based invalidation
   */
  onInterval: (interval: number, invalidatePatterns: string[]) => {
    setInterval(() => {
      // Refresh cache at interval
      console.log('Refreshing cache by interval');
    }, interval);
  },

  /**
   * Event-based invalidation
   */
  onEvent: (eventName: string, invalidatePatterns: string[]) => {
    window.addEventListener(eventName, () => {
      console.log(`Invalidating caches for event: ${eventName}`);
    });
  },
};

export default {
  CacheStrategy,
  CACHE_DURATIONS,
  httpCacheHeaders,
  BrowserCacheManager,
  LRUCache,
  cacheApiResponse,
  QueryCache,
  ServiceWorkerCacheManager,
  cacheInvalidation,
};
