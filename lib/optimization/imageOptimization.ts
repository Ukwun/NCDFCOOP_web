/**
 * Image Optimization Module
 * 
 * Provides utilities for optimizing images across the application
 * - Automatic format conversion (WebP, AVIF)
 * - Responsive image sizing
 * - Lazy loading strategies
 * - Progressive loading
 * - Quality optimization
 * 
 * @author Performance Team
 * @version 1.0.0
 */

/**
 * Image optimization configuration
 * Defines optimal settings for different image types and contexts
 */
export const imageOptimizationConfig = {
  /**
   * Product images - High quality, multiple sizes
   */
  product: {
    sizes: [320, 480, 640, 800, 1024, 1280],
    quality: 85,
    formats: ['image/webp', 'image/jpeg'],
    placeholder: 'blur',
    priority: false,
    maxAge: 31536000, // 1 year for immutable product images
  },

  /**
   * Hero/banner images - Full width, responsive
   */
  hero: {
    sizes: [640, 1024, 1280, 1536, 1920],
    quality: 80,
    formats: ['image/webp', 'image/jpeg'],
    placeholder: 'blur',
    priority: true,
    maxAge: 604800, // 1 week for hero images
  },

  /**
   * Thumbnail images - Small, heavily optimized
   */
  thumbnail: {
    sizes: [64, 96, 128, 160],
    quality: 70,
    formats: ['image/webp', 'image/jpeg'],
    placeholder: 'empty',
    priority: false,
    maxAge: 31536000, // 1 year
  },

  /**
   * User avatars - Small, cached
   */
  avatar: {
    sizes: [32, 48, 64, 96, 128],
    quality: 75,
    formats: ['image/webp', 'image/jpeg'],
    placeholder: 'empty',
    priority: false,
    maxAge: 2592000, // 30 days
  },

  /**
   * Background images - Full width
   */
  background: {
    sizes: [640, 1024, 1280, 1920],
    quality: 75,
    formats: ['image/webp', 'image/jpeg'],
    placeholder: 'blur',
    priority: false,
    maxAge: 604800, // 1 week
  },

  /**
   * Icon graphics - Small, lossless
   */
  icon: {
    sizes: [16, 24, 32, 48, 64],
    quality: 90,
    formats: ['image/webp', 'image/png'],
    placeholder: 'empty',
    priority: false,
    maxAge: 31536000, // 1 year
  },
};

/**
 * Get optimized image props for Next.js Image component
 * 
 * @param imagePath - Path to the image
 * @param type - Image type (product, hero, thumbnail, etc.)
 * @param alt - Alt text for accessibility
 * @param width - Optional override width
 * @param height - Optional override height
 * @returns Optimized image props
 * 
 * @example
 * const imageProps = getOptimizedImageProps('/products/item.jpg', 'product', 'Product name');
 * <Image {...imageProps} />
 */
export function getOptimizedImageProps(
  imagePath: string,
  type: keyof typeof imageOptimizationConfig = 'product',
  alt: string = 'Image',
  width?: number,
  height?: number
) {
  const config = imageOptimizationConfig[type];

  return {
    src: imagePath,
    alt,
    width: width || config.sizes[Math.floor(config.sizes.length / 2)],
    height: height,
    quality: config.quality,
    priority: config.priority,
    placeholder: config.placeholder as 'blur' | 'empty',
    sizes: `(max-width: 640px) ${config.sizes[0]}px, 
            (max-width: 1024px) ${config.sizes[2]}px, 
            ${config.sizes[config.sizes.length - 1]}px`,
    srcSet: generateSrcSet(imagePath, config.sizes),
  };
}

/**
 * Generate responsive srcSet for images
 * 
 * @param imagePath - Base image path
 * @param sizes - Array of image widths
 * @returns srcSet string for the image
 * 
 * @example
 * const srcSet = generateSrcSet('/image.jpg', [320, 640, 1024]);
 * // Returns: "/image.jpg?w=320&q=75 320w, /image.jpg?w=640&q=75 640w, ..."
 */
