import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://binaryvidya.vercel.app'),
  title: {
    default: 'Binary Vidya | Premier Learning, Courses & Training',
    template: '%s | Binary Vidya',
  },
  description: 'Master full-stack development, AI, data science and engineering with certified courses, live mentorship, and industrial training at Binary Vidya.',
  keywords: [
    'Binary Vidya',
    'coding courses',
    'internship and training',
    'full stack development',
    'web development',
    'certificate verification',
    'online coding institute',
  ],
  alternates: {
    canonical: 'https://binaryvidya.vercel.app',
  },
  openGraph: {
    title: 'Binary Vidya | Premier Learning, Courses & Training',
    description: 'Learn and advance your technical craft with certified courses and mentorship.',
    url: 'https://binaryvidya.vercel.app',
    siteName: 'Binary Vidya',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google8c2e79bff899c330',
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Binary Vidya',
              url: 'https://binaryvidya.vercel.app',
              logo: 'https://binaryvidya.vercel.app/images/binary-vidya-logo.png',
              description: 'Premier learning platform offering industrial training, live mentoring, and certified technical courses.',
              sameAs: [
                'https://binaryvidya.vercel.app',
              ],
            }),
          }}
        />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
