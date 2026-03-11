'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, Share2, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Flip animation state
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [flipDir, setFlipDir] = useState<'forward' | 'backward' | null>(null);
  const [animating, setAnimating] = useState(false);

  // Swipe hint
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const swipeHintDismissed = useRef(false);

  const startParamApplied = useRef(false);

  // Touch tracking (vertical swipe)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const isSwiping = useRef(false);
  const isTransitioningRef = useRef(false);
  const hideArrowsTimer = useRef<NodeJS.Timeout | null>(null);

  // Ref for the interactive layer — needed for non-passive touchmove listener
  const interactiveLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBook();
  }, []);

  // Poll only while NOT complete - stop once done
  useEffect(() => {
    if (!book || book.status === 'complete') return;
    const interval = setInterval(fetchBook, 3000);
    return () => clearInterval(interval);
  }, [book?.status]);

  // Apply ?start= param once book is loaded
  useEffect(() => {
    if (!book || startParamApplied.current) return;
    const startParam = searchParams.get('start');
    if (startParam) {
      const startIndex = parseInt(startParam, 10);
      const allSlides = buildSlides(book);
      if (!isNaN(startIndex) && startIndex >= 0 && startIndex < allSlides.length) {
        setActiveIndex(startIndex);
      }
      startParamApplied.current = true;
    }
  }, [book, searchParams]);

  // Preload all images on mount so navigation is instant
  useEffect(() => {
    if (!book) return;
    const allSlides = buildSlides(book);
    const urls = allSlides.map(s => s.imageUrl).filter(Boolean) as string[];
    if (urls.length === 0) { setImagesPreloaded(true); return; }
    let loaded = 0;
    urls.forEach(url => {
      const img = new window.Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === urls.length) setImagesPreloaded(true);
      };
      img.src = url;
    });
  }, [book?.id]);

  // Auto-dismiss swipe hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Non-passive touchmove listener so preventDefault works on Safari
  useEffect(() => {
    const el = interactiveLayerRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchEndY.current = touch.clientY;
      const deltaY = Math.abs(touchEndY.current - touchStartY.current);
      const deltaX = Math.abs(touch.clientX - touchStartX.current);
      if (deltaY > 20 && deltaY > deltaX) {
        isSwiping.current = true;
        e.preventDefault(); // requires passive: false
      }
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []); // refs are stable, no deps needed

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/book/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href.split('?')[0];
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
  const slides = useMemo(() => book ? buildSlides(book) : [], [book]);

  const dismissSwipeHint = useCallback(() => {
    if (!swipeHintDismissed.current) {
      swipeHintDismissed.current = true;
      setShowSwipeHint(false);
    }
  }, []);

  const goToNext = useCallback(() => {
    if (isTransitioningRef.current) return;
    const next = Math.min(activeIndex + 1, slides.length - 1);
    if (next === activeIndex) return;
    isTransitioningRef.current = true;
    dismissSwipeHint();
    setPrevIndex(activeIndex);
    setFlipDir('forward');
    setAnimating(true);
    setActiveIndex(next);
    setTimeout(() => {
      isTransitioningRef.current = false;
      setAnimating(false);
      setPrevIndex(null);
      setFlipDir(null);
    }, 420);
  }, [activeIndex, slides.length, dismissSwipeHint]);

  const goToPrev = useCallback(() => {
    if (isTransitioningRef.current) return;
    const prev = Math.max(activeIndex - 1, 0);
    if (prev === activeIndex) return;
    isTransitioningRef.current = true;
    dismissSwipeHint();
    setPrevIndex(activeIndex);
    setFlipDir('backward');
    setAnimating(true);
    setActiveIndex(prev);
    setTimeout(() => {
      isTransitioningRef.current = false;
      setAnimating(false);
      setPrevIndex(null);
      setFlipDir(null);
    }, 420);
  }, [activeIndex, dismissSwipeHint]);

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

  // Tap handler — left 30% = prev, right 70% = next
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSwiping.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  // Touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  // Touch end — vertical delta determines direction
  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    const deltaY = touchStartY.current - touchEndY.current;
    if (deltaY > 50) goToNext();       // swipe up → next
    else if (deltaY < -50) goToPrev(); // swipe down → prev
    setTimeout(() => { isSwiping.current = false; }, 10);
  };

  // Determine Hebrew
  const isHebrewBook = book ? (
    isPredominantlyHebrew(book.victim_name) ||
    (book.quotes && book.quotes.some(q => isPredominantlyHebrew(q)))
  ) : false;

  // === LOADING SCREENS ===
  if (loading || !book) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (book.status !== 'complete' && book.status !== 'preview_ready') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-6" />
        <h2
          className="text-2xl font-heading font-black mb-2 text-center text-white"
          dir={isHebrewBook ? 'rtl' : 'ltr'}
        >
          {isHebrewBook ? 'מייצר את הרוסטים שלך...' : 'Generating your roasts...'}
        </h2>
        <p className="text-gray-400 text-center" dir={isHebrewBook ? 'rtl' : 'ltr'}>
          {isHebrewBook
            ? 'זה לוקח בערך 2 דקות. אפשר לסגור ולחזור אחר כך!'
            : 'This usually takes about 2 minutes. Feel free to close and come back later!'}
        </p>
      </div>
    );
  }

  if (!imagesPreloaded) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  const bookUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';

  const bookTitle = isHebrewBook
    ? getHebrewBookTitle(book.victim_name, book.victim_gender)
    : `Things ${book.victim_name} Would Never Say`;

  const currentSlide = slides[activeIndex];

  return (
    <>
      {/* ── Keyframes for 3D page flip ─────────────────────────────────────── */}
      <style>{`
        @keyframes flipExitFwd {
          from { transform: rotateX(0deg); }
          to   { transform: rotateX(-90deg); }
        }
        @keyframes flipEnterBwd {
          from { transform: rotateX(-90deg); }
          to   { transform: rotateX(0deg); }
        }
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .flip-exit-fwd {
          animation: flipExitFwd 380ms ease-in-out forwards;
        }
        .flip-enter-bwd {
          animation: flipEnterBwd 380ms ease-in-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .flip-exit-fwd  { animation: none !important; transition: opacity 380ms ease; opacity: 0; }
          .flip-enter-bwd { animation: none !important; }
        }
      `}</style>

      {/* ── Outer shell ────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black flex items-center justify-center"
        onMouseMove={handleMouseMove}
      >
        {/* Card: full-screen on mobile, 9:16 portrait centered on desktop */}
        <div className="absolute inset-0 md:relative md:inset-auto md:h-screen md:aspect-[9/16] md:overflow-hidden">

          {/* ── Progress Bars ────────────────────────────────────────────── */}
          <div className="absolute top-0 left-0 right-0 z-50 pt-safe">
            <div className="flex gap-1 px-2 py-2">
              {slides.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                  <div
                    className={`h-full ${i <= activeIndex ? 'w-full bg-white' : 'w-0 bg-white'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="absolute top-0 left-0 right-0 z-40 pt-safe">
            <div className="flex items-center justify-between px-4 py-3 mt-3">
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
                aria-label="Go home"
              >
                <Home className="w-5 h-5" />
              </Link>

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

          {/* ── Slide Image Layers (animated) ────────────────────────────── */}
          {slides.map((slide, i) => {
            const isActive = i === activeIndex;
            const isPrev = animating && i === prevIndex;
            const isVisible = isActive || isPrev;

            // Forward: outgoing (prev) sits on top and folds away
            // Backward: incoming (active) sits on top and falls into place
            const slideZIndex =
              (animating && isPrev && flipDir === 'forward') ? 2 :
              (animating && isActive && flipDir === 'backward') ? 2 : 1;

            const animClass =
              (animating && isPrev && flipDir === 'forward') ? 'flip-exit-fwd' :
              (animating && isActive && flipDir === 'backward') ? 'flip-enter-bwd' :
              '';

            return (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  visibility: isVisible ? 'visible' : 'hidden',
                  zIndex: slideZIndex,
                  // perspective on the wrapper (parent of the rotated element)
                  perspective: '1200px',
                  perspectiveOrigin: '50% 100%',
                }}
              >
                <div
                  className={`absolute inset-0 ${animClass}`}
                  style={{ transformOrigin: 'bottom center' }}
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
              </div>
            );
          })}

          {/* ── Interactive Layer — tap + swipe + content overlays ────────── */}
          {/*   z-10: above image layers, below header/progress (z-40/z-50)   */}
          <div
            ref={interactiveLayerRef}
            className="absolute inset-0 z-10 cursor-pointer"
            style={{ touchAction: 'none' } as React.CSSProperties}
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            // onTouchMove is handled by the native listener (passive: false) above
          >
            {/* Content overlays — switch instantly on top of the flip */}
            {currentSlide.type === 'end' ? (
              <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
                <TheEndPage victimName={book.victim_name} bookUrl={bookUrl} />
              </div>
            ) : currentSlide.type === 'greeting' ? (
              <div className="absolute inset-0 bg-white flex items-center justify-center p-8">
                <div className="absolute inset-0 border-[20px] border-yellow-400" />
                <div className="text-center relative z-10">
                  <h3
                    className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4"
                    dir={isHebrewBook ? 'rtl' : 'ltr'}
                  >
                    {isHebrewBook ? 'הקדשה אישית' : 'A message for you'}
                  </h3>
                  <p
                    className="text-3xl font-heading font-bold text-black transform -rotate-1"
                    dir={isHebrewBook ? 'rtl' : 'ltr'}
                  >
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
                  <div className="absolute bottom-0 left-0 right-0 pb-safe pb-6">
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none"
                      style={{ height: '150%', bottom: 0, top: 'auto' }}
                    />
                    <div className="relative z-10 mx-4 mb-4">
                      <div className="bg-black/50 backdrop-blur-md rounded-xl px-5 py-4">
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

          {/* ── Swipe hint (cover page only, first session) ──────────────── */}
          {showSwipeHint && activeIndex === 0 && (
            <div className="absolute bottom-24 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
              <ChevronUp
                className="w-6 h-6 text-white/70"
                style={{ animation: 'bounceUp 1s ease-in-out infinite' }}
              />
              <span className="text-white/60 text-xs mt-1 font-medium tracking-wide">
                {isHebrewBook ? 'החליקו למעלה' : 'Swipe up'}
              </span>
            </div>
          )}

          {/* ── Desktop Arrow Buttons ─────────────────────────────────────── */}
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

          {/* ── Page Dots ─────────────────────────────────────────────────── */}
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
      </div>
    </>
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
