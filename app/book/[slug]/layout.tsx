import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch book data for metadata
  try {
    const { data: book } = await supabaseAdmin
      .from('roast_books')
      .select('victim_name, cover_image_url, slug')
      .eq('slug', params.slug)
      .single();

    if (!book) {
      return {
        title: 'Roast Book Not Found',
        description: 'The Roast Book - Create Hilarious Personalized Roast Books',
      };
    }

    const title = `Check out 'Things ${book.victim_name} Would Never Say'! 🔥📚`;
    const description = `The Roast Book - Create Hilarious Personalized Roast Books`;
    const imageUrl = book.cover_image_url || 'https://theroastbook.com/og-image.png';
    const bookUrl = `https://theroastbook.com/book/${book.slug}`;

    return {
      title: `Things ${book.victim_name} Would Never Say | RoastBook`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: bookUrl,
        siteName: 'RoastBook',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `Roast Book for ${book.victim_name}`,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
      },
      alternates: {
        canonical: bookUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'RoastBook - Hilarious Personalized Roast Books',
      description: 'Create hilarious personalized roast books for your friends and family',
    };
  }
}

export default function BookLayout({ children }: Props) {
  return <>{children}</>;
}
