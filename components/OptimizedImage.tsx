'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  type?: 'product' | 'hero' | 'thumbnail' | 'avatar' | 'offer';
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * OptimizedImage Component
 * 
 * Intelligently handles both emoji placeholders and real image paths
 * Provides automatic Next.js Image optimization for real images
 * 
 * For emoji: Renders as text in a styled container
 * For image paths: Uses Next.js Image component with optimization
 * 
 * Week 1 Implementation: Image Optimization
 * - Automatic WebP/AVIF format conversion
 * - Responsive sizing
 * - Lazy loading by default
 * - Placeholder blur effect for real images
 */
export default function OptimizedImage({
  src,
  alt,
  type = 'product',
  width = 300,
  height = 300,
  className = '',
  priority = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if src is an emoji (unicode emoji character)
  const isEmoji =
    src && 
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(src.trim());

  // Check if src is a valid image path
  const isImagePath = src && (
    src.startsWith('/') || 
    src.startsWith('http') || 
    src.includes('.')
  );

  // Configuration for different image types
  const typeConfig = {
    product: { quality: 85, sizes: '(max-width: 640px) 300px, (max-width: 1024px) 400px, 500px' },
    hero: { quality: 80, sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px' },
    thumbnail: { quality: 70, sizes: '(max-width: 640px) 100px, 150px' },
    avatar: { quality: 75, sizes: '(max-width: 640px) 48px, 64px' },
    offer: { quality: 75, sizes: '(max-width: 640px) 100vw, 800px' },
  };

  const config = typeConfig[type];

  // Render emoji as text in a styled container
  if (isEmoji) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        aria-label={alt}
      >
        <span className="text-5xl select-none">{src}</span>
      </div>
    );
  }

  // Render real image with Next.js Image optimization
  if (isImagePath && !hasError) {
    return (
      <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover rounded ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300 ${className}`}
          quality={config.quality}
          priority={priority}
          sizes={config.sizes}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback for broken images
  return (
    <div
      className={`flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-gray-500 dark:text-gray-400 ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-label={alt}
    >
      <svg
        className="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
