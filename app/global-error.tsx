'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '500px',
            padding: '24px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '12px',
            }}>
              Something went very wrong!
            </h1>
            <p style={{
              color: '#4b5563',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              The application encountered a critical error. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#15803d';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#16a34a';
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
