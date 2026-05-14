import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { RealExampleBooksSection } from '@/components/landing/RealExampleBooksSection';
import { CelebrityShowcase } from '@/components/landing/CelebrityShowcase';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';
import { supabaseAdmin } from '@/lib/supabase';

const TYLER_SLUG = '9x7dzympme';
const FEATURED_SLUGS = ['9x7dzympme', 'r6vsw49szs', 'yjkyh70ga0'];

async function fetchBook(slug: string) {
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
}

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
