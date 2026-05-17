import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { LandingPageContent, type FAQ, type CrossLink } from '@/components/landing/LandingPageContent';

const BOOK_SLUG = 'm6318qahz7';
const PAGE_URL = 'https://theroastbook.com/funny-gift-for-best-friend';
const PAGE_TITLE = 'Funny Gift for Best Friend - Personalized AI Roast Book | $9.99';
const PAGE_DESCRIPTION =
  'Give your best friend a hilarious personalized flipbook of "Things They\'d Never Say." AI-generated illustrations from their real personality traits. Ready in 2 minutes.';

const FAQS: FAQ[] = [
  {
    question: 'What is The Roast Book?',
    answer:
      'The Roast Book is an AI-generated personalized flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of your friend in hilarious scenarios. Preview 3 pages free, then unlock all 8 pages for $9.99.',
  },
  {
    question: 'How does it work?',
    answer:
      'Upload their photo, describe their quirks and traits, and AI generates both the quotes and the illustrated scenes. You pick your favorite quotes, preview 3 pages free, then unlock all 8 pages for $9.99. Ready in under 2 minutes.',
  },
  {
    question: 'Is this a physical book?',
    answer:
      "No - it's a digital flipbook you share via link. They open it on their phone and swipe through it like Instagram Stories. No shipping, no waiting, no app to download.",
  },
  {
    question: 'Will it actually be funny?',
    answer:
      "Yes - the humor comes from showing them doing the exact opposite of who they are. It's comedy through contradiction, not meanness. Think of it as an inside joke turned into a beautifully illustrated book.",
  },
  {
    question: "What if I don't like it?",
    answer:
      "You preview 3 pages free before paying anything. If the humor hits, unlock all 8 pages for $9.99. If not, you've lost nothing.",
  },
  {
    question: 'Is this a good birthday gift for a best friend?',
    answer:
      "Absolutely - it's one of the most personalized birthday gifts you can give. Unlike a gift card or generic present, it's built from your friend's actual personality and quirks. They'll reference it for years.",
  },
];

const CROSS_LINKS: CrossLink[] = [
  { href: '/gift-for-boyfriend-who-has-everything', label: 'Funny gift for boyfriend' },
  { href: '/funny-gift-for-dad', label: 'Funny gift for dad' },
];

const SCHEMA = (faqs: FAQ[]) => [
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'The Roast Book',
    description:
      "A personalized AI-generated roast book gift for your best friend. Upload their photo, describe their quirks, and get a hilarious illustrated flipbook of \"Things They'd Never Say.\"",
    url: PAGE_URL,
    brand: { '@type': 'Brand', name: 'The Roast Book' },
    offers: {
      '@type': 'Offer',
      price: '9.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: 'https://theroastbook.com/create',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://theroastbook.com' },
      { '@type': 'ListItem', position: 2, name: 'Funny Gift for Best Friend', item: PAGE_URL },
    ],
  },
];

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const { data: book } = await supabaseAdmin
    .from('roast_books')
    .select('cover_image_url')
    .eq('slug', BOOK_SLUG)
    .single();

  const ogImage = book?.cover_image_url ?? 'https://theroastbook.com/og-image.png';

  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: PAGE_URL,
      siteName: 'The Roast Book',
      type: 'website',
      images: [{ url: ogImage, alt: 'Funny personalized roast book for best friend' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: [ogImage],
    },
  };
}

export default function FunnyGiftForBestFriendPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA(FAQS)) }}
      />
      <LandingPageContent
        heroHeadline="The Funniest Gift Your Best Friend Will Ever Get"
        heroSubheadline="An AI-generated flipbook of things they'd never say - personalized from their actual personality and quirks."
        finalCtaHeadline="Ready to roast your best friend?"
        personaName="Maya"
        bookSlug={BOOK_SLUG}
        relationship="best friend"
        faqs={FAQS}
        crossLinks={CROSS_LINKS}
        pageKey="best_friend"
      />
    </>
  );
}
