'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BrutalButton } from '@/components/ui/brutal-button';
import { captureEvent, Events } from '@/lib/posthog';
import { ArrowRight, X } from 'lucide-react';

type Props = {
  images: string[];
  quotes: string[];
};

const STEPS = [
  {
    number: '1',
    title: 'Upload a photo of Dad',
    description: 'Just one clear photo - the AI uses it to put Dad in hilarious scenarios.',
    duration: '30 seconds',
  },
  {
    number: '2',
    title: 'Tell us what makes him funny',
    description:
      "Describe his quirks, catchphrases, hobbies, or dad-cliches. The more specific, the funnier.",
    duration: '1 minute',
  },
  {
    number: '3',
    title: 'Get a hilarious flipbook in minutes',
    description:
      'AI generates personalized quotes and illustrations. Preview 3 pages free, then unlock all 8 for $9.99.',
    duration: 'Digital delivery',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What is a Roast Book?',
    answer:
      'A Roast Book is a personalized AI-generated flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of Dad in hilarious scenarios. Preview 3 pages free, then unlock all 8 for $9.99.',
  },
  {
    question: 'How long does it take?',
    answer:
      'The whole process is quick and easy. Upload a photo, describe what makes Dad funny, preview 3 pages free, pay $9.99, and the full 8-page illustrated book is ready to share immediately.',
  },
  {
    question: 'Is it a physical book?',
    answer:
      'No - it is a digital flipbook you share as a link. Dad opens it on his phone or any device and flips through the pages. No printing, no shipping, no waiting.',
  },
  {
    question: 'Can Dad see it immediately?',
    answer:
      'Yes - the moment you pay, the full book is generated and you get a shareable link. Send it to Dad directly via WhatsApp, text, or email. He sees it instantly.',
  },
];

const CARD_ROTATIONS = ['rotate-1', '-rotate-2', 'rotate-[1.5deg]'];

