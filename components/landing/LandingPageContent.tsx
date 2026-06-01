'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Upload, MessageSquare, BookOpen, Check, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BrutalButton } from '@/components/ui/brutal-button';
import { DemoFlipbook } from '@/components/landing/DemoFlipbook';
import { captureEvent } from '@/lib/posthog';

export type FAQ = {
  question: string;
  answer: string;
};

export type CrossLink = {
  href: string;
  label: string;
};

export type LandingPageContentProps = {
  heroHeadline: string;
  heroSubheadline: string;
  finalCtaHeadline: string;
  personaName: string;
  bookSlug: string;
  relationship: string;
  faqs: FAQ[];
  crossLinks: CrossLink[];
  pageKey: string;
};

const HOW_IT_WORKS = [
  {
    Icon: Upload,
    title: 'Upload their photo',
    description: 'One clear photo is all you need. AI uses it to place them in hilarious illustrated scenes.',
  },
  {
    Icon: MessageSquare,
    title: 'Describe what makes them funny',
    description: 'Share their quirks, hobbies, catchphrases, and habits. The more specific, the funnier.',
  },
  {
    Icon: BookOpen,
    title: 'Get their roast book',
    description: 'Preview 3 pages free, then unlock the full 8-page illustrated flipbook for $9.99.',
  },
];

const BENEFITS = [
  {
    title: 'Actually personal',
    description: 'Built from their real quirks and traits - not a generic gift with their name slapped on it.',
  },
  {
    title: "They'll laugh out loud",
    description: "Comedy through contradiction - showing them doing the exact opposite of who they are. Affectionate, not cruel.",
  },
  {
    title: 'Ready in 2 minutes',
    description: 'No shipping, no waiting, no app to download. They open a link and flip through it instantly.',
  },
  {
    title: 'Only $9.99',
    description: 'Cheaper than a card and gift combo. Preview 3 pages free before you pay a cent.',
  },
];

