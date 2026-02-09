'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Lock, Shield, Home, Share2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin';
import { captureEvent, Events } from '@/lib/posthog';
import { isPredominantlyHebrew, getHebrewBookTitle } from '@/lib/hebrew-utils';

type Book = {
  id: string;
  victim_name: string;
  victim_gender?: string;
  victim_image_url: string;
  cover_image_url: string;
  preview_image_urls: string[];
  full_image_urls: string[];
  quotes: string[];
  slug: string;
  status: string;
  user_email: string | null;
};

type Page = {
  type: 'cover' | 'roast' | 'locked';
  imageUrl: string | null;
  quote: string | null;
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paymentTracked, setPaymentTracked] = useState(false);

  const adminMode = isAdminUser(user);

  useEffect(() => {
    loadUser();
    fetchBook();
  }, []);

  // Separate effect for payment tracking
  useEffect(() => {
    if (searchParams.get('payment') === 'success' && !paymentTracked && book) {
      captureEvent(Events.PAYMENT_COMPLETED, {
        book_id: book.id,
        victim_name: book.victim_name,
      });
      setPaymentTracked(true);

      // Track book completion
      captureEvent(Events.BOOK_COMPLETED, {
        book_id: book.id,
        victim_name: book.victim_name,
      });
    } else if (book && book.status === 'complete' && adminMode && !paymentTracked) {
      // Track admin book completion (no payment required)
      captureEvent(Events.BOOK_COMPLETED, {
        book_id: book.id,
        victim_name: book.victim_name,
        is_admin: true,
      });
      captureEvent(Events.ADMIN_BOOK_CREATED, {
        book_id: book.id,
        victim_name: book.victim_name,
        quote_count: book.quotes?.length,
      });
      setPaymentTracked(true);
    }
  }, [book, searchParams, paymentTracked, adminMode]);

  // Separate effect for polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (book && (book.status === 'paid' || book.status === 'generating_images')) {
      console.log('Book is paid, polling for new images...');
      pollInterval = setInterval(() => {
        fetchBook();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [book?.status]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/book/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Book loaded:', data);
        setBook(data);

        // If book is complete and has a slug, redirect to the public book page
        // This ensures shared links for complete books (like admin books) are publicly accessible
        if (data && data.status === 'complete' && data.slug) {
          console.log('Book is complete, redirecting to public book page:', data.slug);
          window.location.href = `/book/${data.slug}`;
          return;
        }

        // Track preview viewed when book loads with preview or complete status
        if (data && (data.status === 'preview_ready' || data.status === 'complete' || data.status === 'paid')) {
          captureEvent(Events.PREVIEW_GENERATED, {
            book_id: data.id,
            status: data.status,
            is_admin: isAdminUser(user),
          });
        }
      } else {
        console.error('Failed to fetch book:', res.status, await res.text());
        alert(`Failed to fetch book: ${res.status}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!book) return;
    const url = window.location.href;
    const title = isHebrewBook
      ? getHebrewBookTitle(book.victim_name, book.victim_gender)
      : `Things ${book.victim_name} Would Never Say`;
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

  const handleCheckout = async () => {
    if (!book) return;

    // Admin users shouldn't see this button, but handle it gracefully
    if (adminMode) {
      alert('Admin users have full access without payment');
      return;
    }

    // Track checkout initiation
    captureEvent(Events.CHECKOUT_INITIATED, {
      book_id: book.id,
      victim_name: book.victim_name,
    });

    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });

      const data = await res.json();

      // Handle admin bypass response
      if (data.bypassPayment || data.isAdmin) {
        alert('Admin users do not need to pay');
        setCheckingOut(false);
        return;
      }

      if (!res.ok) throw new Error('Checkout failed');
      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error(error);
      alert('Failed to start checkout');
      setCheckingOut(false);
    }
  };

  const goToNext = () => {
    if (activeIndex < pages.length - 1) {
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

  if (loading || !book) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  // Build pages based on payment status or admin mode
  const isPaid = book.status === 'paid' || book.status === 'complete';
  const isAdminBook = book.user_email === 'nadavkarlinski@gmail.com'; // Book created by admin
  const showAllImages = isPaid || adminMode || isAdminBook; // Show all if paid, viewer is admin, OR creator is admin

  // Choose image source: admin/paid users get full_image_urls, others get preview_image_urls
  const imageUrls = (showAllImages && book.full_image_urls?.length > 0)
    ? book.full_image_urls
    : book.preview_image_urls;

  const pages: Page[] = [
    { type: 'cover', imageUrl: book.cover_image_url || imageUrls[0], quote: null },
  ];

  // Add roast pages
  for (let i = 0; i < book.quotes.length; i++) {
    const imageUrl = imageUrls[i];

    // Admin or paid: show all available images
    // Not paid: show first 2 previews, then locked slides
    if (imageUrl && (showAllImages || i < 2)) {
      pages.push({ type: 'roast', imageUrl, quote: book.quotes[i] });
    } else if (!showAllImages) {
      pages.push({ type: 'locked', imageUrl: null, quote: book.quotes[i] });
    }
  }

  const totalPages = pages.length;

  // Detect Hebrew in book
  const isHebrewBook = isPredominantlyHebrew(book.victim_name) ||
    (book.quotes && book.quotes.some(q => isPredominantlyHebrew(q)));

  const bookTitle = isHebrewBook
    ? getHebrewBookTitle(book.victim_name, book.victim_gender)
    : `Things ${book.victim_name} Would Never Say`;

  const currentPage = pages[activeIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Progress Bars - Instagram Style */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-safe">
        <div className="flex gap-1 px-2 py-2">
          {pages.map((_, i) => (
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

      {/* Admin Badge */}
      {adminMode && (
        <div className="absolute top-16 left-4 z-50 flex items-center gap-2 bg-primary border-2 border-foreground px-3 py-1.5 rounded-lg shadow-brutal pt-safe">
          <Shield className="h-4 w-4 text-foreground" />
          <span className="font-heading font-bold text-sm text-foreground">ADMIN</span>
        </div>
      )}

      {/* Main Content Area with Tap Zones */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleTap}
      >
        {/* Background Image */}
        {currentPage.imageUrl && currentPage.type !== 'locked' && (
          <img
            src={currentPage.imageUrl}
            alt="Roast slide"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Slide Content */}
        {currentPage.type === 'locked' ? (
          <>
            {/* Blurred/locked background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

            {/* Quote shown even when locked - at bottom */}
            {currentPage.quote && (
              <div className="absolute bottom-0 left-0 right-0 pb-safe pb-12">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="relative z-10 mx-6 mb-6">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                    <p
                      className="text-xl md:text-2xl font-heading font-bold text-white text-center leading-snug"
                      dir={isPredominantlyHebrew(currentPage.quote) ? 'rtl' : 'ltr'}
                    >
                      "{currentPage.quote}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paywall overlay - centered, but allows tap-through for navigation */}
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="text-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="text-6xl mb-6">🔒</div>
                <h2 className="text-2xl font-heading font-black text-white mb-2">
                  Unlock Full Book
                </h2>
                <p className="text-gray-400 mb-8 max-w-sm">
                  Get all {book.quotes.length} hilarious roasts and share the complete book
                </p>
                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-heading font-black text-lg px-8 py-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {checkingOut ? 'Processing...' : 'Unlock Book - $9.99'}
                </Button>
                <p className="text-white/50 text-xs mt-4">
                  ← Tap sides to preview more quotes →
                </p>
              </div>
            </div>
          </>

        ) : (
          <>
            {/* Cover Slide Content */}
            {currentPage.type === 'cover' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-6 pb-safe pb-20">
                <h1
                  className="text-4xl md:text-5xl font-heading font-black text-white leading-tight drop-shadow-2xl mb-4"
                  dir={isHebrewBook ? 'rtl' : 'ltr'}
                  style={{ textAlign: isHebrewBook ? 'right' : 'left' }}
                >
                  {bookTitle}
                </h1>
                <p
                  className="text-lg text-white/90 font-medium mb-8 drop-shadow-lg"
                  dir={isHebrewBook ? 'rtl' : 'ltr'}
                  style={{ textAlign: isHebrewBook ? 'right' : 'left' }}
                >
                  {isHebrewBook
                    ? `ספר רוסט מוקדש ל${book.victim_name}`
                    : `A Roast Book Dedicated to ${book.victim_name}`}
                </p>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <span>{isHebrewBook ? 'הקש להמשך' : 'Tap to continue'}</span>
                    <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </p>
                  <p className="text-white/50 text-xs">
                    {isHebrewBook ? 'הקש שמאלה ← | הקש ימינה →' : '← Tap left | Tap right →'}
                  </p>
                </div>
              </div>
            )}

            {/* Roast Quote Overlay - Glass Morphism */}
            {currentPage.type === 'roast' && currentPage.quote && (
              <div className="absolute bottom-0 left-0 right-0 pb-safe pb-12">
                {/* Dark gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                {/* Quote Card */}
                <div className="relative z-10 mx-6 mb-6">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                    <p
                      className="text-xl md:text-2xl font-heading font-bold text-white text-center leading-snug"
                      dir={isPredominantlyHebrew(currentPage.quote) ? 'rtl' : 'ltr'}
                      style={{
                        textAlign: isPredominantlyHebrew(currentPage.quote) ? 'right' : 'center',
                      }}
                    >
                      "{currentPage.quote}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Page Counter - Minimal dot indicators */}
      <div className="absolute bottom-2 left-0 right-0 z-30 pb-safe pointer-events-none">
        <div className="flex items-center justify-center gap-1">
          {pages.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-6 bg-white/90'
                  : 'w-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