export function FathersDayContent({ images, quotes }: Props) {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const heroCTARef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { captureEvent(Events.FATHERS_DAY_PAGE_VIEWED, { page: 'fathers_day' }); } catch {}

    const el = heroCTARef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { setShowStickyBar(!entry.isIntersecting); },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCtaClick = (location: string) => {
    try { captureEvent(Events.FATHERS_DAY_CTA_CLICKED, { location }); } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Sticky bottom CTA bar */}
      {showStickyBar && !stickyDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t-3 border-foreground px-4 py-3 flex items-center justify-center gap-4">
          <BrutalButton size="sm" asChild onClick={() => handleCtaClick('sticky_bar')}>
            <Link href="/create">
              Roast My Dad
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </BrutalButton>
          <button
            onClick={() => setStickyDismissed(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-6 pb-8 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />

          <div className="container max-w-[1000px] mx-auto relative z-10 px-4">
            <div className="flex flex-col md:flex-row md:items-center md:gap-16">

              {/* Text + CTA */}
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/15 border-2 border-primary/40 rounded-full text-sm font-bold mb-4">
                  🎁 Father&apos;s Day Gift 2026
                </span>

                <h1 className="text-4xl md:text-6xl font-heading font-black mb-5 leading-tight">
                  Things Dad Would Never Say 🔥
                </h1>

                {/* Mobile product preview — large phone mockup with quote overlay */}
                {images[1] && (
                  <div className="md:hidden flex justify-center mb-5">
                    <div className="relative w-[280px] rounded-[2rem] overflow-hidden border-3 border-foreground shadow-brutal">
                      <Image
                        src={images[1]}
                        alt="Example Roast Book page"
                        width={280}
                        height={373}
                        className="w-full object-cover"
                        style={{ aspectRatio: '3/4' }}
                        priority
                      />
                      {quotes[1] && (
                        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/65 backdrop-blur-md">
                          <p className="text-white text-xs text-center font-heading italic leading-snug">
                            &ldquo;{quotes[1]}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="hidden md:block text-lg md:text-xl text-muted-foreground mb-7 max-w-lg mx-auto md:mx-0 leading-relaxed">
                  A personalized 8-page digital flipbook of AI-generated roasts. Ready in 2 minutes. Just $9.99.
                </p>

                <div ref={heroCTARef}>
                  <BrutalButton size="xl" asChild onClick={() => handleCtaClick('hero')}>
                    <Link href="/create">
                      Roast My Dad
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </BrutalButton>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Father&apos;s Day is June 21 - the perfect last-minute gift
                </p>
              </div>

              {/* Desktop product preview — large phone mockup with quote overlay */}
              {images[1] && (
                <div className="hidden md:flex justify-center flex-shrink-0">
                  <div className="relative w-[310px] rounded-[2.5rem] overflow-hidden border-3 border-foreground shadow-brutal hover:scale-[1.02] transition-transform duration-300">
                    <Image
                      src={images[1]}
                      alt="Example Roast Book page"
                      width={310}
                      height={413}
                      className="w-full object-cover"
                      style={{ aspectRatio: '3/4' }}
                      priority
                    />
                    {quotes[1] && (
                      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-black/65 backdrop-blur-md">
                        <p className="text-white text-sm text-center font-heading italic leading-snug">
                          &ldquo;{quotes[1]}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── Value proposition stripe ── */}
        <div className="py-6 bg-secondary text-secondary-foreground text-center px-4 border-y-3 border-foreground">
          <p className="text-base md:text-lg font-medium">
            Instant digital delivery&nbsp;&nbsp;•&nbsp;&nbsp;No app download needed&nbsp;&nbsp;•&nbsp;&nbsp;Share as a link
          </p>
        </div>

        {/* ── Example books ── */}
        <section className="py-20 md:py-28 bg-muted/50" aria-labelledby="examples-heading">
          <div className="container max-w-[1200px] mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-primary font-bold text-sm uppercase tracking-wider">Real Example</span>
              <h2
                id="examples-heading"
                className="text-3xl md:text-4xl font-heading font-black mt-2 mb-3"
              >
                See Dave&apos;s Roast Book
              </h2>
              <p className="text-muted-foreground text-lg">
                AI-generated from a real photo - this is what Dad gets
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-10 md:gap-6 justify-center items-center md:items-end">
              {images.map((url, i) => (
                <div
                  key={i}
                  className={`${CARD_ROTATIONS[i]} transition-transform duration-300 hover:rotate-0 hover:-translate-y-2`}
                >
                  <div className="bg-white border-3 border-foreground shadow-brutal p-3 pb-12 w-[240px]">
                    <Image
                      src={url}
                      alt={`Dave's Roast Book - page ${i + 1}`}
                      width={234}
                      height={312}
                      className="w-full object-cover object-top"
                      style={{ aspectRatio: '3/4' }}
                    />
                    {quotes[i] && (
                      <p className="mt-4 text-black text-sm text-center font-heading italic leading-snug px-1">
                        &ldquo;{quotes[i]}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground text-sm mt-10">
              Your book will feature <span className="font-semibold">Dad&apos;s</span> photo and his actual quirks
            </p>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 md:py-28 bg-background" aria-labelledby="how-it-works-heading">
          <div className="container max-w-[1000px] mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-primary font-bold text-sm uppercase tracking-wider">Simple Process</span>
              <h2
                id="how-it-works-heading"
                className="text-3xl md:text-4xl font-heading font-black mt-2 mb-3"
              >
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg">Three easy steps to a personalized gift</p>
            </div>

            <ol className="grid md:grid-cols-3 gap-6 list-none">
              {STEPS.map((step) => (
                <li key={step.number}>
                  <article className="bg-card border-3 border-foreground rounded-2xl p-6 h-full shadow-brutal transition-transform hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xl mb-4 border-2 border-foreground shadow-brutal-hover">
                      {step.number}
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{step.description}</p>
                    <span className="inline-block text-xs font-bold text-primary bg-primary/15 px-3 py-1 rounded-full border border-primary/30">
                      {step.duration}
                    </span>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Last-minute gift callout ── */}
        <section
          className="py-16 bg-primary border-y-3 border-foreground"
          aria-label="Last-minute gift"
        >
          <div className="container max-w-[700px] mx-auto text-center px-4">
            <p className="text-2xl md:text-3xl font-heading font-black text-primary-foreground">
              The ultimate last-minute gift - ready before he finishes his coffee
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 md:py-28 bg-muted/50" aria-labelledby="faq-heading">
          <div className="container max-w-[800px] mx-auto px-4">
            <h2
              id="faq-heading"
              className="text-3xl md:text-4xl font-heading font-black text-center mb-12"
            >
              Frequently Asked Questions
            </h2>

            <dl className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border-3 border-foreground bg-background overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none font-heading font-bold text-foreground text-base md:text-lg hover:bg-muted/30 transition-colors [&::-webkit-details-marker]:hidden">
                    <dt>{item.question}</dt>
                    <span
                      className="shrink-0 text-foreground transition-transform duration-200 group-open:rotate-180"
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

        {/* ── Bottom CTA ── */}
        <section className="py-20 md:py-28 bg-background border-t-3 border-foreground">
          <div className="container max-w-[700px] mx-auto text-center px-4">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">
              Perfect Last-Minute Gift
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-black mt-3 mb-4">
              Make Dad&apos;s Day Unforgettable
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
              A personalized roast book he&apos;ll actually remember - just $9.99
            </p>

            <BrutalButton size="xl" asChild onClick={() => handleCtaClick('bottom')}>
              <Link href="/create">
                Roast My Dad
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </BrutalButton>

            <p className="mt-4 text-sm text-muted-foreground">
              No app download needed - Dad opens it on any device
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
