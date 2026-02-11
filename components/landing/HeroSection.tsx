'use client';

import { useState, useEffect } from "react";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge } from "@/components/ui/brutal-badge";
import { ArrowRight, Sparkles, Play, Star, Shield, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Real AI-generated examples rotating in hero
const HERO_EXAMPLES = [
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_1.jpg",
    quote: "I made an amazing omelette today!",
    name: "Dad",
  },
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/56f74711-2bd0-4a58-be17-7a95ba532b8f/image_3.jpg",
    quote: "I actually prefer Android",
    name: "Josh",
  },
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/605f704c-45a8-4a82-ad2f-6e5571c847a5/image_0.jpg",
    quote: "Let's move somewhere quiet",
    name: "Tal",
  },
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_3.jpg",
    quote: "Leave the laundry, I'll fold it",
    name: "Dad",
  },
];

export function HeroSection() {
  const [currentExample, setCurrentExample] = useState(0);

  // Auto-rotate examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % HERO_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

      <div className="container py-16 md:py-24 lg:py-32 relative z-10 max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Trust Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <BrutalBadge variant="accent" size="lg" className="animate-bounce-in">
                <Sparkles className="h-4 w-4 mr-1" /> AI-Powered Gift
              </BrutalBadge>
              <div className="flex items-center gap-1 text-sm">
                <div className="flex" aria-label="5 star rating">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-muted-foreground ml-1">Loved by 500+ gifters</span>
              </div>
            </div>

            <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black leading-[1.1] tracking-tight">
              Create a Personalized AI{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Roast Book</span>
                <span className="absolute bottom-1 md:bottom-2 left-0 w-full h-3 md:h-4 bg-primary -z-0 -rotate-1" aria-hidden="true" />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Describe your friend's quirks. AI generates hilarious quotes and illustrations.
              You get a personalized roast book they'll never forget.
            </p>

            {/* Price Anchor */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-primary">$9.99</span>
                <span className="text-muted-foreground line-through" aria-label="Original price $29">$29</span>
              </div>
              <BrutalBadge variant="accent" size="sm">
                <Zap className="h-3 w-3 mr-1" aria-hidden="true" /> Launch Price
              </BrutalBadge>
            </div>

            {/* CTAs */}
            <nav className="flex flex-col sm:flex-row gap-3 pt-2" aria-label="Primary actions">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <BrutalButton size="xl" className="w-full group">
                  Start Roasting Free
                  <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </BrutalButton>
              </Link>
              <Link href="/examples" className="w-full sm:w-auto">
                <BrutalButton variant="outline" size="xl" className="w-full group">
                  <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                  See Examples
                </BrutalButton>
              </Link>
            </nav>

            {/* Trust Signals */}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground list-none">
              <li className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>Secure Payment</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Instant Delivery</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Ready in 2 min</span>
              </li>
            </ul>
          </motion.div>

          {/* Right: Animated Demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
            aria-label="Example roast book preview"
          >
            {/* Phone mockup frame */}
            <figure className="relative mx-auto max-w-[320px] md:max-w-[380px]">
              {/* Phone bezel */}
              <div className="bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
                <div className="bg-black rounded-[2rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-20" aria-hidden="true" />
                  
                  {/* Screen content */}
                  <div className="aspect-[9/16] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentExample}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <img
                          src={HERO_EXAMPLES[currentExample].image}
                          alt={`AI-generated roast image: ${HERO_EXAMPLES[currentExample].name} saying "${HERO_EXAMPLES[currentExample].quote}"`}
                          className="w-full h-full object-cover"
                          width={380}
                          height={676}
                          loading="eager"
                        />
                        
                        {/* Quote overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-32 pb-8 px-4">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                          >
                            <p className="text-white/60 text-xs mb-1">
                              Things {HERO_EXAMPLES[currentExample].name} Would Never Say
                            </p>
                            <p className="text-white text-lg font-semibold">
                              "{HERO_EXAMPLES[currentExample].quote}"
                            </p>
                          </motion.div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Progress indicators */}
                    <div className="absolute top-8 left-2 right-2 flex gap-1 z-10" aria-hidden="true">
                      {HERO_EXAMPLES.map((_, idx) => (
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
                  </div>
                </div>
              </div>
              <figcaption className="sr-only">
                Interactive preview of AI-generated roast book images rotating through examples
              </figcaption>

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -left-4 md:-left-12 top-1/4 bg-card border-2 border-border rounded-xl p-3 shadow-brutal-sm"
                aria-hidden="true"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                    🎁
                  </div>
                  <div className="text-xs">
                    <p className="font-bold">$9.99</p>
                    <p className="text-muted-foreground">Full book</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-4 md:-right-12 bottom-1/4 bg-card border-2 border-border rounded-xl p-3 shadow-brutal-sm"
                aria-hidden="true"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                    ✨
                  </div>
                  <div className="text-xs">
                    <p className="font-bold">AI Generated</p>
                    <p className="text-muted-foreground">in seconds</p>
                  </div>
                </div>
              </motion.div>
            </figure>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
