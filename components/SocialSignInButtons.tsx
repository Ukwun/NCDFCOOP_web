import React from 'react';

interface SocialSignInButtonsProps {
  onGoogleSignIn: () => void;
  onFacebookSignIn: () => void;
  onAppleSignIn: () => void;
  isLoading?: boolean;
}

export default function SocialSignInButtons({
  onGoogleSignIn,
  onFacebookSignIn,
  onAppleSignIn,
  isLoading,
}: SocialSignInButtonsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#fff',
          color: '#222',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: '12px 0',
          fontWeight: 600,
          fontSize: 16,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        <img src="/icons/google.svg" alt="Google" style={{ width: 24, height: 24 }} />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={onFacebookSignIn}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#1877f3',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 0',
          fontWeight: 600,
          fontSize: 16,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        <img src="/icons/facebook.svg" alt="Facebook" style={{ width: 24, height: 24 }} />
        Continue with Facebook
      </button>
      <button
        type="button"
        onClick={onAppleSignIn}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 0',
          fontWeight: 600,
          fontSize: 16,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        <img src="/icons/apple.svg" alt="Apple" style={{ width: 24, height: 24 }} />
        Continue with Apple
      </button>
    </div>
  );
}
