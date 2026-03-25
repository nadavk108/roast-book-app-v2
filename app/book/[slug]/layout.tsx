import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

function isHebrewText(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text ?? '');
}

function buildOgCopy(name: string, isHebrew: boolean, gender: string | null) {
  if (isHebrew) {
    if (gender === 'female') {
      return {
        title: `הדברים ש${name} לעולם לא הייתה אומרת 😂`,
        description: 'מישהו הכין לה ספר רוסט מצחיק. לחץ לצפייה 👇',
      };
    }
    // male or neutral — default to masculine Hebrew
    return {
      title: `הדברים ש${name} לעולם לא היה אומר 😂`,
      description: 'מישהו הכין לו ספר רוסט מצחיק. לחץ לצפייה 👇',
    };
  }
  return {
    title: `Things ${name} Would Never Say 😂`,
    description: 'Someone made them a hilarious roast book. Click to see it 👇',
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data: book } = await supabaseAdmin
      .from('roast_books')
      .select('victim_name, victim_gender, cover_image_url, full_image_urls, slug')
      .eq('slug', params.slug)
      .single();

    if (!book) {
      return {
        title: 'Roast Book',
        description: 'Check out this hilarious AI-generated roast book!',
      };
    }

    const name = book.victim_name ?? 'Someone';
    const isHebrew = isHebrewText(name);
    const { title, description } = buildOgCopy(name, isHebrew, book.victim_gender ?? null);
    const image: string | null =
      book.cover_image_url ?? book.full_image_urls?.[0] ?? null;
    const bookUrl = `https://theroastbook.com/book/${book.slug}`;
    const locale = isHebrew ? 'he_IL' : 'en_US';

    return {
      title,
      description,
      alternates: { canonical: bookUrl },
      openGraph: {
        title,
        description,
        url: bookUrl,
        siteName: 'The Roast Book',
        locale,
        type: 'website',
        ...(image && {
          images: [{ url: image, alt: title }],
        }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'The Roast Book',
      description: 'Check out this hilarious AI-generated roast book!',
    };
  }
}

export default function BookLayout({ children }: Props) {
  return <>{children}</>;
}
