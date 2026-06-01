import dynamic from 'next/dynamic';
import { unstable_cache } from 'next/cache';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyBottomCTA } from '@/components/layout/StickyBottomCTA';
import { HeroSection } from '@/components/landing/HeroSection';
import { RealExampleBooksSection } from '@/components/landing/RealExampleBooksSection';
import { CelebrityShowcase } from '@/components/landing/CelebrityShowcase';
import { FAQSection } from '@/components/landing/FAQSection';
import { SocialProofBand } from '@/components/landing/SocialProofBand';
import { OccasionsRail } from '@/components/landing/OccasionsRail';
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
      {/* Announcement ticker */}
      <div className="bg-foreground border-b-[2px] border-foreground/20 py-2 px-4 text-center overflow-hidden">
        <p className="font-heading font-black text-primary text-xs md:text-sm tracking-wide animate-none">
          🔥 Intro price $9.99 - ends soon
        </p>
      </div>

      <Header />

      <main className="flex-1">
        {/* Hero */}
        <HeroSection initialBook={tylerBook} />

        {/* Celebrity proof carousel */}
        <CelebrityShowcase />

        {/* Social proof band */}
        <SocialProofBand />

        {/* How it works */}
        <HowItWorksSection />

        {/* Occasions rail */}
        <OccasionsRail />

        {/* Real books */}
        <RealExampleBooksSection initialBooks={allFeaturedBooks} />

        {/* Dark CTA */}
        <CTASection />

        {/* FAQ */}
        <FAQSection />
      </main>

      <Footer />
      <StickyBottomCTA watchId="hero-cta" />
    </div>
  );
}
