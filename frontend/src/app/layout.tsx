import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://binaryvidya.vercel.app'),
  applicationName: 'Binary Vidya',
  title: {
    default: 'Binary Vidya | Premier Learning, Courses & Training',
    template: '%s | Binary Vidya',
  },
  description: 'Master full-stack development, AI, data science and engineering with certified courses, live mentorship, and industrial training at Binary Vidya.',
  keywords: [
    'Binary Vidya',
    'BinaryVidya',
    'coding courses',
    'internship and training',
    'full stack development',
    'web development',
    'certificate verification',
    'online coding institute',
    'industrial training',
    'frontend development',
  ],
  alternates: {
    canonical: 'https://binaryvidya.vercel.app',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/binary-vidya-icon.png', sizes: '48x48', type: 'image/png' },
      { url: '/images/binary-vidya-icon.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/binary-vidya-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/binary-vidya-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/images/binary-vidya-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Binary Vidya | Premier Learning, Courses & Training',
    description: 'Learn and advance your technical craft with certified courses, 2-month internships, and live mentorship.',
    url: 'https://binaryvidya.vercel.app',
    siteName: 'Binary Vidya',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://binaryvidya.vercel.app/images/binary-vidya-logo.png',
        width: 1200,
        height: 630,
        alt: 'Binary Vidya Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Binary Vidya | Premier Learning, Courses & Training',
    description: 'Master full-stack development, AI, and software engineering with certified courses and mentorship.',
    images: ['https://binaryvidya.vercel.app/images/binary-vidya-logo.png'],
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
        {/* Favicon & Web App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/images/binary-vidya-icon.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/images/binary-vidya-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/binary-vidya-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/binary-vidya-icon.png" />
        <meta property="og:logo" content="https://binaryvidya.vercel.app/images/binary-vidya-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Binary Vidya" />

        {/* Official Razorpay Checkout SDK */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

        {/* 1. WebSite Schema (Informs Google Search of true Site Name & Search Action) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Binary Vidya',
              alternateName: [
                'BinaryVidya',
                'Binary Vidya Academy',
                'Binary Vidya Technologies',
              ],
              url: 'https://binaryvidya.vercel.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://binaryvidya.vercel.app/courses?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* 2. SiteNavigationElement & Sitelinks Schema (Enables Google Search Sitelinks) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'Binary Vidya Primary Navigation & Sitelinks',
              itemListElement: [
                {
                  '@type': 'SiteNavigationElement',
                  position: 1,
                  name: 'Courses & Masterclasses',
                  description: 'Browse certified courses in full-stack web development, cloud computing, and system architecture.',
                  url: 'https://binaryvidya.vercel.app/courses',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 2,
                  name: 'Training & Internship',
                  description: 'Join weekend live cohorts with 2-month guaranteed industrial internships, enterprise capstone projects, and 4 credentials.',
                  url: 'https://binaryvidya.vercel.app/training-and-internship',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 3,
                  name: 'Verify Certificate',
                  description: 'Instantly verify student training completion certificates and 2-month industrial internship letters.',
                  url: 'https://binaryvidya.vercel.app/verify-certificate',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 4,
                  name: 'Careers at Binary Vidya',
                  description: 'Explore hiring opportunities for mentors, software developers, course authors, and campus ambassadors.',
                  url: 'https://binaryvidya.vercel.app/careers',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 5,
                  name: 'Get Free Counselling',
                  description: 'Schedule a free 1-on-1 personalized technical career roadmap consultation with industry engineers.',
                  url: 'https://binaryvidya.vercel.app/get-counselling',
                },
                {
                  '@type': 'SiteNavigationElement',
                  position: 6,
                  name: 'Student Learning Workspace',
                  description: 'Sign in to access enrolled batches, video classrooms, progress tracking, and credential claims.',
                  url: 'https://binaryvidya.vercel.app/login',
                },
              ],
            }),
          }}
        />

        {/* 3. EducationalOrganization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Binary Vidya',
              legalName: 'Binary Vidya Technologies Pvt. Ltd.',
              url: 'https://binaryvidya.vercel.app',
              logo: 'https://binaryvidya.vercel.app/images/binary-vidya-icon.png',
              image: 'https://binaryvidya.vercel.app/images/binary-vidya-logo.png',
              description: 'India\'s premier modern technical academy providing industry-grade software engineering training, 2-month verified industrial internships, production project mentorship, and verifiable ISO-compliant credentials.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Outer Ring Road, Bellandur',
                addressLocality: 'Bengaluru',
                addressRegion: 'Karnataka',
                postalCode: '560103',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+91-9876543210',
                contactType: 'Customer Support',
                email: 'support@binaryvidya.com',
                availableLanguage: ['English', 'Hindi'],
              },
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
