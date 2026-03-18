'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { RealExampleBooksSection } from '@/components/landing/RealExampleBooksSection';
import { CelebrityShowcase } from '@/components/landing/CelebrityShowcase';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <RealExampleBooksSection />
        {/* Social proof banner */}
        <div className="py-8 bg-zinc-950 border-t border-white/5 text-center px-4">
          <p className="text-zinc-400 text-base md:text-lg font-medium">
            Join{' '}
            <span className="text-white font-bold">500+ people</span>{' '}
            who&apos;ve made their friends cry laughing
          </p>
        </div>
        <CelebrityShowcase />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
