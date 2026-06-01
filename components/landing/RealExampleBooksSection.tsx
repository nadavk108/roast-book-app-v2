'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const FEATURED_BOOKS = [
  {
    slug: '9x7dzympme',
    name: 'Tyler',
    category: 'Friends',
  },
  {
    slug: 'r6vsw49szs',
    name: 'Lauren',
    category: 'Family',
  },
  {
    slug: 'yjkyh70ga0',
    name: 'Emma',
    category: 'Coworker',
  },
] as const;

type BookData = {
  victim_name: string;
  full_image_urls: string[];
  quotes: string[];
} | null;

type FeaturedBook = (typeof FEATURED_BOOKS)[number];

function BookCard({
  meta,
  book,
}: {
  meta: FeaturedBook;
  book: BookData | null;
}) {
  const image = book?.full_image_urls?.[0];
  const quote = book?.quotes?.[0];
  const name = book?.victim_name ?? meta.name;

  return (
    <Link href={`/book/${meta.slug}`} className="block group">
      {/* Phone-frame card with neobrutalist border */}
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border-[2.5px] border-foreground shadow-[6px_6px_0_#0E0E0E] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_#0E0E0E] bg-zinc-900">
        {image ? (
          <Image
            src={image}
            alt={`Things ${name} Would Never Say - roast book preview`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 85vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" aria-hidden="true" />
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full bg-primary border-[2px] border-foreground font-heading font-black text-xs text-foreground shadow-[2px_2px_0_#0E0E0E]">
          {meta.category}
        </div>

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/70 to-transparent pt-20 pb-5 px-4">
          {quote ? (
            <p className="text-white font-heading font-bold text-sm leading-snug text-center">
              &ldquo;{quote}&rdquo;
            </p>
          ) : (
            <div className="h-8 bg-white/10 rounded animate-pulse mx-4" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Below card */}
      <div className="mt-3 px-1">
        <h3 className="font-heading font-black text-base text-foreground leading-tight mb-1">
          Things {name} Would Never Say
        </h3>
        <span className="inline-flex items-center gap-1.5 text-primary font-heading font-bold text-sm group-hover:gap-2.5 transition-all">
          View Full Book
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function RealExampleBooksSection({ initialBooks }: { initialBooks?: (BookData | null)[] }) {
  const [books] = useState<(BookData | null)[]>(initialBooks ?? [null, null, null]);

  return (
    <section
      id="real-examples"
      className="py-20 md:py-24 bg-muted"
      aria-labelledby="real-books-heading"
    >
      <div className="container max-w-[1200px] mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-card border-[2.5px] border-foreground rounded-full px-4 py-1.5 shadow-[3px_3px_0_#0E0E0E] mb-5">
            <span aria-hidden="true">✨</span>
            <span className="font-heading font-black text-sm text-foreground">Real Books, Real People</span>
          </div>
          <h2
            id="real-books-heading"
            className="font-heading font-black text-3xl md:text-4xl tracking-tight text-foreground"
          >
            See Real Roast Books
          </h2>
          <p className="text-foreground/50 text-base mt-3">
            Swipe through actual books made by real people
          </p>
        </div>

        {/* Mobile: horizontal snap-scroll. Desktop: 3-col grid */}
        <div
          className="flex md:grid md:grid-cols-3 gap-5 md:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory overscroll-x-contain px-4 md:px-0 pb-6 md:pb-0 -mx-4 md:mx-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {FEATURED_BOOKS.map((meta, i) => (
            <div key={meta.slug} className="flex-none w-[78vw] md:w-auto snap-center">
              <BookCard meta={meta} book={books[i] ?? null} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
