'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  href?: string;
  className?: string;
}

export default function Logo({ size = 'medium', href = '/', className = '' }: LogoProps) {
  const sizes = {
    small: { width: 40, height: 40 },
    medium: { width: 60, height: 60 },
    large: { width: 120, height: 120 },
  };

  const sizeConfig = sizes[size];

  const LogoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        <Image
          src="/images/logo/ncdfcoop-logo.png"
          alt="NCDFCOOP"
          fill
          className="object-contain"
          priority
        />
      </div>
      {size !== 'small' && (
        <div className="flex flex-col">
          <span className="font-bold text-xl text-gray-900 dark:text-white">NCDF</span>
          <span className="font-bold text-xl text-orange-500">COOP</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{LogoContent}</Link>;
  }

  return LogoContent;
}
