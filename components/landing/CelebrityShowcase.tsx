import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BrutalButton } from '@/components/ui/brutal-button';

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
  return (
    <section className="py-12 md:py-16" aria-labelledby="celebrity-showcase-heading">
      <div className="container max-w-[1200px] mx-auto">
        {/* Section heading */}
        <div className="text-center mb-8 px-4 md:px-0">
          <h2
            id="celebrity-showcase-heading"
            className="text-3xl md:text-4xl font-heading font-black"
          >
            Things They Would Never Say
          </h2>
        </div>

        {/* Carousel: horizontal scroll + snap on mobile, 4-col grid on desktop */}
        <div
          className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible snap-x md:snap-none snap-mandatory scroll-pl-4 md:scroll-pl-0 pb-2 md:pb-0 px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
        >
          {CELEBRITIES.map((celeb) => (
            <article
              key={celeb.name}
              className="relative min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-start rounded-2xl overflow-hidden border border-border shadow-brutal-sm aspect-[3/4] bg-black"
            >
              {/* Celebrity image - eager-loaded, above the fold */}
              <img
                src={celeb.image}
                alt={`${celeb.name} saying "${celeb.quote}"`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                width={280}
                height={373}
              />

              {/* Quote overlay - gradient + frosted pill */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-3">
                <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-3 text-center">
                  <p className="text-white font-heading font-bold text-base leading-snug">
                    &ldquo;{celeb.quote}&rdquo;
                  </p>
                  <p className="text-white/70 text-xs mt-1.5 font-medium tracking-wide">
                    - {celeb.name}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA below carousel */}
        <div className="text-center mt-10 px-4 md:px-0">
          <p className="text-xl md:text-2xl font-heading font-bold mb-5">
            Now imagine this, but with YOUR friends
          </p>
          <Link href="/dashboard">
            <BrutalButton size="lg">
              Create a Roast Book
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </BrutalButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
