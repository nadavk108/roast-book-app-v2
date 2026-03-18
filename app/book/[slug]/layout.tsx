import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data: book } = await supabaseAdmin
      .from('roast_books')
      .select('victim_name, cover_image_url, full_image_urls, slug')
      .eq('slug', params.slug)
      .single();

    if (!book) {
      return {
        title: 'Roast Book',
        description: 'Check out this hilarious AI-generated roast book!',
      };
    }

    const name = book.victim_name ?? 'Someone';
    const title = `Things ${name} Would Never Say`;
    const description = 'Check out this hilarious AI-generated roast book!';
    const image: string | null =
      book.cover_image_url ?? book.full_image_urls?.[0] ?? null;
    const bookUrl = `https://theroastbook.com/book/${book.slug}`;

    return {
      title,
      description,
      alternates: { canonical: bookUrl },
      openGraph: {
        title,
        description,
        url: bookUrl,
        siteName: 'The Roast Book',
        locale: 'en_US',
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
