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
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is The Roast Book?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The Roast Book is an AI-powered personalized gift. You upload a photo of your friend, describe their personality traits and quirks, and AI generates a custom illustrated flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of your friend in hilarious scenarios. It costs $9.99 and is ready in under 2 minutes.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does The Roast Book work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'It takes 3 simple steps: (1) Upload a photo of your friend and enter their name, (2) Describe their personality traits - AI generates personalized roast quotes and you pick your favorites, (3) Preview 3 free illustrated pages, then pay $9.99 to unlock the full 8-page flipbook. The entire process takes under 2 minutes.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What occasions is The Roast Book good for?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The Roast Book is perfect for birthdays, weddings, farewell parties, bachelor and bachelorette parties, graduations, holidays, retirement celebrations, or any time you want to make a friend laugh. It is especially popular as a funny birthday gift and a personalized farewell gift for coworkers.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How much does The Roast Book cost?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can preview 3 illustrated pages for free. The full 8-page personalized roast book costs $9.99 - a one-time payment with no subscription or hidden fees.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is The Roast Book mean or offensive?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Not at all. The humor is based on "comedy through contradiction" - imagining things your friend would never say based on their actual personality. It is affectionate and playful, not cruel. Think of it as an inside joke turned into a beautifully illustrated gift book.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I share The Roast Book with my friend?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'After your roast book is generated, you get a unique shareable link. Send it via WhatsApp, text message, email, or any messaging app. Your friend opens the link and flips through their personalized illustrated roast book on any device - no app download needed.',
                  },
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'The Roast Book',
              url: 'https://theroastbook.com',
              logo: 'https://theroastbook.com/icon.png',
              description:
                'AI-powered personalized gift books. Upload a friend\'s photo, describe their personality, and get a hilarious illustrated flipbook of things they\'d never say.',
              sameAs: ['https://www.tiktok.com/@theroastbook'],
            }),
          }}
        />
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
              image: 'https://theroastbook.com/og-image.png',
              brand: { '@type': 'Brand', name: 'The Roast Book' },
              offers: {
                '@type': 'Offer',
                price: '9.99',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                url: 'https://theroastbook.com',
                priceValidUntil: '2026-12-31',
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