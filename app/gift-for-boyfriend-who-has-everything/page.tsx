import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { LandingPageContent, type FAQ, type CrossLink } from '@/components/landing/LandingPageContent';

const BOOK_SLUG = 'w6t8jd7kz1';
const PAGE_URL = 'https://theroastbook.com/gift-for-boyfriend-who-has-everything';
const PAGE_TITLE = 'Gift for Boyfriend Who Has Everything - Personalized AI Roast Book | $9.99';
const PAGE_DESCRIPTION =
  "He has everything? Not this. A hilarious AI-generated flipbook of \"Things He'd Never Say\" - personalized from his real quirks. Only $9.99.";

const FAQS: FAQ[] = [
  {
    question: 'What is The Roast Book?',
    answer:
      'The Roast Book is an AI-generated personalized flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of your boyfriend in hilarious scenarios. Preview 3 pages free, then unlock all 8 pages for $9.99.',
  },
  {
    question: 'How does it work?',
    answer:
      "Upload his photo, describe his quirks and habits, and AI generates both the quotes and the illustrated scenes. You pick your favorites, preview 3 pages free, then unlock all 8 pages for $9.99. Ready in under 2 minutes.",
  },
  {
    question: 'Is this a physical book?',
    answer:
      "No - it's a digital flipbook you share via link. He opens it on his phone and swipes through it like Instagram Stories. No shipping, no waiting, no app to download.",
  },
  {
    question: 'Will it actually be funny?',
    answer:
      "Yes - the humor comes from showing him doing the exact opposite of who he is. It's comedy through contradiction, not meanness. The more specific and accurate the traits you describe, the funnier it lands.",
  },
  {
    question: "What if I don't like it?",
    answer:
      "You preview 3 pages free before paying anything. If the humor hits, unlock all 8 pages for $9.99. If not, you've lost nothing.",
  },
  {
    question: "What if my boyfriend doesn't have a sense of humor?",
    answer:
      "The humor is affectionate roasting - showing him in scenarios that are the opposite of his personality. It's designed to feel like a loving inside joke, not a takedown. Most people find it funny regardless of how seriously they take themselves.",
  },
];

const CROSS_LINKS: CrossLink[] = [
  { href: '/funny-gift-for-best-friend', label: 'Funny gift for best friend' },
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
      "A personalized AI-generated roast book gift for your boyfriend. Upload his photo, describe his quirks, and get a hilarious illustrated flipbook of \"Things He'd Never Say.\"",
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
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Gift for Boyfriend Who Has Everything',
        item: PAGE_URL,
      },
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
      images: [{ url: ogImage, alt: 'Funny personalized roast book for boyfriend' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: [ogImage],
    },
  };
}

export default function GiftForBoyfriendPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA(FAQS)) }}
      />
      <LandingPageContent
        heroHeadline="The One Gift He Doesn't Already Have"
        heroSubheadline="A personalized roast book of things he'd never say - funnier than anything on his wishlist."
        finalCtaHeadline="Ready to roast your boyfriend?"
        personaName="Jake"
        bookSlug={BOOK_SLUG}
        relationship="boyfriend"
        faqs={FAQS}
        crossLinks={CROSS_LINKS}
        pageKey="boyfriend"
      />
    </>
  );
}
