import type { Metadata, Viewport } from 'next';
import { Syne, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
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
    default: 'The Roast Book - Personalized AI Roast Gift Book for Friends | $9.99',
    template: '%s | The Roast Book',
  },
  description:
    'Give your friend a hilarious AI-generated roast book in minutes. Upload their photo, describe their quirks, and get 8 custom illustrated scenes. Just $9.99.',
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
    title: 'The Roast Book - The Funniest Personalized Gift You Can Give',
    description:
      'Upload a photo of your friend. AI creates a hilarious illustrated roast book of "Things They\'d Never Say." Ready in 2 minutes. Only $9.99.',
    type: 'website',
    url: 'https://theroastbook.com',
    siteName: 'The Roast Book',
    locale: 'en_US',
    images: [
      {
        url: 'https://theroastbook.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Roast Book - The Funniest Personalized Gift You Can Give',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Roast Book - Personalized AI Roast Gift',
    description:
      'Create a custom illustrated roast book for your friend in 2 minutes. The funniest gift ever, only $9.99.',
    images: ['https://theroastbook.com/og-image.png'],
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
                ratingValue: '5',
                reviewCount: '500',
              },
              review: [
                {
                  '@type': 'Review',
                  reviewRating: { '@type': 'Rating', ratingValue: '5' },
                  author: { '@type': 'Person', name: 'Sarah M.' },
                  reviewBody: 'My dad literally cried laughing. Best birthday gift I\'ve ever given him!',
                },
                {
                  '@type': 'Review',
                  reviewRating: { '@type': 'Rating', ratingValue: '5' },
                  author: { '@type': 'Person', name: 'Mike T.' },
                  reviewBody: 'The AI images are insanely good. My friends couldn\'t believe it wasn\'t real.',
                },
                {
                  '@type': 'Review',
                  reviewRating: { '@type': 'Rating', ratingValue: '5' },
                  author: { '@type': 'Person', name: 'Rachel K.' },
                  reviewBody: 'Took me 2 minutes to make. My coworker\'s farewell party was unforgettable!',
                },
              ],
            }),
          }}
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-CF524DTB47"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CF524DTB47');
        `}
      </Script>
      <body className={`${syne.variable} ${spaceGrotesk.variable} antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}