'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/authContext';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NCDFCOOP Commerce - Website Version</title>
        <meta name="description" content="NCDFCOOP Commerce Platform - Member-Focused E-Commerce" />
        <meta name="theme-color" content="#1A472A" />
        <link rel="icon" href="/images/logo/NCDFCOOPLOGO.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo/NCDFCOOPLOGO.png" type="image/png" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <AuthProvider>
          <EnhancedNavigation />
          <div className="flex-1">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
