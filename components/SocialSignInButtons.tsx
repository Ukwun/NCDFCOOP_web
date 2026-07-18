import React, { useState } from 'react';

interface SocialSignInButtonsProps {
  onGoogleSignIn: () => void;
  onFacebookSignIn: () => void;
  onAppleSignIn: () => void;
  isLoading?: boolean;
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const AppleLogo = () => (
  <svg width="18" height="22" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="currentColor" d="M788 341c-6 4-108 62-108 190 0 148 130 201 134 203-1 3-21 72-69 142-43 61-87 123-155 123s-86-40-164-40c-76 0-104 41-166 41s-105-35-154-88C47 727 0 620 0 517c0-180 117-276 233-276 63 0 116 42 155 42 38 0 98-44 171-44 28 0 108 3 168 98zm-234-194c39-41 71-82 71-123 0-6-1-12-2-17-59 3-127 40-168 90-37 45-73 103-73 163 0 6 1 12 2 14 3 1 8 1 14 1 53 0 116-35 151-88z"/>
  </svg>
);

export default function SocialSignInButtons({ onGoogleSignIn, onFacebookSignIn, onAppleSignIn, isLoading }: SocialSignInButtonsProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onGoogleSignIn} disabled={isLoading} onMouseEnter={() => setHovered('google')} onMouseLeave={() => setHovered(null)} className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 text-[15px] font-semibold text-gray-900 transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none" style={{ boxShadow: hovered === 'google' ? '0 4px 16px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.08)' }}>
        {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" aria-label="Signing in" /> : <GoogleLogo />}
        <span>Continue with Google</span>
      </button>
      <button type="button" onClick={onFacebookSignIn} disabled={isLoading} onMouseEnter={() => setHovered('facebook')} onMouseLeave={() => setHovered(null)} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-5 py-3 text-[15px] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#1565c0] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-[#1877F2]" aria-hidden="true">f</span>
        <span>Continue with Facebook</span>
      </button>
      <button type="button" onClick={onAppleSignIn} disabled={isLoading} onMouseEnter={() => setHovered('apple')} onMouseLeave={() => setHovered(null)} className="flex w-full items-center justify-center gap-3 rounded-xl bg-black px-5 py-3 text-[15px] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none">
        <AppleLogo />
        <span>Continue with Apple</span>
      </button>
    </div>
  );
}
