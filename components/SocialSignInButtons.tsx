import React, { useState } from 'react';

interface SocialSignInButtonsProps {
  onGoogleSignIn: () => void;
  onFacebookSignIn: () => void;
  onAppleSignIn: () => void;
  isLoading?: boolean;
}

/* Inline SVG logos — no external file dependency, always crisp */
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const FacebookLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AppleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg">
    <path fill="#fff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-34.6-154.2-87.7C46.9 727.3 0 620 0 517.2c0-180.4 117.4-275.8 232.8-275.8 63.2 0 115.9 41.7 155.5 41.7 38 0 97.9-44.4 170.8-44.4 27.7 0 108.2 2.6 168.4 98.3zm-234.5-193.8C592.7 106.1 625 65 625 24.4c0-5.9-.6-11.9-1.9-17.2-58.5 2.6-127.4 39.5-168.4 89.5-37.4 45.1-73.2 103.2-73.2 162.6 0 6.5 1.3 12.5 1.9 14.5 3.2.6 8.4 1.3 13.6 1.3 53.1 0 115.9-35.3 151.6-87.7z"/>
  </svg>
);

interface BtnState { google: boolean; facebook: boolean; apple: boolean }

export default function SocialSignInButtons({
  onGoogleSignIn,
  onFacebookSignIn,
  onAppleSignIn,
  isLoading,
}: SocialSignInButtonsProps) {
  const [hovered, setHovered] = useState<keyof BtnState | null>(null);
  const facebookEnabled = process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED === 'true';
  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true';

  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    padding: '13px 20px',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    letterSpacing: '0.01em',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 200ms ease',
    border: 'none',
    outline: 'none',
    opacity: isLoading ? 0.65 : 1,
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ssb-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        .ssb-spinner-dark {
          border: 2.5px solid rgba(0,0,0,0.15);
          border-top-color: #555;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>

        {/* Google */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={isLoading}
          onMouseEnter={() => setHovered('google')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...base,
            background: hovered === 'google' ? '#f5f5f5' : '#ffffff',
            color: '#1a1a1a',
            boxShadow: hovered === 'google'
              ? '0 4px 16px rgba(0,0,0,0.12)'
              : '0 1px 4px rgba(0,0,0,0.08), inset 0 0 0 1px #e2e2e2',
            transform: hovered === 'google' ? 'translateY(-1px)' : 'none',
          }}
        >
          {isLoading ? <span className="ssb-spinner ssb-spinner-dark" /> : <GoogleLogo />}
          <span>Continue with Google</span>
        </button>

        {/* Facebook is shown only after its Firebase/provider credentials are enabled. */}
        {facebookEnabled && <button
          type="button"
          onClick={onFacebookSignIn}
          disabled={isLoading}
          onMouseEnter={() => setHovered('facebook')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...base,
            background: hovered === 'facebook' ? '#1565c0' : '#1877F2',
            color: '#fff',
            boxShadow: hovered === 'facebook'
              ? '0 4px 16px rgba(24,119,242,0.45)'
              : '0 2px 8px rgba(24,119,242,0.28)',
            transform: hovered === 'facebook' ? 'translateY(-1px)' : 'none',
          }}
        >
          {isLoading ? <span className="ssb-spinner" /> : <FacebookLogo />}
          <span>Continue with Facebook</span>
        </button>}

        {/* Apple is shown only after its Firebase/provider credentials are enabled. */}
        {appleEnabled && <button
          type="button"
          onClick={onAppleSignIn}
          disabled={isLoading}
          onMouseEnter={() => setHovered('apple')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...base,
            background: hovered === 'apple' ? '#1a1a1a' : '#000000',
            color: '#fff',
            boxShadow: hovered === 'apple'
              ? '0 4px 16px rgba(0,0,0,0.35)'
              : '0 2px 8px rgba(0,0,0,0.2)',
            transform: hovered === 'apple' ? 'translateY(-1px)' : 'none',
          }}
        >
          {isLoading ? <span className="ssb-spinner" /> : <AppleLogo />}
          <span>Continue with Apple</span>
        </button>}

      </div>
    </>
  );
}