export function generateSrcSet(imagePath: string, sizes: number[]): string {
  return sizes
    .map((size) => `${imagePath}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * Calculate optimal image dimensions maintaining aspect ratio
 * 
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum width constraint
 * @param maxHeight - Maximum height constraint
 * @returns Object with width and height
 * 
 * @example
 * const dims = calculateOptimalDimensions(1920, 1080, 800, 600);
 * // Returns: { width: 800, height: 450 }
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = Math.min(originalWidth, maxWidth);
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Get image loading strategy based on position
 * 
 * @param isAboveTheFold - Is image above the fold?
 * @param isCritical - Is this a critical image?
 * @returns Loading strategy: 'eager' or 'lazy'
 * 
 * @example
 * const loading = getLoadingStrategy(true, false);
 * // Returns: 'eager'
 */
export function getLoadingStrategy(
  isAboveTheFold: boolean,
  isCritical: boolean = false
): 'eager' | 'lazy' {
  if (isCritical || isAboveTheFold) {
    return 'eager';
  }
  return 'lazy';
}

/**
 * Estimate image download size based on quality and format
 * 
 * @param width - Image width
 * @param height - Image height
 * @param quality - Quality 0-100
 * @param format - Image format (jpeg, webp, png)
 * @returns Estimated size in KB
 * 
 * @example
 * const size = estimateImageSize(800, 600, 85, 'webp');
 * // Useful for bandwidth estimation and optimization decisions
 */
export function estimateImageSize(
  width: number,
  height: number,
  quality: number,
  format: 'jpeg' | 'webp' | 'png' = 'webp'
): number {
  const pixelCount = width * height;

  // Base size in bytes per megapixel (empirical)
  let baseSizePerMegapixel = 150000; // JPEG baseline

  // Format adjustments
  if (format === 'webp') {
    baseSizePerMegapixel = 120000; // WebP is ~20% smaller
  } else if (format === 'png') {
    baseSizePerMegapixel = 300000; // PNG is larger
  }

  // Quality adjustment (0-100)
  const qualityFactor = quality / 85; // Normalize to quality 85
  const estimatedBytes =
    (pixelCount / 1000000) * baseSizePerMegapixel * qualityFactor;

  return Math.round(estimatedBytes / 1024); // Return in KB
}

/**
 * Validate image dimensions (prevent excessively large images)
 * 
 * @param width - Image width
 * @param height - Image height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns true if valid, false otherwise
 * 
 * @example
 * const isValid = validateImageDimensions(800, 600, 2000, 2000);
 * // Returns: true
 */
export function validateImageDimensions(
  width: number,
  height: number,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): boolean {
  return width <= maxWidth && height <= maxHeight;
}

/**
 * Get image optimization stats for monitoring
 * 
 * @param originalSize - Original image size in bytes
 * @param optimizedSize - Optimized image size in bytes
 * @returns Optimization stats
 * 
 * @example
 * const stats = getImageOptimizationStats(500000, 125000);
 * // Returns: { saved: '375 KB', percentage: 75, ratio: 0.25 }
 */
export function getImageOptimizationStats(
  originalSize: number,
  optimizedSize: number
) {
  const saved = originalSize - optimizedSize;
  const percentage = Math.round((saved / originalSize) * 100);
  const ratio = optimizedSize / originalSize;

  return {
    original: `${(originalSize / 1024).toFixed(2)} KB`,
    optimized: `${(optimizedSize / 1024).toFixed(2)} KB`,
    saved: `${(saved / 1024).toFixed(2)} KB`,
    percentage,
    ratio,
  };
}

/**
 * Generate CloudFlare image optimization URL
 * (Alternative CDN optimization if using CloudFlare)
 * 
 * @param imagePath - Original image path
 * @param width - Target width
 * @param height - Target height
 * @param quality - Image quality
 * @param format - Target format
 * @returns Optimized CloudFlare image URL
 * 
 * @example
 * const url = generateCloudFlareImageUrl(
 *   'https://example.com/image.jpg',
 *   800,
 *   600,
 *   85,
 *   'webp'
 * );
 */
export function generateCloudFlareImageUrl(
  imagePath: string,
  width?: number,
  height?: number,
  quality: number = 85,
  format: string = 'webp'
): string {
  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('format', format);
  params.append('fit', 'scale-down');

  // CloudFlare Image Optimization API
  // Replace domain with your CloudFlare zone domain
  return `/cdn-cgi/image/${Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join(',')},f=${format}/${imagePath}`;
}

export default {
  imageOptimizationConfig,
  getOptimizedImageProps,
  generateSrcSet,
  calculateOptimalDimensions,
  getLoadingStrategy,
  estimateImageSize,
  validateImageDimensions,
  getImageOptimizationStats,
  generateCloudFlareImageUrl,
};
