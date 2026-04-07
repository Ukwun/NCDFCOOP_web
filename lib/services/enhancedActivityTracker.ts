/**
 * Enhanced Activity Tracking Service
 * Comprehensive user behavior and activity tracking with metrics
 * 
 * Tracks:
 * - What users do (clicks, searches, purchases, time spent)
 * - When they do it (timestamps, peak hours, patterns)
 * - What they like (preferences, categories, price ranges)
 * - How long they spend (session duration, page residence time)
 * - Problems they face (cart abandonment, failures)
 */

import { collection, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export type ActivityType = 
  // Navigation
  'page_view' | 'page_exit' | 'navigation' |
  // Product interactions
  'product_view' | 'product_search' | 'product_filter' | 'product_compare' |
  // Cart operations
  'cart_add' | 'cart_remove' | 'cart_update' | 'cart_view' | 'cart_abandoned' |
  // Checkout
  'checkout_start' | 'checkout_progress' | 'checkout_abandoned' | 'purchase_complete' | 'purchase_failed' |
  // User account
  'login' | 'logout' | 'signup' | 'profile_update' | 'settings_change' |
  // Communication
  'message_sent' | 'message_read' | 'support_contact' |
  // Engagement
  'offer_viewed' | 'offer_applied' | 'review_submitted' | 'rating_submitted' | 'wishlist_add' |
  // Seller activities
  'product_addedByNSeller' | 'product_updatedBySeller' | 'order_shipped' |
  // Errors
  'error' | 'payment_failed' | 'network_error' | 'page_error';

export interface EnhancedActivityLog {
  id?: string;
  userId: string;
  sessionId: string;
  activityType: ActivityType;
  
  // Timing information
  timestamp: Timestamp;
  sessionStartTime?: Timestamp;
  timeSpentMs?: number; // milliseconds spent on page/feature
  
  // Activity details
  activityData: {
    url?: string;
    referrer?: string;
    pageTitle?: string;
    
    // Product data
    productId?: string;
    productName?: string;
    productCategory?: string;
    productPrice?: number;
    productSellerId?: string;
    
    // Transaction data
    orderId?: string;
    orderTotal?: number;
    itemCount?: number;
    cartItems?: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    
    // Search/filter data
    searchQuery?: string;
    filterApplied?: string;
    resultsCount?: number;
    
    // Issue tracking
    errorMessage?: string;
    errorCode?: string;
    stackTrace?: string;
    
    // Engagement data
    scrollDepth?: number; // percentage scrolled
    clickTarget?: string;
    formFieldsFilled?: number;
    
    [key: string]: any;
  };
  
  // Device information
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
    browserVersion?: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth?: number;
    viewportHeight?: number;
    isMobile: boolean;
    isTablet: boolean;
    colorDepth?: number;
  };
  
  // User metadata
  userMetadata: {
    email?: string;
    userRole?: string;
    membershipType?: string;
    membershipTier?: string;
    userSegment?: string; // power_user, casual_user, at_risk, new_user
  };
  
  // Network/Performance
  performanceMetrics?: {
    pageLoadTime?: number; // ms
    networkLatency?: number; // ms
    firstContentfulPaint?: number; // ms
    largestContentfulPaint?: number; // ms
  };
  
  // Engagement metrics
  engagementMetrics?: {
    interactionCount?: number;
    scrollCount?: number;
    clickCount?: number;
    formInteractionCount?: number;
  };
}

/**
 * Enhanced activity tracker class with comprehensive metrics collection
 */
export class EnhancedActivityTracker {
  private userId: string;
  private sessionId: string;
  private sessionStartTime: Date;
  private pageStartTime: Date;
  private activityBuffer: Partial<EnhancedActivityLog>[] = [];
  private scrollData = { maxScrollDepth: 0, scrollEvents: 0 };
  private clickCount = 0;
  
  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStartTime = new Date();
    this.pageStartTime = new Date();
    
