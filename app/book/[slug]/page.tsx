'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Home, Share2, Download } from 'lucide-react';
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

  useEffect(() => {
    fetchBook();
    const interval = setInterval(fetchBook, 3000);
    return () => clearInterval(interval);
  }, []);

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
        await navigator.share({
          title: `${title} 🔥📚`,
          text: text,
          url: url,
        });
      } catch (err) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

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

  const bookUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Detect if book uses Hebrew
  const isHebrewBook = isPredominantlyHebrew(book.victim_name) ||
    (book.quotes && book.quotes.some(q => isPredominantlyHebrew(q)));

  const bookTitle = isHebrewBook
    ? getHebrewBookTitle(book.victim_name, book.victim_gender)
    : `Things ${book.victim_name} Would Never Say`;

  // Build slides array
  const slides: Slide[] = [
    { type: 'cover', imageUrl: book.cover_image_url, quote: null },
    ...book.full_image_urls.slice(1).map((url, i) => ({
      type: 'roast' as const,
      imageUrl: url,
      quote: book.quotes[i],
    })),
  ];

  if (book.custom_greeting) {
    slides.push({ type: 'greeting', imageUrl: null, quote: book.custom_greeting });
  }
  slides.push({ type: 'end', imageUrl: null, quote: null });

  const goToNext = () => {
    if (activeIndex < slides.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const goToPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Left 30% = Previous, Right 70% = Next
    if (x < width * 0.3) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  const currentSlide = slides[activeIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Progress Bars - Instagram Style */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-safe">
        <div className="flex gap-1 px-2 py-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  i < activeIndex
                    ? 'w-full bg-white'
                    : i === activeIndex
                    ? 'w-full bg-white'
                    : 'w-0 bg-white'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Persistent Header */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-safe">
        <div className="flex items-center justify-between px-4 py-3 mt-3">
          {/* Home Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
            aria-label="Go home"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex-1 text-center px-4">
            <h1
              className="text-sm font-heading font-bold text-white truncate drop-shadow-lg"
              dir={isHebrewBook ? 'rtl' : 'ltr'}
            >
              {bookTitle}
            </h1>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area with Tap Zones */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleTap}
      >
        {/* Background Image */}
        {currentSlide.imageUrl && (
          <img
            src={currentSlide.imageUrl}
            alt="Roast slide"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Slide Content */}
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
            {/* Cover Slide Content */}
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

            {/* Roast Quote Overlay - Glass Morphism */}
            {currentSlide.type === 'roast' && currentSlide.quote && (
              <div className="absolute bottom-0 left-0 right-0 pb-safe pb-12">
                {/* Dark gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                {/* Quote Card */}
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

      {/* Page Counter - Bottom Center */}
      <div className="absolute bottom-4 left-0 right-0 z-30 pb-safe pointer-events-none">
        <p className="text-white/70 text-xs font-medium text-center drop-shadow-lg">
          {activeIndex + 1} / {slides.length}
        </p>
      </div>

      {/* Tap Zones Visual Guide (Optional - Remove in production) */}
      {/* <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute left-0 top-0 bottom-0 w-[30%] border-2 border-red-500/20" />
        <div className="absolute right-0 top-0 bottom-0 w-[70%] border-2 border-green-500/20" />
      </div> */}
    </div>
  );
}
