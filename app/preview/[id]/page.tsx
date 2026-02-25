'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Lock, Shield, Home, Share2, Send, X } from 'lucide-react';
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
  custom_greeting: string | null;
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

  // Personal note state
  const [showGreetingInput, setShowGreetingInput] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [greetingSaved, setGreetingSaved] = useState(false);
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [generationTimedOut, setGenerationTimedOut] = useState(false);

  // Swipe tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const adminMode = isAdminUser(user);
  const isPaymentReturn = searchParams.get('payment') === 'success';

  useEffect(() => {
    loadUser();
    fetchBook();
  }, []);

  // Show greeting input after payment while book generates
  useEffect(() => {
    if (isPaymentReturn && book && !greetingSaved && !book.custom_greeting) {
      const isGenerating = book.status === 'paid' || book.status === 'generating_remaining' || book.status === 'generating_images';
      if (isGenerating) {
        setShowGreetingInput(true);
      }
    }
  }, [book, isPaymentReturn, greetingSaved]);

  // Payment tracking
  useEffect(() => {
    if (isPaymentReturn && !paymentTracked && book) {
      captureEvent(Events.PAYMENT_COMPLETED, {
        book_id: book.id,
        victim_name: book.victim_name,
      });
      setPaymentTracked(true);

      captureEvent(Events.BOOK_COMPLETED, {
        book_id: book.id,
        victim_name: book.victim_name,
      });
    } else if (book && book.status === 'complete' && adminMode && !paymentTracked) {
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

  // Payment flow: trigger generation on mount, poll every 5s, timeout after 4 minutes.
  // Runs once when book first loads (book?.id dep). The atomic lock in generate-remaining
  // ensures only one invocation wins even if Stripe retries or the user refreshes.
  useEffect(() => {
    if (!book?.id || !isPaymentReturn) return;
    if (book.status !== 'paid' && book.status !== 'generating_remaining') return;

    const bookId = book.id;
    const controller = new AbortController();
    const TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes
    const startTime = Date.now();

    // Trigger generation — properly handled, not fire-and-forget
    (async () => {
      try {
        const res = await fetch('/api/generate-remaining', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId }),
          signal: controller.signal,
        });
        if (!res.ok) {
          console.error('[Preview] generate-remaining error:', res.status, await res.text());
        } else {
          console.log('[Preview] generate-remaining completed:', await res.json());
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[Preview] generate-remaining request failed:', err.message);
        }
      }
    })();

    // Poll every 5 seconds until complete or timed out
    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        clearInterval(pollInterval);
        setGenerationTimedOut(true);
        return;
      }

      try {
        const res = await fetch(`/api/book/${bookId}`);
        if (!res.ok) return;
        const data: Book = await res.json();
        setBook(data);

        if (data.status === 'complete' && (data.full_image_urls?.length ?? 0) >= 8) {
          clearInterval(pollInterval);
          window.location.href = `/book/${data.slug}?start=3`;
        }
      } catch (err) {
        console.error('[Preview] Poll error:', err);
      }
    }, 5000);

    return () => {
      controller.abort();
      clearInterval(pollInterval);
    };
  }, [book?.id, isPaymentReturn]);

  // Non-payment polling: admin or users viewing a book mid-generation
  useEffect(() => {
    if (isPaymentReturn) return;
    if (!book) return;
    const isGenerating = book.status === 'paid' || book.status === 'generating_images' || book.status === 'generating_remaining';
    if (!isGenerating) return;

    const pollInterval = setInterval(() => fetchBook(), 3000);
    return () => clearInterval(pollInterval);
  }, [book?.status, isPaymentReturn]);

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
        setBook(data);

       if (data && data.status === 'complete' && data.slug) {
            // Only skip to slide 3 if returning from payment, otherwise start at cover
            const startParam = isPaymentReturn ? '?start=3' : '';
            window.location.href = `/book/${data.slug}${startParam}`;
            return;
          }

        if (data && (data.status === 'preview_ready' || data.status === 'complete' || data.status === 'paid')) {
          captureEvent(Events.PREVIEW_GENERATED, {
            book_id: data.id,
            status: data.status,
            is_admin: isAdminUser(user),
          });
        }
      } else {
        console.error('Failed to fetch book:', res.status, await res.text());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGreeting = async () => {
    if (!book || !greetingText.trim()) return;

    setSavingGreeting(true);
    try {
      const res = await fetch(`/api/book/${book.id}/update-greeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, greeting: greetingText.trim() }),
      });

      if (res.ok) {
        setGreetingSaved(true);
        setShowGreetingInput(false);
      }
    } catch (error) {
      console.error('Failed to save greeting:', error);
    } finally {
      setSavingGreeting(false);
    }
  };

  const handleSkipGreeting = () => {
    setShowGreetingInput(false);
    setGreetingSaved(true);
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

  const handleCheckout = async () => {
    if (!book) return;

    if (adminMode) {
      alert('Admin users have full access without payment');
      return;
    }

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

      if (data.bypassPayment || data.isAdmin) {
        alert('Admin users do not need to pay');
        setCheckingOut(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      window.location.href = data.sessionUrl;
    } catch (error: any) {
      alert(`Failed to start checkout: ${error.message || 'Unknown error'}`);
      setCheckingOut(false);
    }
  };

  // Navigation
  const goToNext = useCallback(() => {
    if (book) {
      const pages = buildPages(book, isAdminUser(user));
      setActiveIndex((prev) => Math.min(prev + 1, pages.length - 1));
    }
  }, [book, user]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

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

  if (loading || !book) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  const isPaid = book.status === 'paid' || book.status === 'complete' || book.status === 'generating_remaining';
  const isAdminBook = book.user_email === 'nadavkarlinski@gmail.com';
  const showAllImages = isPaid || adminMode || isAdminBook;

  const imageUrls = (showAllImages && book.full_image_urls?.length > 0)
    ? book.full_image_urls
    : book.preview_image_urls;

  const pages = buildPages(book, adminMode);

  const isHebrewBook = isPredominantlyHebrew(book.victim_name) ||
    (book.quotes && book.quotes.some(q => isPredominantlyHebrew(q)));

  const bookTitle = isHebrewBook
    ? getHebrewBookTitle(book.victim_name, book.victim_gender)
    : `Things ${book.victim_name} Would Never Say`;

  const currentPage = pages[activeIndex];
  const isGenerating = book.status === 'paid' || book.status === 'generating_remaining' || book.status === 'generating_images';

  // Personal note screen (shown after payment, during generation)
  if (showGreetingInput && isPaymentReturn) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Top section with generating indicator */}
        <div className="flex items-center justify-center gap-3 pt-safe pt-6 px-6">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-400 border-t-transparent" />
          <p className="text-white/60 text-sm">
            {isHebrewBook ? 'מייצר את הרוסטים שלך...' : 'Generating your roasts...'}
          </p>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-6">💌</div>
          <h2
            className="text-2xl font-heading font-black text-white mb-2 text-center"
            dir={isHebrewBook ? 'rtl' : 'ltr'}
          >
            {isHebrewBook
              ? `רוצה להוסיף הקדשה ל${book.victim_name}?`
              : `Add a personal note for ${book.victim_name}?`}
          </h2>
          <p
            className="text-gray-400 mb-8 text-center max-w-sm"
            dir={isHebrewBook ? 'rtl' : 'ltr'}
          >
            {isHebrewBook
              ? 'זה יופיע כעמוד מיוחד בסוף הספר'
              : "It'll appear as a special page at the end of the book"}
          </p>

          <textarea
            value={greetingText}
            onChange={(e) => setGreetingText(e.target.value)}
            placeholder={isHebrewBook
              ? 'למשל: יום הולדת שמח! אוהב/ת אותך למרות הכל 😂'
              : 'e.g. Happy birthday! Love you despite everything 😂'}
            maxLength={200}
            dir={isHebrewBook ? 'rtl' : 'ltr'}
            className="w-full max-w-md h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/30 text-lg resize-none focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50"
          />
          <p className="text-white/30 text-xs mt-2">
            {greetingText.length}/200
          </p>

          <div className="flex gap-3 mt-6 w-full max-w-md">
            <button
              onClick={handleSkipGreeting}
              className="flex-1 py-4 rounded-xl border border-white/20 text-white/60 font-heading font-bold text-sm hover:bg-white/5 transition-colors"
            >
              {isHebrewBook ? 'דלג' : 'Skip'}
            </button>
            <button
              onClick={handleSaveGreeting}
              disabled={!greetingText.trim() || savingGreeting}
              className="flex-1 py-4 rounded-xl bg-yellow-400 text-black font-heading font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
            >
              {savingGreeting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isHebrewBook ? 'הוסף הקדשה' : 'Add note'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating state (after greeting saved/skipped, or if no greeting prompt)
  if (isPaymentReturn && isGenerating) {
    if (generationTimedOut) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8">
          <div className="text-5xl mb-6">⏱️</div>
          <h2
            className="text-2xl font-heading font-black mb-2 text-center text-white"
            dir={isHebrewBook ? 'rtl' : 'ltr'}
          >
            {isHebrewBook ? 'זה לוקח יותר מהרגיל...' : 'This is taking longer than expected'}
          </h2>
          <p
            className="text-gray-400 text-center mb-8 max-w-sm"
            dir={isHebrewBook ? 'rtl' : 'ltr'}
          >
            {isHebrewBook
              ? 'הרוסטים שלך עוד מייצרים. נשלח לך מייל כשזה מוכן.'
              : 'Your roasts are still generating. We\'ll email you when they\'re ready.'}
          </p>
          <a
            href="mailto:support@theroastbook.com"
            className="bg-yellow-400 text-black font-heading font-black px-6 py-4 rounded-xl text-sm hover:bg-yellow-300 transition-colors"
          >
            {isHebrewBook ? 'צור קשר' : 'Contact us'}
          </a>
        </div>
      );
    }

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
        {greetingSaved && greetingText.trim() && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-sm">
            <p className="text-white/40 text-xs mb-1" dir={isHebrewBook ? 'rtl' : 'ltr'}>
              {isHebrewBook ? 'ההקדשה שלך:' : 'Your note:'}
            </p>
            <p className="text-white/80 text-sm" dir={isHebrewBook ? 'rtl' : 'ltr'}>
              "{greetingText}"
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-safe">
        <div className="flex gap-1 px-2 py-2">
          {pages.map((_, i) => (
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

      {/* Admin Badge */}
      {adminMode && (
        <div className="absolute top-16 left-4 z-50 flex items-center gap-2 bg-primary border-2 border-foreground px-3 py-1.5 rounded-lg shadow-brutal pt-safe">
          <Shield className="h-4 w-4 text-foreground" />
          <span className="font-heading font-bold text-sm text-foreground">ADMIN</span>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

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

            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                <div className="text-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="text-6xl mb-6">🔒</div>
                  <h2 className="text-2xl font-heading font-black text-white mb-2">
                    {isHebrewBook ? 'פתחו את הספר המלא' : 'Unlock Full Book'}
                  </h2>
                  <p className="text-gray-400 mb-8 max-w-sm" dir={isHebrewBook ? 'rtl' : 'ltr'}>
                    {isHebrewBook
                      ? `קבלו את כל ${book.quotes.length} הרוסטים ושתפו את הספר המלא`
                      : `Get all ${book.quotes.length} hilarious roasts and share the complete book`}
                  </p>
                  <Button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    size="lg"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-heading font-black text-lg px-8 py-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {checkingOut
                      ? (isHebrewBook ? 'מעבד...' : 'Processing...')
                      : (isHebrewBook ? 'פתחו את הספר - $9.99' : 'Unlock Book - $9.99')}
                  </Button>
                  <p className="text-white/50 text-xs mt-4">
                    {isHebrewBook ? '← הקישו בצדדים לתצוגה מקדימה →' : '← Tap sides to preview more quotes →'}
                  </p>
                </div>
              </div>
          </>
        ) : (
          <>
            {currentPage.type === 'cover' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end items-center p-6 pb-safe pb-20">
                <h1
                  className="text-4xl md:text-5xl font-heading font-black text-white leading-tight drop-shadow-2xl mb-4 text-center"
                  dir={isHebrewBook ? 'rtl' : 'ltr'}
                >
                  {bookTitle}
                </h1>
                <p
                  className="text-lg text-white/90 font-medium mb-8 drop-shadow-lg text-center"
                  dir={isHebrewBook ? 'rtl' : 'ltr'}
                >
                  {isHebrewBook
                    ? `ספר רוסט מוקדש ל${book.victim_name}`
                    : `A Roast Book Dedicated to ${book.victim_name}`}
                </p>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <span>{isHebrewBook ? 'הקש להמשך' : 'Tap to continue'}</span>
                  </p>
                </div>
              </div>
            )}

            {currentPage.type === 'roast' && currentPage.quote && (
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
          </>
        )}
      </div>

      {/* Page Dots */}
      <div className="absolute bottom-2 left-0 right-0 z-30 pb-safe pointer-events-none">
        <div className="flex items-center justify-center gap-1">
          {pages.map((_, index) => (
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

function buildPages(book: any, adminMode: boolean): Page[] {
  const isPaid = book.status === 'paid' || book.status === 'complete' || book.status === 'generating_remaining';
  const isAdminBook = book.user_email === 'nadavkarlinski@gmail.com';
  const showAllImages = isPaid || adminMode || isAdminBook;

  const imageUrls = (showAllImages && book.full_image_urls?.length > 0)
    ? book.full_image_urls
    : book.preview_image_urls;

  const pages: Page[] = [
    { type: 'cover', imageUrl: book.cover_image_url || imageUrls[0], quote: null },
  ];

  for (let i = 0; i < book.quotes.length; i++) {
    const imageUrl = imageUrls[i];
    if (imageUrl && (showAllImages || i < 2)) {
      pages.push({ type: 'roast', imageUrl, quote: book.quotes[i] });
    } else if (!showAllImages) {
      pages.push({ type: 'locked', imageUrl: null, quote: book.quotes[i] });
    }
  }

  return pages;
}