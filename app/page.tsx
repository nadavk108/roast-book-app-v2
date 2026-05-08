import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { RealExampleBooksSection } from '@/components/landing/RealExampleBooksSection';
import { CelebrityShowcase } from '@/components/landing/CelebrityShowcase';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <RealExampleBooksSection />
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
