import type { Metadata, Viewport } from 'next';
import { Syne, Space_Grotesk } from 'next/font/google';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'The Roast Book — Personalized AI Roast Gift Book for Friends | $9.99',
    template: '%s | The Roast Book',
  },
  description:
    'Create a hilarious personalized roast book for your friend in 2 minutes. Upload their photo, describe their quirks, and AI generates a custom illustrated flipbook of "Things They\'d Never Say." The funniest birthday, wedding, or farewell gift — only $9.99.',
  keywords: [
    'personalized roast book',
    'AI roast gift',
    'funny personalized gift for friend',
    'custom roast gift',
    'funny birthday gift for best friend',
    'unique gag gift ideas',
    'personalized funny gift',
    'custom gift book',
    'AI gift generator',
    'funny farewell gift',
    'roast book for birthday',
    'things they would never say',
  ],
  metadataBase: new URL('https://theroastbook.com'),
  alternates: {
    canonical: 'https://theroastbook.com',
  },
  openGraph: {
    title: 'The Roast Book — The Funniest Personalized Gift You Can Give',
    description:
      'Upload a photo of your friend. AI creates a hilarious illustrated roast book of "Things They\'d Never Say." Ready in 2 minutes. Only $9.99.',
    type: 'website',
    url: 'https://theroastbook.com',
    siteName: 'The Roast Book',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Roast Book — Personalized AI Roast Gift',
    description:
      'Create a custom illustrated roast book for your friend in 2 minutes. The funniest gift ever — only $9.99.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'The Roast Book',
              description:
                'A personalized AI-generated roast book gift. Upload a photo of your friend, describe their quirks, and get a hilarious illustrated flipbook of "Things They\'d Never Say."',
              url: 'https://theroastbook.com',
              brand: { '@type': 'Brand', name: 'The Roast Book' },
              offers: {
                '@type': 'Offer',
                price: '9.99',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                url: 'https://theroastbook.com',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '500',
              },
            }),
          }}
        />
      </head>
      <body className={`${syne.variable} ${spaceGrotesk.variable} antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}