'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/authContext';
import Navigation from '@/components/Navigation';
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
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <AuthProvider>
          <Navigation />
          <div className="flex-1 pb-24 md:pb-0">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
