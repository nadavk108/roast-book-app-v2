'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge } from "@/components/ui/brutal-badge";
import { ArrowRight, Play, Shield, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const TYLER_SLUG = '9x7dzympme';

type HeroSlide = {
  image: string;
  quote: string;
  name: string;
  isCover?: boolean;
};

export function HeroSection() {
  const [currentExample, setCurrentExample] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  // Fetch Tyler's real book images
  useEffect(() => {
    fetch(`/api/book/${TYLER_SLUG}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.full_image_urls?.length) return;
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
        setHeroSlides([...coverSlides, ...imageSlides]);
      })
      .catch(() => {});
  }, []);

  // Auto-rotate — only once slides are loaded
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
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

      <div className="container py-16 md:py-24 lg:py-32 relative z-10 max-w-[1200px] mx-auto">
        {/*
          Mobile (flex-col + order):  headline/subtext → phone → CTAs → price → trust
          Desktop (lg: 2-col grid):   left col = headline+subtext (row 1) + price/CTAs/trust (row 2)
                                       right col = phone (row-span-2)
        */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8 lg:items-start">

          {/* ── 1 (mobile) / Left col row 1 (desktop): Headline + Subtext ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:col-start-1 lg:row-start-1"
          >
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black leading-[1.1] tracking-tight mb-6"
            >
              The Funniest Gift They&apos;ll Never See Coming
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Describe your friend&apos;s quirks and we&apos;ll generate a hilarious personalized roast book
              with AI-powered quotes and illustrations. Takes 5 minutes. They&apos;ll never forget it.
            </p>
          </motion.div>

          {/* ── 2 (mobile) / Right col rows 1-2 (desktop): Phone mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 relative"
            aria-label="Example roast book preview"
          >
            {/* Phone mockup frame — tap to open Tyler's book */}
            <Link href={`/book/${TYLER_SLUG}`} className="block" aria-label="Tap to explore Tyler's roast book">
              <figure className="relative mx-auto max-w-[220px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[380px]">
                {/* Phone bezel */}
                <div className="bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
                  <div className="bg-black rounded-[2rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-20" aria-hidden="true" />

                    {/* Screen content */}
                    <div className="aspect-[9/16] relative overflow-hidden">
                      {heroSlides.length === 0 ? (
                        <div className="absolute inset-0 bg-zinc-800 animate-pulse" aria-hidden="true" />
                      ) : (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentExample}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                          >
                            <Image
                              src={currentSlide.image}
                              alt={currentSlide.isCover ? `Things ${currentSlide.name} Would Never Say - roast book cover` : `AI-generated roast image: ${currentSlide.name} saying "${currentSlide.quote}"`}
                              fill
                              className="object-cover"
                              priority={currentExample === 0}
                              sizes="(max-width: 640px) 220px, (max-width: 768px) 280px, (max-width: 1024px) 320px, 380px"
                            />

                            {/* Cover overlay — matches flipbook viewer's cover page style */}
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
                              /* Quote overlay — roast images */
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
                            <div
                              key={idx}
                              className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/30"
                            >
                              <motion.div
                                className="h-full bg-white"
                                initial={{ width: "0%" }}
                                animate={{
                                  width: idx === currentExample ? "100%" : idx < currentExample ? "100%" : "0%"
                                }}
                                transition={{
                                  duration: idx === currentExample ? 3.5 : 0,
                                  ease: "linear"
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <figcaption className="sr-only">
                  Interactive preview of AI-generated roast book images rotating through Tyler&apos;s examples
                </figcaption>

              </figure>
            </Link>
            <p className="text-center mt-3 text-sm text-muted-foreground flex items-center justify-center gap-1">
              Tap to explore
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </p>
          </motion.div>

          {/* ── 3 (mobile) / Left col row 2 (desktop): CTAs + Price + Trust ──
               Inner flex-col so order-* classes can reposition price between mobile/desktop.
               Mobile:  CTAs (order-1) → price (order-2) → trust (order-3)
               Desktop: price (order-1 → lg:order-1) → CTAs (order-2 → lg:order-2) → trust (order-3)
          */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-3 lg:col-start-1 lg:row-start-2 flex flex-col gap-6"
          >
            {/* Price — order-2 on mobile (after CTAs), order-1 on desktop (before CTAs) */}
            <div className="order-2 lg:order-1 flex items-center gap-4 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-primary">$9.99</span>
                <span className="text-muted-foreground line-through" aria-label="Original price $29">$29</span>
              </div>
              <BrutalBadge variant="accent" size="sm">
                <Zap className="h-3 w-3 mr-1" aria-hidden="true" /> Introductory Price
              </BrutalBadge>
            </div>

            {/* CTAs — order-1 on mobile (first), order-2 on desktop (after price) */}
            <nav className="order-1 lg:order-2 flex flex-col sm:flex-row gap-3" aria-label="Primary actions">
              <Link href="/create" className="w-full sm:w-auto">
                <BrutalButton size="xl" className="w-full group">
                  Start Roasting Free
                  <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </BrutalButton>
              </Link>
              <BrutalButton
                variant="outline"
                size="xl"
                className="w-full sm:w-auto group"
                onClick={scrollToExamples}
              >
                <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                See Examples
              </BrutalButton>
            </nav>

            {/* Trust Signals — always last */}
            <ul className="order-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground list-none">
              <li className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Secure Payment</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Preview Free Before You Pay</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Ready in 2 min</span>
              </li>
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
