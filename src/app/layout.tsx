import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXTAUTH_URL || 'https://fanaralbhar.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FANAR AL BHAR — Official Store | Digital Keys & Software Licenses',
    template: '%s | Fanar Al Bhar',
  },
  description:
    'Fanar Al Bhar is India’s premier single-vendor e-commerce store for instant verified digital game keys, authentic software licenses, and direct electronics.',
  keywords: [
    'Fanar Al Bhar',
    'single vendor',
    'game keys',
    'software license',
    'steam keys',
    'windows keys',
    'antivirus',
    'digital gift cards',
  ],
  authors: [{ name: 'Fanar Al Bhar' }],
  creator: 'Fanar Al Bhar',
  publisher: 'Fanar Al Bhar',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Fanar Al Bhar',
    title: 'FANAR AL BHAR — Official Store',
    description:
      'Direct single-vendor digital store with zero marketplace intermediaries. Guaranteed authentic digital keys & hardware.',
    images: [
      {
        url: `${siteUrl}/images/fanar-og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Fanar Al Bhar Official Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FANAR AL BHAR — Official Store',
    description:
      'Direct single-vendor store for instant authentic game keys and software licenses.',
    images: [`${siteUrl}/images/fanar-og.jpg`],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fanar Al Bhar',
    url: siteUrl,
    logo: `${siteUrl}/images/fanar-logo.png`,
    description:
      'Premier single-vendor e-commerce platform offering direct verified digital software licenses, game keys, and electronics.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 98765 43210',
      contactType: 'Customer Support',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#0a0c10] text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
