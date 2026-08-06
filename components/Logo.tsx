'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  href?: string;
  className?: string;
}

export default function Logo({ size = 'medium', href = '/', className = '' }: LogoProps) {
  const variants = {
    small: {
      src: '/images/logo/coopx-mark.png',
      width: 44,
      height: 44,
      classes: 'h-10 w-10 rounded-xl object-cover sm:h-11 sm:w-11',
    },
    medium: {
      src: '/images/logo/coopx-logo-nav.jpg',
      width: 196,
      height: 50,
      classes: 'h-auto w-40 object-contain sm:w-48',
    },
    large: {
      src: '/images/logo/coopx-logo-full.jpg',
      width: 360,
      height: 131,
      classes: 'h-auto w-full max-w-[22rem] rounded-2xl object-contain',
    },
  };

  const variant = variants[size];

  const LogoContent = (
    <div className={`flex items-center ${className}`}>
      <Image
        src={variant.src}
        alt="CoopX — Powering the Agri Value Chain"
        width={variant.width}
        height={variant.height}
        className={`${variant.classes} bg-white shadow-sm transition duration-300 group-hover:scale-[1.02]`}
        priority={size === 'large'}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        aria-label="CoopX home"
      >
        {LogoContent}
      </Link>
    );
  }
  return LogoContent;
}
