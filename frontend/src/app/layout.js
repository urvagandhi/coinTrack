import LegalSupportDialogManager from '@/components/legal-support/LegalSupportDialogManager';
import { Toaster } from '@/components/ui/feedback/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ModalProvider } from '@/contexts/ModalContext';
import QueryProvider from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

import { JsonLd, generateOrganizationSchema } from '@/components/seo/JsonLd';

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://cointrack-finance.vercel.app'
  ),
  title: {
    default: 'coinTrack — Track all your investments in one place',
    template: '%s | coinTrack',
  },
  description:
    'Aggregate Zerodha, Upstox & Angel One portfolios with manual gold, EPF, PPF, FD and mutual-fund ledgers. Unified net-worth, P&L and tax-ready reports.',
  keywords: [
    'portfolio tracker',
    'investments',
    'net worth',
    'Zerodha',
    'Upstox',
    'Angel One',
    'mutual funds',
    'SIP calculator',
    'India personal finance',
  ],
  authors: [{ name: 'coinTrack' }],
  creator: 'coinTrack',
  publisher: 'coinTrack',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'coinTrack',
    title: 'coinTrack — The personal finance quarterly',
    description:
      'Live broker integration + rigorous manual ledgers, rendered with the patience of a printed page.',
    images: [
      { url: '/coinTrack.png', width: 1200, height: 630, alt: 'coinTrack' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'coinTrack',
    description: 'Your portfolio, set in clear type.',
    images: ['/coinTrack.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen font-sans relative`}
      >
        <JsonLd data={generateOrganizationSchema()} />
        <QueryProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <ModalProvider>
                {children}
                <LegalSupportDialogManager />
                <Toaster richColors position='bottom-right' />
              </ModalProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