export function LandingPageContent({
  heroHeadline,
  heroSubheadline,
  finalCtaHeadline,
  personaName,
  bookSlug,
  faqs,
  crossLinks,
  pageKey,
}: LandingPageContentProps) {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bookCount, setBookCount] = useState<number | null>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { captureEvent('landing_page_viewed', { page: pageKey }); } catch {}

    const el = heroCTARef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { setShowStickyBar(!entry.isIntersecting); },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageKey]);

  useEffect(() => {
    fetch('/api/books/count')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.count) setBookCount(data.count); })
      .catch(() => {});
  }, []);

  const handleCtaClick = (location: string) => {
    try { captureEvent('landing_cta_clicked', { page: pageKey, location }); } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Sticky bottom CTA */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-foreground border-t-[2.5px] border-primary px-4 py-3 flex items-center justify-between gap-4 max-w-lg mx-auto md:max-w-none">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-black text-primary text-lg">$9.99</span>
            <span className="text-background/50 line-through text-sm">$29</span>
          </div>
          <BrutalButton size="sm" asChild onClick={() => handleCtaClick('sticky_bar')}>
            <Link href="/create">
              Start Roasting Free
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </BrutalButton>
        </div>
      )}

      <main className="flex-1">

        {/* Hero */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container max-w-[860px] mx-auto text-center px-4">
            <div className="inline-flex items-center gap-2 bg-primary border-[2.5px] border-foreground rounded-full px-4 py-1.5 shadow-[3px_3px_0_#0E0E0E] mb-6">
              <span aria-hidden="true">🎁</span>
              <span className="font-heading font-black text-sm text-foreground">Personalized Gift - $9.99</span>
            </div>

            <h1 className="font-heading font-black text-4xl md:text-6xl mb-6 leading-[1.02] tracking-[-1px]">
              {heroHeadline}
            </h1>

            <p className="text-foreground/60 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              {heroSubheadline}
            </p>

            <div ref={heroCTARef}>
              <BrutalButton size="xl" asChild onClick={() => handleCtaClick('hero')}>
                <Link href="/create">
                  Create Their Book - $9.99
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </BrutalButton>
              {bookCount !== null && (
                <p className="mt-3 text-sm text-foreground/50">
                  🔥 {bookCount.toLocaleString()} roast books created
                </p>
              )}
              <p className="mt-2 text-sm text-foreground/50">
                Preview 3 pages free. Pay only when you love it.
              </p>
            </div>

            <p className="mt-4 text-sm text-foreground/40">Ready in under 2 minutes</p>
          </div>
        </section>

        {/* Demo Flipbook */}
        <section className="py-16 md:py-24 bg-muted/50" aria-labelledby="demo-heading">
          <div className="container max-w-[700px] mx-auto px-4">
            <div className="text-center mb-10">
              <span className="text-primary font-bold text-sm uppercase tracking-wider">Real Example</span>
              <h2 id="demo-heading" className="text-3xl md:text-4xl font-heading font-black mt-2 mb-3">
                See what {personaName}&apos;s book looks like
              </h2>
              <p className="text-muted-foreground text-lg">
                Tap or swipe through every page - this is exactly what yours will look like
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-[320px]">
                <DemoFlipbook slug={bookSlug} />
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm mt-8">
              This took 2 minutes to make. Yours will be just as funny.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-28 bg-background" aria-labelledby="how-it-works-heading">
          <div className="container max-w-[1000px] mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-primary font-bold text-sm uppercase tracking-wider">Simple Process</span>
              <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-heading font-black mt-2 mb-3">
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg">Three steps to the funniest gift they&apos;ve ever gotten</p>
            </div>

            <ol className="grid md:grid-cols-3 gap-6 list-none">
              {HOW_IT_WORKS.map(({ Icon, title, description }, i) => (
                <li key={i}>
                  <article className="bg-card border-[2.5px] border-foreground rounded-2xl p-6 h-full shadow-[6px_6px_0_#0E0E0E] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#0E0E0E]">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4 border-[2.5px] border-foreground shadow-[3px_3px_0_#0E0E0E]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading font-black text-lg mb-2 tracking-tight">{title}</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{description}</p>
                  </article>
                </li>
              ))}
            </ol>

            <div className="text-center mt-10">
              <BrutalButton variant="outline" asChild onClick={() => handleCtaClick('how_it_works')}>
                <Link href="/create">
                  Start Roasting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </BrutalButton>
            </div>
          </div>
        </section>

        {/* What Makes This Actually Personal */}
        <section className="py-20 md:py-28 bg-muted/50" aria-labelledby="why-heading">
          <div className="container max-w-[900px] mx-auto px-4">
            <div className="text-center mb-14">
              <h2 id="why-heading" className="text-3xl md:text-4xl font-heading font-black mb-3">
                What Makes This Actually Personal
              </h2>
              <p className="text-muted-foreground text-lg">Four reasons people actually remember this gift</p>
            </div>

            <ul className="grid md:grid-cols-2 gap-6 list-none">
              {BENEFITS.map(({ title, description }, i) => (
                <li key={i} className="flex gap-4 bg-card border-3 border-foreground rounded-2xl p-6 shadow-brutal">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base mb-1">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28 bg-background" aria-labelledby="faq-heading">
          <div className="container max-w-[800px] mx-auto px-4">
            <h2 id="faq-heading" className="text-3xl md:text-4xl font-heading font-black text-center mb-12">
              Frequently Asked Questions
            </h2>

            <dl className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border-3 border-foreground bg-background overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none font-heading font-bold text-foreground text-base md:text-lg hover:bg-muted/30 transition-colors [&::-webkit-details-marker]:hidden">
                    <dt>{item.question}</dt>
                    <span
                      className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                      style={{ display: 'inline-block' }}
                    >
                      ▾
                    </span>
                  </summary>
                  <dd className="px-6 pb-6 text-muted-foreground text-sm md:text-base leading-relaxed border-t border-border pt-4">
                    {item.answer}
                  </dd>
                </details>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 bg-foreground">
          <div className="container max-w-[700px] mx-auto text-center px-4">
            <h2 className="font-heading font-black text-3xl md:text-5xl tracking-tight leading-[1.02] text-background mb-8">
              {finalCtaHeadline}
            </h2>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-primary text-foreground font-heading font-black text-xl px-10 py-5 rounded-xl border-[2.5px] border-background shadow-[6px_6px_0_#F5B400] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
              onClick={() => handleCtaClick('bottom')}
            >
              Create Their Book - $9.99
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-4 text-background/40 text-sm">
              No account needed to start. Pay only when you love it.
            </p>
          </div>
        </section>

        {/* Cross-links */}
        <section className="py-12 bg-background border-t border-border">
          <div className="container max-w-[700px] mx-auto text-center px-4">
            <h3 className="text-base font-heading font-bold text-muted-foreground mb-6">More Roast Ideas</h3>
            <div className="flex flex-wrap gap-6 justify-center">
              {crossLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
