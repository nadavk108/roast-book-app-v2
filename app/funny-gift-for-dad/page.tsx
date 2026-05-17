import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { LandingPageContent, type FAQ, type CrossLink } from '@/components/landing/LandingPageContent';

const BOOK_SLUG = 'dcxmxuqqs2';
const PAGE_URL = 'https://theroastbook.com/funny-gift-for-dad';
const PAGE_TITLE = 'Funny Gift for Dad - Personalized AI Roast Book | $9.99';
const PAGE_DESCRIPTION =
  "Give dad the funniest, most personal gift he's ever gotten. AI-generated \"Things Dad Would Never Say\" flipbook from his real personality. $9.99.";

const FAQS: FAQ[] = [
  {
    question: 'What is The Roast Book?',
    answer:
      'The Roast Book is an AI-generated personalized flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of Dad in hilarious scenarios. Preview 3 pages free, then unlock all 8 pages for $9.99.',
  },
  {
    question: 'How does it work?',
    answer:
      "Upload his photo, describe his dad quirks and habits, and AI generates both the quotes and the illustrated scenes. You pick your favorites, preview 3 pages free, then unlock all 8 pages for $9.99. Ready in under 2 minutes.",
  },
  {
    question: 'Is this a physical book?',
    answer:
      "No - it's a digital flipbook you share via link. Dad opens it on his phone and swipes through it like Instagram Stories. No shipping, no waiting, no app to download.",
  },
  {
    question: 'Will it actually be funny?',
    answer:
      "Yes - the humor comes from showing him doing the exact opposite of who he is. If Dad refuses to throw anything away, we show him as a minimalist. If he falls asleep at 8pm, we show him closing a club at 3am. It's affectionate, not cruel.",
  },
  {
    question: "What if I don't like it?",
    answer:
      "You preview 3 pages free before paying anything. If the humor hits, unlock all 8 pages for $9.99. If not, you've lost nothing.",
  },
  {
    question: "Is this appropriate for Father's Day?",
    answer:
      "Absolutely - it's one of the most memorable Father's Day gifts you can give. It's affectionate roasting based on his actual personality, not generic. He'll be talking about it at every family gathering.",
  },
];

const CROSS_LINKS: CrossLink[] = [
  { href: '/funny-gift-for-best-friend', label: 'Funny gift for best friend' },
  { href: '/gift-for-boyfriend-who-has-everything', label: 'Funny gift for boyfriend' },
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
      "A personalized AI-generated roast book gift for Dad. Upload his photo, describe his quirks, and get a hilarious illustrated flipbook of \"Things Dad Would Never Say.\"",
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
      { '@type': 'ListItem', position: 2, name: 'Funny Gift for Dad', item: PAGE_URL },
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
      images: [{ url: ogImage, alt: "Funny personalized roast book for dad" }],
    },
    twitter: {
      card: 'summary_large_image',
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: [ogImage],
    },
  };
}

export default function FunnyGiftForDadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA(FAQS)) }}
      />
      <LandingPageContent
        heroHeadline="The Gift That'll Make Dad Laugh (and Mildly Concerned)"
        heroSubheadline="A personalized flipbook of things he'd never say - from his actual dad quirks and habits."
        finalCtaHeadline="Ready to roast your dad?"
        personaName="Dave"
        bookSlug={BOOK_SLUG}
        relationship="dad"
        faqs={FAQS}
        crossLinks={CROSS_LINKS}
        pageKey="dad"
      />
    </>
  );
}
