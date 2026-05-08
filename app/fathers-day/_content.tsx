'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BrutalButton } from '@/components/ui/brutal-button';
import { captureEvent, Events } from '@/lib/posthog';
import { ArrowRight } from 'lucide-react';

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
    duration: 'Ready instantly',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What is a Roast Book?',
    answer:
      'A Roast Book is a personalized AI-generated flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of Dad in hilarious scenarios. It costs $9.99 and is ready in under 2 minutes.',
  },
  {
    question: 'How long does it take?',
    answer:
      'The whole process takes under 2 minutes. Upload a photo, describe what makes Dad funny, pick your favorite quotes, pay $9.99, and the full 8-page illustrated book is ready instantly.',
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

function getCountdown() {
  const target = new Date('2026-06-21T00:00:00');
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
  };
}

export function FathersDayContent({ images, quotes }: Props) {
  const [countdown, setCountdown] = useState(getCountdown());

  useEffect(() => {
    try { captureEvent(Events.FATHERS_DAY_PAGE_VIEWED, { page: 'fathers_day' }); } catch {}
    const timer = setInterval(() => setCountdown(getCountdown()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const handleCtaClick = (location: string) => {
    try { captureEvent(Events.FATHERS_DAY_CTA_CLICKED, { location }); } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />

          <div className="container max-w-[860px] mx-auto text-center relative z-10 px-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/15 border-2 border-primary/40 rounded-full text-sm font-bold mb-8">
              🎁 Father&apos;s Day Gift 2026
            </span>

            <h1 className="text-5xl md:text-7xl font-heading font-black mb-6 leading-tight">
              Things Dad Would Never Say 🔥
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The funniest Father&apos;s Day gift - personalized, AI-generated, and ready in 2 minutes
            </p>

            <BrutalButton size="xl" asChild onClick={() => handleCtaClick('hero')}>
              <Link href="/">
                Create Dad&apos;s Book - $9.99
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </BrutalButton>

            <p className="mt-6 text-sm text-muted-foreground">
              Father&apos;s Day is June 21 - order now, ready instantly
            </p>
          </div>
        </section>

        {/* ── Social proof stripe ── */}
        <div className="py-6 bg-secondary text-secondary-foreground text-center px-4 border-y-3 border-foreground">
          <p className="text-base md:text-lg font-medium">
            Join{' '}
            <span className="text-primary font-bold">500+ people</span>{' '}
            who&apos;ve made their friends and family cry laughing
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
                Made in under 2 minutes - this is what Dad gets
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
              <p className="text-muted-foreground text-lg">From idea to gift in under 2 minutes</p>
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

        {/* ── Countdown urgency ── */}
        <section
          className="py-16 bg-primary border-y-3 border-foreground"
          aria-label="Father's Day countdown"
        >
          <div className="container max-w-[700px] mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-heading font-black text-primary-foreground mb-2">
              Father&apos;s Day is June 21
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10">
              Order now - it&apos;s ready instantly, no shipping needed
            </p>

            <div className="flex justify-center gap-4 mb-10">
              <div className="bg-black/15 border-3 border-primary-foreground rounded-2xl px-8 py-6 min-w-[120px]">
                <div className="text-5xl md:text-6xl font-heading font-black text-primary-foreground tabular-nums leading-none">
                  {countdown.days}
                </div>
                <div className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest mt-2">
                  Days
                </div>
              </div>
              <div className="bg-black/15 border-3 border-primary-foreground rounded-2xl px-8 py-6 min-w-[120px]">
                <div className="text-5xl md:text-6xl font-heading font-black text-primary-foreground tabular-nums leading-none">
                  {countdown.hours}
                </div>
                <div className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest mt-2">
                  Hours
                </div>
              </div>
            </div>

            <p className="text-primary-foreground/70 text-sm">
              Updates every minute
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
              A personalized roast book he&apos;ll actually remember - ready in 2 minutes, just $9.99
            </p>

            <BrutalButton size="xl" asChild onClick={() => handleCtaClick('bottom')}>
              <Link href="/">
                Create Dad&apos;s Book - $9.99
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </BrutalButton>

            <p className="mt-6 text-sm text-muted-foreground">
              No app download needed - Dad opens it on any device
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
