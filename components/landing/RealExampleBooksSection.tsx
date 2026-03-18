'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const FEATURED_BOOKS = [
  {
    slug: '9x7dzympme',
    name: 'Tyler',
    category: 'Friends',
    categoryColor: 'from-blue-500 to-cyan-500',
  },
  {
    slug: 'yjkyh70ga0',
    name: 'Emma',
    category: 'Coworker',
    categoryColor: 'from-purple-500 to-pink-500',
  },
] as const;

type BookData = {
  victim_name: string;
  full_image_urls: string[];
  quotes: string[];
};

type FeaturedBook = (typeof FEATURED_BOOKS)[number];

function BookCard({
  meta,
  book,
  index,
}: {
  meta: FeaturedBook;
  book: BookData | null;
  index: number;
}) {
  const image = book?.full_image_urls?.[0];
  const quote = book?.quotes?.[0];
  const name = book?.victim_name ?? meta.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="w-full max-w-[320px] mx-auto"
    >
      <Link href={`/book/${meta.slug}`} className="block group">
        {/* Phone-frame card */}
        <div className="relative aspect-[9/16] rounded-[1.75rem] overflow-hidden border-2 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_28px_80px_rgba(0,0,0,0.6)] bg-zinc-900">
          {/* Inner border for phone-frame depth */}
          <div
            className="absolute inset-[3px] rounded-[1.5rem] z-10 pointer-events-none border border-white/5"
            aria-hidden="true"
          />

          {image ? (
            <img
              src={image}
              alt={`Things ${name} Would Never Say - roast book preview`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse" aria-hidden="true" />
          )}

          {/* Category badge */}
          <div
            className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${meta.categoryColor} shadow-lg`}
          >
            {meta.category}
          </div>

          {/* Bottom gradient + quote */}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/70 to-transparent pt-20 pb-6 px-5">
            {quote ? (
              <p
                className="text-white font-heading font-bold text-base leading-snug text-center"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
              >
                &ldquo;{quote}&rdquo;
              </p>
            ) : (
              <div className="h-10 bg-white/10 rounded animate-pulse mx-4" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Below card */}
        <div className="mt-4 px-1">
          <h3 className="font-heading font-black text-base text-white leading-tight mb-1.5">
            Things {name} Would Never Say
          </h3>
          <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm transition-all group-hover:gap-2.5">
            Swipe Through
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function RealExampleBooksSection() {
  const [books, setBooks] = useState<(BookData | null)[]>([null, null]);

  useEffect(() => {
    FEATURED_BOOKS.forEach((meta, i) => {
      fetch(`/api/book/${meta.slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: BookData | null) => {
          setBooks((prev) => {
            const next = [...prev];
            next[i] = data;
            return next;
          });
        })
        .catch(() => {});
    });
  }, []);

  return (
    <section
      id="real-examples"
      className="py-20 md:py-28 bg-zinc-950 overflow-hidden"
      aria-labelledby="real-books-heading"
    >
      <div className="container max-w-[1200px] mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12 px-4 md:px-0"
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Real Books, Real People
          </div>
          <h2
            id="real-books-heading"
            className="text-3xl md:text-5xl font-heading font-black text-white mt-2 mb-4"
          >
            See Real Roast Books
          </h2>
          <p className="text-lg text-zinc-400">
            Swipe through actual books made by real people
          </p>
        </motion.header>

        {/* Vertical stack on mobile, 2-col grid on desktop — no horizontal scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-[680px] mx-auto px-4 md:px-0">
          {FEATURED_BOOKS.map((meta, i) => (
            <BookCard key={meta.slug} meta={meta} book={books[i]} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
