import type { ReactNode } from 'react';
import { ClientLayout } from '@/components/ClientLayout';
import { GlobalSettingsProvider } from '@/lib/context/GlobalSettingsContext';
import './globals.css';

export const metadata = {
  title: {
    default: 'CoopX',
    template: '%s | CoopX',
  },
  description: 'CoopX is a role-aware cooperative marketplace for members, sellers, and wholesale buyers.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'CoopX',
    statusBarStyle: 'black-translucent' as const,
  },
  icons: {
    icon: '/images/logo/coopx-mark.png',
    shortcut: '/images/logo/coopx-mark.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1A472A',
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
        <link rel="icon" href="/images/logo/coopx-mark.png" />
        <link rel="shortcut icon" href="/images/logo/coopx-mark.png" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <GlobalSettingsProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
