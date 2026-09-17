import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';

export const metadata: Metadata = {
  title: 'Binary Vidya | Premier Learning & Authentication',
  description: 'Learn and advance your technical craft with Binary Vidya.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