    this.initializeTracking();
  }
  
  /**
   * Initialize global tracking listeners
   */
  private initializeTracking() {
    if (typeof window === 'undefined') return;
    
    // Track scroll depth
    window.addEventListener('scroll', () => {
      this.trackScrollDepth();
    });
    
    // Track clicks
    document.addEventListener('click', (e: MouseEvent) => {
      this.clickCount++;
    });
    
    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageExit();
      } else {
        this.pageStartTime = new Date();
      }
    });
    
    // Track unload
    window.addEventListener('beforeunload', () => {
      this.trackPageExit();
    });
  }
  
  /**
   * Track scroll depth
   */
  private trackScrollDepth() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    if (scrollPercent > this.scrollData.maxScrollDepth) {
      this.scrollData.maxScrollDepth = scrollPercent;
    }
    this.scrollData.scrollEvents++;
  }
  
  /**
   * Track page view with detailed metrics
   */
  async trackPageView(
    pageTitle: string,
    url: string,
    referrer?: string,
    performanceData?: PerformanceNavigationTiming
  ) {
    const timeSpent = this.getTimeSincePageStart();
    
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'page_view',
      timestamp: Timestamp.now(),
      sessionStartTime: Timestamp.fromDate(this.sessionStartTime),
      timeSpentMs: timeSpent,
      activityData: {
        pageTitle,
        url,
        referrer,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
      engagementMetrics: {
        scrollCount: this.scrollData.scrollEvents,
        clickCount: this.clickCount,
        scrollDepth: Math.min(this.scrollData.maxScrollDepth, 100),
      },
      performanceMetrics: performanceData ? this.extractPerformanceMetrics(performanceData) : undefined,
    };
    
    await this.logActivity(activity);
    
    // Reset page-specific metrics
    this.pageStartTime = new Date();
    this.clickCount = 0;
    this.scrollData = { maxScrollDepth: 0, scrollEvents: 0 };
  }
  
  /**
   * Track page exit with time spent
   */
  async trackPageExit(currentUrl?: string) {
    const timeSpent = this.getTimeSincePageStart();
    
    if (timeSpent > 100) { // Only log if spent more than 100ms
      const activity: Partial<EnhancedActivityLog> = {
        userId: this.userId,
        sessionId: this.sessionId,
        activityType: 'page_exit',
        timestamp: Timestamp.now(),
        timeSpentMs: timeSpent,
        activityData: {
          url: currentUrl || (typeof window !== 'undefined' ? window.location.href : ''),
          scrollDepth: this.scrollData.maxScrollDepth,
        },
        deviceInfo: this.collectDeviceInfo(),
        userMetadata: this.collectUserMetadata(),
        engagementMetrics: {
          scrollCount: this.scrollData.scrollEvents,
          clickCount: this.clickCount,
        },
      };
      
      await this.logActivity(activity);
    }
  }
  
  /**
   * Track product view
   */
  async trackProductView(
    productId: string,
    productName: string,
    category: string,
    price: number,
    sellerId?: string,
    viewType: 'grid' | 'detail' = 'grid'
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'product_view',
      timestamp: Timestamp.now(),
      activityData: {
        productId,
        productName,
        productCategory: category,
        productPrice: price,
        productSellerId: sellerId,
        viewType,
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track product search with results
   */
  async trackSearch(query: string, resultsCount: number, filters?: Record<string, any>) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'product_search',
      timestamp: Timestamp.now(),
      activityData: {
        searchQuery: query,
        resultsCount,
        filterApplied: filters ? JSON.stringify(filters) : undefined,
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track product filter application
   */
  async trackFilter(filterType: string, filterValue: string, resultsCount: number) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'product_filter',
      timestamp: Timestamp.now(),
      activityData: {
        filterApplied: `${filterType}:${filterValue}`,
        resultsCount,
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track add to cart
   */
  async trackAddToCart(
    productId: string,
    productName: string,
    quantity: number,
    price: number,
    category: string
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'cart_add',
      timestamp: Timestamp.now(),
      activityData: {
        productId,
        productName,
        quantity,
        productPrice: price,
        productCategory: category,
        subtotal: quantity * price,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track cart abandonment (critical for conversion optimization)
   */
  async trackCartAbandonment(
    cartItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }>,
    cartTotal: number,
    abandReason?: string
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'cart_abandoned',
      timestamp: Timestamp.now(),
      activityData: {
        cartItems,
        orderTotal: cartTotal,
        itemCount: cartItems.length,
        abandonReason: abandReason,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track checkout start
   */
  async trackCheckoutStart(cartItems: any[], cartTotal: number) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'checkout_start',
      timestamp: Timestamp.now(),
      activityData: {
        cartItems,
        orderTotal: cartTotal,
        itemCount: cartItems.length,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track checkout progress (form completion percentage)
   */
  async trackCheckoutProgress(step: string, formFieldsFilled: number, totalFields: number) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'checkout_progress',
      timestamp: Timestamp.now(),
      activityData: {
        checkoutStep: step,
        formFieldsFilled,
        totalFields,
        progressPercentage: (formFieldsFilled / totalFields) * 100,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track checkout abandonment
   */
  async trackCheckoutAbandonment(
    step: string,
    cartTotal: number,
    formFieldsFilled: number,
    totalFields: number,
    reason?: string
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'checkout_abandoned',
      timestamp: Timestamp.now(),
      activityData: {
        checkoutStep: step,
        orderTotal: cartTotal,
        formFieldsFilled,
        totalFields,
        progressPercentage: (formFieldsFilled / totalFields) * 100,
        abandonReason: reason,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track purchase completion
   */
  async trackPurchaseComplete(
    orderId: string,
    orderTotal: number,
    cartItems: any[],
    paymentMethod?: string
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'purchase_complete',
      timestamp: Timestamp.now(),
      sessionStartTime: Timestamp.fromDate(this.sessionStartTime),
      activityData: {
        orderId,
        orderTotal,
        cartItems,
        itemCount: cartItems.length,
        paymentMethod,
        sessionDuration: new Date().getTime() - this.sessionStartTime.getTime(),
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track purchase failure
   */
  async trackPurchaseFailed(
    orderTotal: number,
    cartItems: any[],
    errorCode?: string,
    errorMessage?: string
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'purchase_failed',
      timestamp: Timestamp.now(),
      activityData: {
        orderTotal,
        cartItems,
        itemCount: cartItems.length,
        errorCode,
        errorMessage,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Track error
   */
  async trackError(
    errorName: string,
    errorMessage: string,
    stackTrace?: string,
    context?: Record<string, any>
  ) {
    const activity: Partial<EnhancedActivityLog> = {
      userId: this.userId,
      sessionId: this.sessionId,
      activityType: 'error',
      timestamp: Timestamp.now(),
      activityData: {
        errorMessage,
        errorCode: errorName,
        stackTrace,
        ...context,
      },
      deviceInfo: this.collectDeviceInfo(),
      userMetadata: this.collectUserMetadata(),
    };
    
    await this.logActivity(activity);
  }
  
  /**
   * Collect device information
   */
  private collectDeviceInfo(): EnhancedActivityLog['deviceInfo'] {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        platform: '',
        browser: '',
        screenWidth: 0,
        screenHeight: 0,
        isMobile: false,
        isTablet: false,
      };
    }
    
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone/.test(ua);
    const isTablet = /iPad|Android/.test(ua) && !/Mobile/.test(ua);
    
    return {
      userAgent: ua,
      platform: navigator.platform,
      browser: this.detectBrowser(ua),
      browserVersion: this.detectBrowserVersion(ua),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isMobile,
      isTablet,
      colorDepth: window.screen.colorDepth,
    };
  }
  
  /**
   * Collect user metadata
   */
  private collectUserMetadata(): EnhancedActivityLog['userMetadata'] {
    if (typeof window === 'undefined') {
      return {};
    }
    
    return {
      email: localStorage.getItem('userEmail') || undefined,
      userRole: localStorage.getItem('userRole') || undefined,
      membershipType: localStorage.getItem('membershipType') || undefined,
      membershipTier: localStorage.getItem('membershipTier') || undefined,
    };
  }
  
  /**
   * Extract performance metrics from navigation timing
   */
  private extractPerformanceMetrics(
    timing: PerformanceNavigationTiming
  ): EnhancedActivityLog['performanceMetrics'] {
    return {
      pageLoadTime: timing.loadEventEnd - timing.fetchStart,
      networkLatency: timing.responseEnd - timing.requestStart,
      firstContentfulPaint: undefined, // Will be collected separately via Web Vitals
      largestContentfulPaint: undefined,
    };
  }
  
  /**
   * Detect browser from user agent
   */
  private detectBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
  
  /**
   * Detect browser version
   */
  private detectBrowserVersion(ua: string): string | undefined {
    const match = ua.match(/(?:Chrome|Safari|Firefox|Edge)\/(\d+)/);
    return match ? match[1] : undefined;
  }
  
  /**
   * Get time since page start in milliseconds
   */
  private getTimeSincePageStart(): number {
    return new Date().getTime() - this.pageStartTime.getTime();
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log activity to Firestore
   */
  private async logActivity(activity: Partial<EnhancedActivityLog>) {
    try {
      await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), activity);
    } catch (error) {
      console.warn('Activity logging failed:', error);
      // Don't break app on logging failures
    }
  }
  
  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Global tracker instance
 */
let trackerInstance: EnhancedActivityTracker | null = null;

export function initializeTracker(userId: string): EnhancedActivityTracker {
  if (!trackerInstance) {
    trackerInstance = new EnhancedActivityTracker(userId);
  }
  return trackerInstance;
}

export function getTracker(): EnhancedActivityTracker | null {
  return trackerInstance;
}
