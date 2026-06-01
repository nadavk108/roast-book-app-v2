'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';

type BookStatus = 'analyzing' | 'generating_prompts' | 'generating_images' | 'preview_ready' | 'paid' | 'complete' | 'failed';

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();

  // FIXED: Use params.bookId instead of params.id
  const bookId = params.bookId as string;

  const [status, setStatus] = useState<BookStatus>('analyzing');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generationTriggeredRef = useRef(false);

  // Trigger generation on mount - belt-and-suspenders in case the quotes page
  // fire-and-forget was cancelled by browser navigation
  useEffect(() => {
    if (!bookId || generationTriggeredRef.current) return;
    generationTriggeredRef.current = true;

    console.log('[Progress] Triggering generation for bookId:', bookId);

    const triggerGeneration = async () => {
      try {
        // Fetch book to get quotes and current status
        const res = await fetch(`/api/book/${bookId}`);
        if (!res.ok) {
          console.error('[Progress] Failed to fetch book for trigger:', res.status);
          return;
        }
        const book = await res.json();

        console.log('[Progress] Book status:', book.status, '| quotes count:', book.quotes?.length ?? 0);

        // If book has no quotes, nothing to generate yet
        if (!book.quotes?.length) {
          console.log('[Progress] No quotes found, skipping generation trigger');
          return;
        }

        // If already in progress or complete, API atomic lock will handle it
        console.log('[Progress] Calling /api/generate-preview...');
        const genRes = await fetch('/api/generate-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId,
            quotes: book.quotes,
            customGreeting: book.custom_greeting || null,
          }),
        });
        console.log('[Progress] generate-preview response status:', genRes.status);
      } catch (err) {
        console.error('[Progress] Failed to trigger generation:', err);
      }
    };

    triggerGeneration();
  }, [bookId]);

  useEffect(() => {
    if (!bookId) {
      console.error('No bookId in params');
      setError('No book ID provided');
      return;
    }

    console.log('Starting polling for bookId:', bookId);

    const pollStatus = async () => {
      try {
        console.log('Fetching book:', bookId);

        const res = await fetch(`/api/book/${bookId}`);

        console.log('Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Fetch failed:', errorText);
          throw new Error(`Failed to fetch book: ${res.status}`);
        }

        const book = await res.json();

        console.log('Book data:', {
          id: book.id,
          status: book.status,
          preview_image_urls: book.preview_image_urls
        });

        setStatus(book.status);

        // Redirect when preview is ready OR when complete (admin mode)
        if (book.status === 'preview_ready' && book.preview_image_urls?.[0]) {
          console.log('Preview ready! Redirecting to flipbook...');
          router.push(`/preview/${bookId}`);
        } else if (book.status === 'complete') {
          console.log('Book complete! Redirecting to flipbook...');
          router.push(`/preview/${bookId}`);
        } else if (book.status === 'failed') {
          setError(book.error_message || 'Generation failed. Please try again.');
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError(err instanceof Error ? err.message : 'Failed to check status');
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => {
      console.log('Stopping polling');
      clearInterval(interval);
    };
  }, [bookId]);

  const handlePayment = async () => {
    if (!bookId) return;

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });

      if (!res.ok) throw new Error('Failed to create checkout');

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to start payment. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-8 max-w-md w-full text-center shadow-[6px_6px_0_#0E0E0E]">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border-[2.5px] border-destructive flex items-center justify-center mx-auto mb-4 text-2xl">
            ✗
          </div>
          <h2 className="font-heading font-black text-2xl mb-2">Something went wrong</h2>
          <p className="text-foreground/60 mb-4 text-sm">{error}</p>
          <p className="text-xs text-foreground/30 mb-6">BookId: {bookId || 'undefined'}</p>
          <Link
            href="/create"
            className="flex items-center justify-center w-full font-heading font-black text-base py-4 rounded-xl border-[2.5px] border-foreground bg-primary shadow-[4px_4px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'preview_ready' && previewUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-8 max-w-2xl w-full shadow-[6px_6px_0_#0E0E0E]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1FAE54]/10 border-[2.5px] border-[#1FAE54] rounded-2xl mb-4">
              <Check className="w-8 h-8 text-[#1FAE54]" />
            </div>
            <h2 className="font-heading font-black text-3xl mb-2 tracking-tight">Preview Ready!</h2>
            <p className="text-foreground/50">Here&apos;s a sneak peek of your roast book</p>
          </div>

          <div className="mb-6 border-[2.5px] border-foreground rounded-2xl overflow-hidden shadow-[4px_4px_0_#0E0E0E]">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full aspect-square object-cover"
            />
          </div>

          <div className="bg-primary/10 border-[2.5px] border-primary rounded-2xl p-6 mb-6 shadow-[4px_4px_0_#FFC700]">
            <h3 className="font-heading font-black text-lg mb-2">🎁 Unlock the Full Book</h3>
            <p className="text-foreground/70 mb-4 text-sm">
              Get 8 hilarious AI-generated images + a custom greeting page for just <strong>$9.99</strong>
            </p>
            <ul className="text-sm text-foreground/60 space-y-1.5 mb-4">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#1FAE54]" /> High-quality custom illustrations</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#1FAE54]" /> Shareable digital flipbook</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#1FAE54]" /> Downloadable images</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            className="w-full flex items-center justify-center font-heading font-black text-lg py-4 rounded-xl border-[2.5px] border-foreground bg-primary shadow-[6px_6px_0_#0E0E0E] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
          >
            Unlock Full Book - $9.99
          </button>

          <p className="text-xs text-foreground/40 text-center mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'analyzing', label: 'Analyzing quotes' },
    { key: 'generating_prompts', label: 'Creating visual prompts' },
    { key: 'preview_ready', label: 'Generating preview image' },
  ];

  const getStepState = (stepKey: string) => {
    const order = ['analyzing', 'generating_prompts', 'preview_ready'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    // If status is 'complete', mark all steps as complete
    if (status === 'complete') return 'complete';

    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border-[2.5px] border-foreground rounded-2xl p-8 max-w-md w-full shadow-[6px_6px_0_#0E0E0E]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary border-[2.5px] border-foreground shadow-[4px_4px_0_#0E0E0E] mb-4">
            <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
          </div>
          <h2 className="font-heading font-black text-2xl mb-2 tracking-tight">
            Creating your roast book...
          </h2>
          <p className="text-foreground/50 text-sm">
            This usually takes 30-60 seconds
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const state = getStepState(step.key);
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl border-[2px] flex items-center justify-center shrink-0 transition-colors ${
                  state === 'complete'
                    ? 'bg-[#1FAE54]/10 border-[#1FAE54]'
                    : state === 'active'
                    ? 'bg-primary border-foreground'
                    : 'bg-foreground/5 border-foreground/20'
                }`}>
                  {state === 'complete' && <Check className="w-4 h-4 text-[#1FAE54]" />}
                  {state === 'active' && <Loader2 className="w-4 h-4 text-foreground animate-spin" />}
                </div>
                <span className={`font-medium text-sm ${
                  state === 'complete' ? 'text-foreground/40 line-through' :
                  state === 'active' ? 'text-foreground font-bold' :
                  'text-foreground/30'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
