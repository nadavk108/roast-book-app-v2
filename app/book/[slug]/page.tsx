'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Home, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TheEndPage } from '@/components/flipbook/TheEndPage';
import { isPredominantlyHebrew, getHebrewBookTitle } from '@/lib/hebrew-utils';

type Book = {
  id: string;
  victim_name: string;
  victim_gender?: string;
  cover_image_url: string;
  full_image_urls: string[];
  quotes: string[];
  custom_greeting: string | null;
  slug: string;
  status: string;
};

type Slide = {
  type: 'cover' | 'roast' | 'greeting' | 'end';
  imageUrl: string | null;
  quote: string | null;
};

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showArrows, setShowArrows] = useState(false);

  // Swipe tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);
  const hideArrowsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBook();
    const interval = setInterval(fetchBook, 3000);
    return () => clearInterval(interval);
  }, []);

  // Preload all images once book is loaded
  useEffect(() => {
    if (!book) return;

    const imageUrls = [
      book.cover_image_url,
      ...book.full_image_urls,
    ].filter(Boolean);

    if (imageUrls.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loaded = 0;
    imageUrls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded >= imageUrls.length) setImagesLoaded(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded >= imageUrls.length) setImagesLoaded(true);
      };
      img.src = url;
    });

    const timeout = setTimeout(() => setImagesLoaded(true), 5000);
    return () => clearTimeout(timeout);
  }, [book]);

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/book/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
        if (data.status === 'complete') {
          setGenerating(false);
          setLoading(false);
        } else if (data.status === 'paid') {
          setGenerating(true);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Things ${book?.victim_name} Would Never Say`;
    const text = 'Check out this hilarious roast book!';

    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} 🔥📚`, text, url });
      } catch (err) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // Navigation
  const slides = book ? buildSlides(book) : [];

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Show arrows on mouse move, hide after 2s idle
  const handleMouseMove = useCallback(() => {
    setShowArrows(true);
    if (hideArrowsTimer.current) clearTimeout(hideArrowsTimer.current);
    hideArrowsTimer.current = setTimeout(() => setShowArrows(false), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideArrowsTimer.current) clearTimeout(hideArrowsTimer.current);
    };
  }, []);

  // Tap handler
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSwiping.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const deltaX = Math.abs(touchEndX.current - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (deltaX > 20 && deltaX > deltaY) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    const deltaX = touchStartX.current - touchEndX.current;
    if (deltaX > 50) goToNext();
    else if (deltaX < -50) goToPrev();
    setTimeout(() => { isSwiping.current = false; }, 10);
  };

  // Loading states
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-6" />
        <h2 className="text-2xl font-heading font-black mb-2 text-center text-white">
          Generating remaining roasts...
        </h2>
        <p className="text-gray-400 text-center">
          This usually takes about 2 minutes. Feel free to close this page and come back later!
        </p>
      </div>
    );
  }

  if (!book) return <div className="fixed inset-0 bg-black text-white flex items-center justify-center">Book not found</div>;

  if (!imagesLoaded) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  const bookUrl = typeof window !== 'undefined' ? window.location.href : '';

  const isHebrewBook = isPredominantlyHebrew(book.victim_name) ||
    (book.quotes && book.quotes.some(q => isPredominantlyHebrew(q)));

  const bookTitle = isHebrewBook
    ? getHebrewBookTitle(book.victim_name, book.victim_gender)
    : `Things ${book.victim_name} Would Never Say`;

  const currentSlide = slides[activeIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-safe">
        <div className="flex gap-1 px-2 py-2">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
              <div
                className={`h-full ${
                  i <= activeIndex ? 'w-full bg-white' : 'w-0 bg-white'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-safe">
        <div className="flex items-center justify-between px-4 py-3 mt-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
            aria-label="Go home"
          >
            <Home className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center px-4">
            <h1
              className="text-sm font-heading font-bold text-white truncate drop-shadow-lg"
              dir={isHebrewBook ? 'rtl' : 'ltr'}
            >
              {bookTitle}
            </h1>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preloaded Image Layers */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            visibility: i === activeIndex ? 'visible' : 'hidden',
            zIndex: i === activeIndex ? 1 : 0,
          }}
        >
          {slide.imageUrl && (
            <img
              src={slide.imageUrl}
              alt={`Slide ${i}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          )}
        </div>
      ))}

      {/* Interactive Layer — Tap + Swipe */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide Content Overlays */}
        {currentSlide.type === 'end' ? (
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
            <TheEndPage victimName={book.victim_name} bookUrl={bookUrl} />
          </div>
        ) : currentSlide.type === 'greeting' ? (
          <div className="absolute inset-0 bg-white flex items-center justify-center p-8">
            <div className="absolute inset-0 border-[20px] border-yellow-400"></div>
            <div className="text-center relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                A message for you
              </h3>
              <p className="text-3xl font-heading font-bold text-black transform -rotate-1">
                "{currentSlide.quote}"
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentSlide.type === 'cover' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end items-center p-6 pb-safe pb-20">
                <h1
                  className="text-4xl md:text-5xl font-heading font-black text-white leading-tight drop-shadow-2xl mb-4 text-center"
                  dir={isHebrewBook ? 'rtl' : 'ltr'}
                >
                  {bookTitle}
                </h1>
                <p
                  className="text-lg text-white/90 font-medium mb-12 drop-shadow-lg text-center"
                  dir={isHebrewBook ? 'rtl' : 'ltr'}
                >
                  {isHebrewBook
                    ? `ספר רוסט מוקדש ל${book.victim_name}`
                    : `A Roast Book Dedicated to ${book.victim_name}`}
                </p>
              </div>
            )}

            {currentSlide.type === 'roast' && currentSlide.quote && (
              <div className="absolute bottom-0 left-0 right-0 pb-safe pb-12">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="relative z-10 mx-6 mb-6">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                    <p
                      className="text-xl md:text-2xl font-heading font-bold text-white leading-snug text-center"
                      dir={isPredominantlyHebrew(currentSlide.quote) ? 'rtl' : 'ltr'}
                    >
                      "{currentSlide.quote}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Arrow Buttons — hidden on touch, visible on mouse hover */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-all ${
            showArrows ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {activeIndex < slides.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-all ${
            showArrows ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Page Dots */}
      <div className="absolute bottom-2 left-0 right-0 z-30 pb-safe pointer-events-none">
        <div className="flex items-center justify-center gap-1">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-white/90' : 'w-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function buildSlides(book: Book): Slide[] {
  const slides: Slide[] = [
    { type: 'cover', imageUrl: book.cover_image_url, quote: null },
    ...book.full_image_urls.map((url, i) => ({
      type: 'roast' as const,
      imageUrl: url,
      quote: book.quotes[i],
    })),
  ];

  if (book.custom_greeting) {
    slides.push({ type: 'greeting', imageUrl: null, quote: book.custom_greeting });
  }
  slides.push({ type: 'end', imageUrl: null, quote: null });

  return slides;
}