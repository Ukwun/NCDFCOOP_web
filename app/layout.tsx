import type { ReactNode } from 'react';
import { ClientLayout } from '@/components/ClientLayout';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'NCDFCOOP Commerce - Website Version',
  description: 'NCDFCOOP Commerce Platform - Member-Focused E-Commerce',
  themeColor: '#1A472A',
  icons: {
    icon: '/images/logo/NCDFCOOPLOGO.png',
    shortcut: '/images/logo/NCDFCOOPLOGO.png',
  },
};

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
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
