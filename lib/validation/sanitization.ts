/**
 * Input Sanitization & XSS Protection
 * 
 * Sanitizes user input to prevent:
 * - Cross-Site Scripting (XSS)
 * - HTML/JavaScript injection
 * - Malicious code execution
 * 
 * Note: This works with DOMPurify (client-side) and custom sanitization (server-side)
 * For production, use both layers for defense-in-depth
 */

/**
 * HTML entities mapping for escaping
 */
const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters
 * Prevents HTML tags from being interpreted
 * 
 * @param html - String to escape
 * @returns - Escaped string safe for HTML display
 */
export function escapeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return String(html).replace(/[&<>"'\/]/g, (s) => ENTITY_MAP[s]);
}

/**
 * Remove HTML tags from string
 * Strips all HTML/XML tags
 * 
 * @param html - String with HTML tags
 * @returns - String without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Sanitize user input text
 * Removes potentially dangerous characters and scripts
 * 
 * @param input - User input string
 * @returns - Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // Remove common XSS vectors
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onload=, onclick= etc)
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    // Trim whitespace
    .trim();

  return escapeHtml(sanitized);
}

/**
 * Sanitize HTML content
 * Removes dangerous tags but preserves safe HTML formatting
 * 
 * @param html - HTML string to sanitize
 * @returns - Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // Whitelist of allowed HTML tags
  const allowedTags = [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
  ];

  // Remove all script-related content first
  let sanitized = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');

  // Remove event handlers and dangerous attributes
  sanitized = sanitized.replace(/on\w+\s*=/gi, '').replace(/eval\(/gi, '');

  // Remove disallowed tags (but keep content)
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagRegex, (match, tag) => {
    return allowedTags.includes(tag.toLowerCase()) ? match : '';
  });

  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 * 
 * @param url - URL string to sanitize
 * @returns - Safe URL or empty string if suspicious
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Dangerous URL schemes
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];

  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`⚠️ Blocked dangerous URL scheme: ${protocol}`);
      return '';
    }
  }

  // Only allow http, https, mailto, tel
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const isAbsoluteUrl =
    trimmed.startsWith('http://') || trimmed.startsWith('https://');
  const isSafeProtocol = safeProtocols.some((p) => trimmed.startsWith(p));

  // If relative URL, it's safe
  if (!isAbsoluteUrl && !isSafeProtocol && !trimmed.startsWith('/')) {
    return '';
  }

  try {
    // Validate URL format
    if (isAbsoluteUrl) {
      new URL(url);
    }
    return url;
  } catch {
    console.warn('⚠️ Invalid URL format:', url);
    return '';
  }
}

/**
 * Sanitize email address
 * Basic validation and normalization
 * 
 * @param email - Email string
 * @returns - Sanitized email or empty string
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[^\w\-+.@]/g, '');

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize phone number
 * Removes special characters, keeps only digits
 * 
 * @param phone - Phone number string
 * @returns - Sanitized phone (digits and + only)
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';

  return phone.replace(/[^\d+\-()]/g, '');
}

/**
 * Sanitize text input (usernames, product names, etc)
 * Removes special characters, limits length
 * 
 * @param text - Text to sanitize
 * @param maxLength - Maximum length (default: 255)
 * @returns - Sanitized text
 */
export function sanitizeText(text: string, maxLength: number = 255): string {
  if (typeof text !== 'string') return '';

  return text
    .trim()
    .substring(0, maxLength)
    .replace(/[<>\"'`]/g, '') // Remove quote and bracket characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Sanitize JSON string
 * Removes any potential code injection
 * 
 * @param jsonString - JSON string to sanitize
 * @returns - Parsed object or null if invalid
 */
export function sanitizeJson(jsonString: string): any | null {
  if (typeof jsonString !== 'string') return null;

  try {
    // Remove any leading/trailing whitespace and BOM
    const cleaned = jsonString.trim().replace(/^\uFEFF/, '');

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    // Re-stringify to remove any code-like content
    return JSON.parse(JSON.stringify(parsed));
  } catch (error) {
    console.error('⚠️ Invalid JSON input');
    return null;
  }
}

/**
 * Sanitize field value based on type
 * Dispatches to appropriate sanitizer
 * 
 * @param value - Value to sanitize
 * @param fieldType - Type of field (text, email, url, etc)
 * @returns - Sanitized value
 */
export function sanitizeField(
  value: any,
  fieldType:
    | 'text'
    | 'email'
    | 'url'
    | 'phone'
    | 'html'
    | 'number' = 'text'
): any {
  if (value === null || value === undefined) return '';

  switch (fieldType) {
    case 'email':
      return sanitizeEmail(String(value));
    case 'url':
      return sanitizeUrl(String(value));
    case 'phone':
      return sanitizePhone(String(value));
    case 'html':
      return sanitizeHtml(String(value));
    case 'number':
      return isNaN(Number(value)) ? 0 : Number(value);
    case 'text':
    default:
      return sanitizeText(String(value));
  }
}

/**
 * Sanitize form data object
 * Applies sanitization to all form fields
 * 
 * @param formData - Form data object
 * @param schema - Schema defining field types
 * @returns - Sanitized form data
 */
export function sanitizeFormData(
  formData: Record<string, any>,
  schema?: Record<string, 'text' | 'email' | 'url' | 'phone' | 'html' | 'number'>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(formData)) {
    const fieldType = schema?.[key] || 'text';
    sanitized[key] = sanitizeField(value, fieldType);
  }

  return sanitized;
}

/**
 * Validate and sanitize search query
 * Prevents search injection attacks
 * 
 * @param query - Search query string
 * @param maxLength - Maximum query length (default: 100)
 * @returns - Sanitized search query
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
  if (typeof query !== 'string') return '';

  return query
    .trim()
    .substring(0, maxLength)
    .replace(/(<|>|&|;|\||`)/g, '') // Remove SQL-like characters
    .replace(/\*{2,}/g, '*'); // Reduce multiple wildcards
}

/**
 * Content Security Policy helper
 * Returns CSP headers for Next.js
 */
export function getCSPHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com", // Allow Google Analytics
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' https: data:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.firebaseio.com https://www.google-analytics.com https://*.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join(';'),
  };
}

/**
 * Security headers for all responses
 * Use in a middleware or per-route
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=()',
  };
}
