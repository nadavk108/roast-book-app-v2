'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { captureEvent, Events } from "@/lib/posthog";

type HeroSlide = {
  image: string;
  quote: string;
  name: string;
  isCover?: boolean;
};

type BookData = {
  victim_name?: string;
  full_image_urls?: string[];
  cover_image_url?: string;
  quotes?: string[];
} | null;

function buildSlides(data: BookData): HeroSlide[] {
  if (!data?.full_image_urls?.length) return [];
  const name = data.victim_name ?? 'Tyler';
  const imageSlides: HeroSlide[] = data.full_image_urls.slice(0, 3).map(
    (image: string, i: number) => ({
      image,
      quote: data.quotes?.[i] ?? '',
      name,
    })
  );
  const coverSlides: HeroSlide[] = data.cover_image_url
    ? [{ image: data.cover_image_url, quote: '', name, isCover: true }]
    : [];
  return [...coverSlides, ...imageSlides];
}

export function HeroSection({ initialBook }: { initialBook?: BookData }) {
  const [currentExample, setCurrentExample] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => buildSlides(initialBook ?? null));
  const skipEntrance = useRef(true);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % heroSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const scrollToExamples = () => {
    document.getElementById('real-examples')?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentSlide = heroSlides[currentExample];

  return (
    <section className="bg-background" aria-labelledby="hero-heading">
      <div className="container max-w-[1200px] mx-auto px-4 pt-12 pb-10 md:pt-16 md:pb-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">

          {/* Left: headline + CTAs */}
          <div className="flex-1 max-w-xl mx-auto lg:mx-0">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-primary border-[2.5px] border-foreground rounded-full px-4 py-1.5 shadow-[3px_3px_0_#0E0E0E] mb-6">
              <span aria-hidden="true">🔥</span>
              <span className="font-heading font-black text-sm text-foreground tracking-tight">AI Roast Book</span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="font-heading font-black text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.02] tracking-[-1px] text-foreground mb-5"
            >
              The funniest gift they&apos;ll{' '}
              <span className="relative inline-block">
                <span className="relative z-10">never</span>
                <span
                  className="absolute inset-0 -mx-1 bg-primary rounded-sm -rotate-1"
                  aria-hidden="true"
                  style={{ zIndex: 0, bottom: '2px', top: '2px' }}
                />
              </span>
              {' '}see coming.
            </h1>

            {/* Star rating */}
            <div className="flex items-center gap-2 mb-8">
              <span className="text-primary text-lg font-bold" aria-hidden="true">★★★★★</span>
              <span className="font-heading font-black text-sm text-foreground">4.9</span>
              <span className="text-foreground/40 text-sm">· 2,300+ books made</span>
            </div>

            {/* CTAs */}
            <nav className="flex flex-col sm:flex-row gap-3 mb-8" aria-label="Primary actions">
              <Link
                href="/create"
                id="hero-cta"
                className="flex items-center justify-center gap-2 bg-primary text-foreground font-heading font-black text-lg px-8 py-4 rounded-xl border-[2.5px] border-foreground shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0E0E0E] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
                onClick={() => {
                  try { captureEvent(Events.START_ROASTING_CLICKED, { button_location: 'hero' }); } catch {}
                }}
              >
                Start Roasting Free
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                className="flex items-center justify-center gap-2 bg-card text-foreground font-heading font-bold text-base px-6 py-4 rounded-xl border-[2.5px] border-foreground shadow-[4px_4px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                onClick={scrollToExamples}
              >
                See real examples
              </button>
            </nav>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-heading font-black text-3xl text-foreground">$9.99</span>
              <span className="text-foreground/40 line-through text-base" aria-label="Original price $29">$29</span>
              <span className="bg-accent text-background font-heading font-black text-xs px-3 py-1 rounded-full border-[2px] border-foreground">
                Save 66%
              </span>
            </div>

            {/* Reassurance */}
            <p className="text-foreground/50 text-sm font-medium">
              Preview free before you pay · No subscription
            </p>
          </div>

          {/* Right: phone mockup */}
          <div
            className="shrink-0 mx-auto lg:mx-0"
            style={{ width: 'min(280px, 80vw)' }}
            aria-label="Example roast book preview"
          >
            <Link href="/book/9x7dzympme" className="block" aria-label="Tap to explore Tyler's roast book">
              <figure className="relative">
                {/* Phone frame */}
                <div className="bg-foreground rounded-[2.5rem] p-2 shadow-[8px_8px_0_#0E0E0E] border-[2.5px] border-foreground">
                  <div className="bg-black rounded-[2rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-20" aria-hidden="true" />

                    {/* Screen */}
                    <div className="aspect-[9/16] relative overflow-hidden" aria-live="polite" aria-atomic="true">
                      {heroSlides.length === 0 ? (
                        <div className="absolute inset-0 bg-zinc-800 animate-pulse" aria-hidden="true" />
                      ) : (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentExample}
                            initial={skipEntrance.current ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            onAnimationComplete={() => { skipEntrance.current = false; }}
                            className="absolute inset-0"
                          >
                            <Image
                              src={currentSlide.image}
                              alt={currentSlide.isCover ? `Things ${currentSlide.name} Would Never Say - roast book cover` : `AI-generated roast image: ${currentSlide.name} saying "${currentSlide.quote}"`}
                              fill
                              className="object-cover"
                              priority={currentExample === 0}
                              sizes="(max-width: 640px) 220px, (max-width: 768px) 280px, 280px"
                            />
                            {currentSlide.isCover ? (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end items-center p-4 pb-8"
                              >
                                <p className="text-white font-black text-sm leading-tight text-center drop-shadow-lg mb-1 px-2">
                                  Things {currentSlide.name} Would Never Say
                                </p>
                                <p className="text-white/80 text-xs text-center drop-shadow-md">
                                  A Roast Book Dedicated to {currentSlide.name}
                                </p>
                              </motion.div>
                            ) : (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-32 pb-8 px-4">
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                  className="text-center"
                                >
                                  <p className="text-white/60 text-xs mb-1">
                                    Things {currentSlide.name} Would Never Say
                                  </p>
                                  <p className="text-white text-lg font-semibold">
                                    &ldquo;{currentSlide.quote}&rdquo;
                                  </p>
                                </motion.div>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      )}

                      {/* Progress indicators */}
                      {heroSlides.length > 0 && (
                        <div className="absolute top-8 left-2 right-2 flex gap-1 z-10" aria-hidden="true">
                          {heroSlides.map((_, idx) => (
                            <div key={idx} className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/30">
                              <motion.div
                                className="h-full bg-white"
                                initial={{ width: "0%" }}
                                animate={{ width: idx === currentExample ? "100%" : idx < currentExample ? "100%" : "0%" }}
                                transition={{ duration: idx === currentExample ? 3.5 : 0, ease: "linear" }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <figcaption className="sr-only">
                  Interactive preview of AI-generated roast book images rotating through examples
                </figcaption>
              </figure>
            </Link>
            <p className="text-center mt-3 text-sm text-foreground/40 font-medium">
              Tap to explore a real book
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
