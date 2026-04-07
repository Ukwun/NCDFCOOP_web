/**
 * Rate Limiting Middleware
 * 
 * Uses LRU (Least Recently Used) cache to track request frequency
 * Prevents abuse, brute force attacks, and API spam
 * 
 * Configuration:
 * - Emails: 5 per minute per user
 * - Auth endpoints: 10 per hour per IP
 * - API endpoints: 100 per hour per user
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Simple LRU Cache implementation
class LRUCache {
  private cache: Map<string, RateLimitEntry>;
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key: string, value: RateLimitEntry): void {
    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  // For email endpoints (password reset, verification, etc.)
  email: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 emails per minute
  },

  // For authentication endpoints (signup, login)
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 attempts per hour
  },

  // For general API endpoints
  api: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 requests per hour
  },

  // For payment/transaction endpoints
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 payment attempts per hour
  },

  // For search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },
};

// Global cache instances for different rate limit types
const emailLimiter = new LRUCache(1000);
const authLimiter = new LRUCache(5000);
const apiLimiter = new LRUCache(10000);
const paymentLimiter = new LRUCache(1000);
const searchLimiter = new LRUCache(5000);

/**
 * Check if a request is within rate limits
 * 
 * @param identifier - Unique identifier (userId, email, or IP)
 * @param cache - LRU cache instance
 * @param config - Rate limit configuration
 * @returns - Object with isAllowed and remaining count
 */
function checkRateLimit(
  identifier: string,
  cache: LRUCache,
  config: RateLimitConfig
): { isAllowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = cache.get(identifier);

  // If no entry exists, create new one
  if (!entry) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
      lastAccess: now,
    };
    cache.set(identifier, newEntry);
    return {
      isAllowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // If window has expired, reset counter
  if (now >= entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + config.windowMs;
    entry.lastAccess = now;
    cache.set(identifier, entry);
    return {
      isAllowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Window still active, check if limit exceeded
  entry.count++;
  entry.lastAccess = now;
  cache.set(identifier, entry);

  const isAllowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    isAllowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware factory for rate limiting
 * Use in Next.js API routes
 * 
 * @param identifier - Function to extract identifier from request
 * @param limitType - Type of rate limit to apply
 * @returns - Middleware function that throws error if limit exceeded
 */
export function createRateLimiter(
  identifier: (req: any) => string,
  limitType: keyof typeof rateLimitConfigs
) {
  const config = rateLimitConfigs[limitType];
  let cache: LRUCache;

  switch (limitType) {
    case 'email':
      cache = emailLimiter;
      break;
    case 'auth':
      cache = authLimiter;
      break;
    case 'payment':
      cache = paymentLimiter;
      break;
    case 'search':
      cache = searchLimiter;
      break;
    case 'api':
    default:
      cache = apiLimiter;
  }

  return async (req: any) => {
    const id = identifier(req);
    const result = checkRateLimit(id, cache, config);

    // Add rate limit info to response headers
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': (result.resetTime / 1000).toString(),
    };

    if (!result.isAllowed) {
      const error = new Error('Too Many Requests');
      (error as any).status = 429;
      (error as any).headers = headers;
      throw error;
    }

    return { headers };
  };
}

/**
 * Get rate limit status for a specific identifier
 * Useful for API responses to show user remaining quota
 */
export function getRateLimitStatus(
  identifier: string,
  limitType: keyof typeof rateLimitConfigs
) {
  const config = rateLimitConfigs[limitType];
  let cache: LRUCache;

  switch (limitType) {
    case 'email':
      cache = emailLimiter;
      break;
    case 'auth':
      cache = authLimiter;
      break;
    case 'payment':
      cache = paymentLimiter;
      break;
    case 'search':
      cache = searchLimiter;
      break;
    case 'api':
    default:
      cache = apiLimiter;
  }

  const result = checkRateLimit(identifier, cache, config);
  return result;
}

/**
 * Reset rate limit for a specific identifier
 * Useful for administrative purposes or error corrections
 */
export function resetRateLimit(
  identifier: string,
  limitType: keyof typeof rateLimitConfigs
) {
  let cache: LRUCache;

  switch (limitType) {
    case 'email':
      cache = emailLimiter;
      break;
    case 'auth':
      cache = authLimiter;
      break;
    case 'payment':
      cache = paymentLimiter;
      break;
    case 'search':
      cache = searchLimiter;
      break;
    case 'api':
    default:
      cache = apiLimiter;
  }

  cache.delete(identifier);
}

/**
 * Clear all rate limit data
 * Useful for testing or memory management
 */
export function clearAllRateLimits() {
  emailLimiter.clear();
  authLimiter.clear();
  apiLimiter.clear();
  paymentLimiter.clear();
  searchLimiter.clear();
}

/**
 * Get cache statistics
 * Useful for monitoring
 */
export function getCacheStats() {
  return {
    email: emailLimiter.size(),
    auth: authLimiter.size(),
    api: apiLimiter.size(),
    payment: paymentLimiter.size(),
    search: searchLimiter.size(),
  };
}

// Export pre-configured limiters for common use cases
export const emailRateLimiter = () =>
  createRateLimiter((req) => req.body?.email || req.ip, 'email');

export const authRateLimiter = () =>
  createRateLimiter((req) => req.body?.email || req.ip, 'auth');

export const apiRateLimiter = () =>
  createRateLimiter((req) => req.user?.uid || req.ip, 'api');

export const paymentRateLimiter = () =>
  createRateLimiter((req) => req.user?.uid || req.ip, 'payment');

export const searchRateLimiter = () =>
  createRateLimiter((req) => req.user?.uid || req.ip, 'search');
