'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-xl p-8 max-w-md text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <h2 className="text-2xl font-heading font-black mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-xs text-gray-400 mb-6">BookId: {bookId || 'undefined'}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'preview_ready' && previewUrl) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-xl p-8 max-w-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 border-2 border-black rounded-full mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-heading font-black mb-2">Preview Ready!</h2>
            <p className="text-gray-600">Here's a sneak peek of your roast book</p>
          </div>

          <div className="mb-6 border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full aspect-square object-cover"
            />
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg mb-2">🎁 Unlock the Full Book</h3>
            <p className="text-gray-700 mb-4">
              Get 8 hilarious AI-generated images + a custom greeting page for just <strong>$9.99</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>✓ High-quality custom illustrations</li>
              <li>✓ Shareable digital flipbook</li>
              <li>✓ Downloadable images</li>
            </ul>
          </div>

          <Button 
            onClick={handlePayment}
            className="w-full text-lg py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            size="lg"
          >
            Unlock Full Book - $9.99
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
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
    <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black rounded-xl p-8 max-w-md w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4" />
          <h2 className="text-2xl font-heading font-black mb-2">
            Creating your roast book...
          </h2>
          <p className="text-gray-600">
            This usually takes 30-60 seconds
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const state = getStepState(step.key);
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${state === 'complete' ? 'bg-green-100 border-green-500' : 
                    state === 'active' ? 'bg-yellow-100 border-yellow-500' : 
                    'bg-gray-100 border-gray-300'}
                `}>
                  {state === 'complete' && <Check className="w-4 h-4 text-green-600" />}
                  {state === 'active' && <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />}
                </div>
                <span className={`font-medium ${
                  state === 'complete' ? 'text-gray-400' :
                  state === 'active' ? 'text-black' :
                  'text-gray-300'
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