import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { FathersDayContent } from './_content';

const DAVE_SLUG = 'dcxmxuqqs2';

// Dave's cover image — used as the OG image for social sharing
const OG_IMAGE =
  'https://supymlyoquwzhpbqjdxl.supabase.co/storage/v1/object/public/roast-books/generated/dcxmxuqqs2/preview_0_1778237735991.jpg';

export const metadata: Metadata = {
  title: "Things Dad Would Never Say | Father's Day Gift",
  description:
    "The funniest personalized Father's Day gift. AI-generated roast book - ready in 2 minutes. Just $9.99",
  alternates: { canonical: 'https://theroastbook.com/fathers-day' },
  openGraph: {
    title: "Things Dad Would Never Say | Father's Day Gift",
    description:
      "The funniest personalized Father's Day gift. AI-generated roast book - ready in 2 minutes. Just $9.99",
    url: 'https://theroastbook.com/fathers-day',
    siteName: 'The Roast Book',
    type: 'website',
    images: [{ url: OG_IMAGE, alt: "Things Dad Would Never Say - Father's Day Roast Book" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Things Dad Would Never Say | Father's Day Gift",
    description:
      "The funniest personalized Father's Day gift. AI-generated roast book - ready in 2 minutes. Just $9.99",
    images: [OG_IMAGE],
  },
};

export default async function FathersDayPage() {
  const { data: book } = await supabaseAdmin
    .from('roast_books')
    .select('cover_image_url, full_image_urls, quotes')
    .eq('slug', DAVE_SLUG)
    .single();

  const images: string[] = book?.full_image_urls?.slice(0, 3) ?? [];
  const quotes: string[] = book?.quotes?.slice(0, 3) ?? [];

  return <FathersDayContent images={images} quotes={quotes} />;
}
