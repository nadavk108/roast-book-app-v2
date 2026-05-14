import dynamic from 'next/dynamic';
import { unstable_cache } from 'next/cache';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { RealExampleBooksSection } from '@/components/landing/RealExampleBooksSection';
import { CelebrityShowcase } from '@/components/landing/CelebrityShowcase';
import { FAQSection } from '@/components/landing/FAQSection';
import { supabaseAdmin } from '@/lib/supabase';

// Below-fold heavy components — dynamically imported to reduce initial JS parse/eval
const HowItWorksSection = dynamic(
  () => import('@/components/landing/HowItWorksSection').then((m) => ({ default: m.HowItWorksSection })),
  { ssr: false }
);
const CTASection = dynamic(
  () => import('@/components/landing/CTASection').then((m) => ({ default: m.CTASection })),
  { ssr: false }
);

// ISR: revalidate page every hour — prevents DB round-trip on every request
export const revalidate = 3600;

const TYLER_SLUG = '9x7dzympme';
const FEATURED_SLUGS = ['9x7dzympme', 'r6vsw49szs', 'yjkyh70ga0'];

// unstable_cache dedups & caches Supabase reads across requests within the revalidate window
const fetchBook = unstable_cache(
  async (slug: string) => {
    try {
      const { data } = await supabaseAdmin
        .from('roast_books')
        .select('victim_name, victim_gender, full_image_urls, preview_image_urls, cover_image_url, quotes, slug')
        .eq('slug', slug)
        .single();
      return data ?? null;
    } catch {
      return null;
    }
  },
  ['landing-book'],
  { revalidate: 3600 }
);

export default async function HomePage() {
  const [tylerBook, ...featuredBooks] = await Promise.all([
    fetchBook(TYLER_SLUG),
    ...FEATURED_SLUGS.slice(1).map(fetchBook),
  ]);
  const allFeaturedBooks = [tylerBook, ...featuredBooks];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection initialBook={tylerBook} />
        <RealExampleBooksSection initialBooks={allFeaturedBooks} />
        {/* Value proposition banner */}
        <div className="py-8 bg-zinc-950 border-t border-white/5 text-center px-4">
          <p className="text-zinc-400 text-base md:text-lg font-medium">
            Instant digital delivery&nbsp;&nbsp;•&nbsp;&nbsp;Personalized in under 2 minutes&nbsp;&nbsp;•&nbsp;&nbsp;Share via any app
          </p>
        </div>
        <CelebrityShowcase />
        <HowItWorksSection />
        <CTASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
