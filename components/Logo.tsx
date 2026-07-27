'use client';
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
      <div
        className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-500 font-black text-white shadow-sm"
        style={{ width: sizeConfig.width, height: sizeConfig.height, fontSize: sizeConfig.width * 0.48 }}
        aria-hidden="true"
      >
        C
      </div>
      {size !== 'small' && (
        <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Coop<span className="text-emerald-700 dark:text-emerald-400">X</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{LogoContent}</Link>;
  }
  return LogoContent;
}
