'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BookData = {
  cover_image_url: string;
  full_image_urls: string[];
  quotes: string[];
  victim_name: string;
};

type Slide = {
  type: 'cover' | 'roast';
  imageUrl: string;
  quote: string | null;
};

function buildSlides(book: BookData): Slide[] {
  return [
    { type: 'cover', imageUrl: book.cover_image_url, quote: null },
    ...(book.full_image_urls ?? []).map((url, i) => ({
      type: 'roast' as const,
      imageUrl: url,
      quote: (book.quotes ?? [])[i] ?? null,
    })),
  ];
}

export function DemoFlipbook({ slug }: { slug: string }) {
  const [book, setBook] = useState<BookData | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);
  const isTransitioning = useRef(false);
  const hideArrowsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanced = useRef(false);

  useEffect(() => {
    fetch(`/api/book/${slug}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setBook(data); })
      .catch(() => {});
  }, [slug]);

  useEffect(() => () => {
    if (hideArrowsTimer.current) clearTimeout(hideArrowsTimer.current);
  }, []);

  useEffect(() => {
    if (!book || autoAdvanced.current) return;
    autoAdvanced.current = true;
    const timer = setTimeout(() => setActiveIndex(1), 800);
    return () => clearTimeout(timer);
  }, [book]);

  const slides = book ? buildSlides(book) : [];

  const goToNext = useCallback(() => {
    if (isTransitioning.current || !slides.length) return;
    isTransitioning.current = true;
    setActiveIndex(prev => Math.min(prev + 1, slides.length - 1));
    setTimeout(() => { isTransitioning.current = false; }, 300);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setActiveIndex(prev => Math.max(prev - 1, 0));
    setTimeout(() => { isTransitioning.current = false; }, 300);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowArrows(true);
    if (hideArrowsTimer.current) clearTimeout(hideArrowsTimer.current);
    hideArrowsTimer.current = setTimeout(() => setShowArrows(false), 2000);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const dx = Math.abs(touchEndX.current - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 20 && dx > dy) isSwiping.current = true;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 50) goToNext();
    else if (delta < -50) goToPrev();
    setTimeout(() => { isSwiping.current = false; }, 10);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSwiping.current) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    if (e.clientX - left < width * 0.3) goToPrev();
    else goToNext();
  };

  if (!book) {
    return (
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-zinc-800 animate-pulse"
        style={{ aspectRatio: '9/16' }}
        aria-label="Loading demo"
        role="img"
      />
    );
  }

  const currentSlide = slides[activeIndex];

  return (
    <div
      role="region"
      aria-label={`Demo roast book for ${book.victim_name}`}
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer select-none bg-black"
      style={{ aspectRatio: '9/16' }}
      onMouseMove={handleMouseMove}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-0.5 px-2 pt-2">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
            <div className={`h-full bg-white ${i <= activeIndex ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      {/* Image layers - all preloaded, toggled by visibility */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            visibility: i === activeIndex ? 'visible' : 'hidden',
            zIndex: i === activeIndex ? 1 : 0,
          }}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.type === 'cover' ? `Things ${book.victim_name} Would Never Say - cover` : `Roast page ${i}`}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="320px"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Content overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {currentSlide?.type === 'cover' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end items-center p-5 pb-12">
            <h3 className="text-xl font-heading font-black text-white text-center drop-shadow-2xl leading-tight">
              Things {book.victim_name} Would Never Say
            </h3>
          </div>
        )}
        {currentSlide?.type === 'roast' && currentSlide.quote && (
          <div className="absolute bottom-0 left-0 right-0">
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
              style={{ height: '60%', bottom: 0, top: 'auto' }}
            />
            <div className="relative z-10 mx-3 mb-6">
              <div className="bg-black/50 backdrop-blur-md rounded-xl px-4 py-3">
                <p className="text-sm font-heading font-bold text-white text-center leading-snug">
                  &ldquo;{currentSlide.quote}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Left arrow — desktop hover only */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white items-center justify-center transition-opacity ${showArrows ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {/* Right arrow — always visible on all screen sizes */}
      {activeIndex < slides.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white items-center justify-center opacity-80"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-none">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`w-[10px] h-[10px] rounded-full transition-all duration-200 ${i === activeIndex ? 'bg-primary' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
