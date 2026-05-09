'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { isPredominantlyHebrew } from '@/lib/hebrew-utils';
import { captureEvent, Events } from '@/lib/posthog';

type TheEndPageProps = {
  victimName: string;
  bookUrl: string;
  bookId: string;
};

export function TheEndPage({ victimName, bookUrl, bookId }: TheEndPageProps) {
  const [copied, setCopied] = useState(false);

  const shareTitle = `Check out 'Things ${victimName} Would Never Say'! 🔥📚`;
  const shareText = `Check out this hilarious roast book about ${victimName}!`;

  const handleCopyLink = async () => {
    try { captureEvent(Events.SHARE_BUTTON_CLICKED, { book_id: bookId, share_method: 'copy' }); } catch {}
    try {
      await navigator.clipboard.writeText(bookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy link');
    }
  };

  const handleMainShare = async () => {
    try { captureEvent(Events.SHARE_BUTTON_CLICKED, { book_id: bookId, share_method: 'native' }); } catch {}
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: bookUrl });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCtaClick = () => {
    try { captureEvent(Events.CTA_CLICKED, { book_id: bookId, source: 'end_screen' }); } catch {}
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-6 md:p-8 text-center relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8">
        {/* Title */}
        <div>
          <h2 className="text-6xl md:text-7xl font-heading font-black text-white mb-2 drop-shadow-lg">
            The End
          </h2>
          <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full"></div>
        </div>

        {/* Share section */}
        <div className="flex flex-col gap-3">
          <p className="text-xl md:text-2xl font-heading font-bold text-white">
            Share the Roast! 🔥
          </p>
          <p className="text-sm text-gray-300">
            Let others enjoy this masterpiece
          </p>
          <Button
            onClick={handleMainShare}
            size="lg"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-heading font-black text-lg py-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Share2 className="w-5 h-5 mr-2" />
            {copied ? 'Link Copied!' : 'Share This Roast 🔥'}
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20" />

        {/* Upsell section */}
        <div className="flex flex-col gap-3">
          <p className="text-lg font-heading font-black text-white">
            Loved it? Make one for someone YOU know
          </p>
          <p className="text-sm text-gray-500">
            Give someone the gift of being roasted.
          </p>
          <Link
            href="/create"
            onClick={handleCtaClick}
            className="block text-center w-full py-4 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-heading font-black text-lg rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Create a Roast Book
          </Link>
        </div>

        {/* Attribution */}
        <div className="space-y-1">
          <p className="text-sm text-gray-400">
            Made with 🔥 for{' '}
            <span
              className="text-white font-bold"
              dir={isPredominantlyHebrew(victimName) ? 'rtl' : 'ltr'}
            >
              {victimName}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            <a
              href="https://theroastbook.com"
              className="hover:text-yellow-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              theroastbook.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
