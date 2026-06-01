'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const CELEBRITIES = [
  {
    image: '/celebrities/einstein.png',
    quote: 'Math? I just guess.',
    name: 'Einstein',
  },
  {
    image: '/celebrities/napoleon.png',
    quote: 'Small goals, small life.',
    name: 'Napoleon',
  },
  {
    image: '/celebrities/bruce-lee.png',
    quote: "I'd rather just talk it out.",
    name: 'Bruce Lee',
  },
  {
    image: '/celebrities/marilyn-monroe.png',
    quote: 'Let me just blend in.',
    name: 'Marilyn Monroe',
  },
];

export function CelebrityShowcase() {
  const [active, setActive] = useState(0);
  const touchRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!touchRef.current) {
        setActive((prev) => (prev + 1) % CELEBRITIES.length);
      }
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleTouch = () => {
    touchRef.current = true;
    setTimeout(() => { touchRef.current = false; }, 5000);
  };

  return (
    <section className="py-14 bg-background overflow-hidden" aria-labelledby="celebrity-showcase-heading">
      <div className="container max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-8">
          <h2
            id="celebrity-showcase-heading"
            className="font-heading font-black text-2xl md:text-3xl tracking-tight"
          >
            Things They Would Never Say
          </h2>
          <p className="text-foreground/50 text-sm mt-1">The humor that makes roast books unforgettable</p>
        </div>

        {/* Carousel: horizontal scroll + snap on mobile, 4-col grid on desktop */}
        <div
          className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible snap-x md:snap-none snap-mandatory scroll-pl-4 md:scroll-pl-0 pb-2 md:pb-0 px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
          onTouchStart={handleTouch}
        >
          {CELEBRITIES.map((celeb, i) => (
            <article
              key={celeb.name}
              className={`relative min-w-[260px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-start rounded-2xl overflow-hidden border-[2.5px] border-foreground aspect-[3/4] bg-black transition-all duration-300 ${
                i === active ? 'shadow-[6px_6px_0_#0E0E0E] md:scale-[1.02]' : 'shadow-[4px_4px_0_#0E0E0E]'
              }`}
            >
              <Image
                src={celeb.image}
                alt={`${celeb.name} saying "${celeb.quote}"`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 260px, 25vw"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-3">
                <div className="bg-foreground/80 backdrop-blur-md border border-background/10 rounded-xl px-3 py-3 text-center">
                  <p className="text-background font-heading font-bold text-sm leading-snug">
                    &ldquo;{celeb.quote}&rdquo;
                  </p>
                  <p className="text-background/60 text-xs mt-1.5 font-medium">
                    - {celeb.name}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5 md:hidden" aria-hidden="true">
          {CELEBRITIES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full border border-foreground transition-all ${
                i === active ? 'bg-primary w-5' : 'bg-foreground/20'
              }`}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-xl md:text-2xl font-heading font-bold mb-5">
            Now imagine this, but with YOUR friends
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-primary text-foreground font-heading font-black px-8 py-4 rounded-xl border-[2.5px] border-foreground shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0E0E0E] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
          >
            Start Roasting Free
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
