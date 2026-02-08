'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type TheEndPageProps = {
  victimName: string;
  bookUrl: string;
};

export function TheEndPage({ victimName, bookUrl }: TheEndPageProps) {
  const [copied, setCopied] = useState(false);

  const shareTitle = `Check out 'Things ${victimName} Would Never Say'! 🔥📚`;
  const shareText = `Check out this hilarious roast book about ${victimName}!`;

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText}\n\n${bookUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSMSShare = () => {
    const text = encodeURIComponent(`${shareText} ${bookUrl}`);
    window.open(`sms:?body=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\nView it here: ${bookUrl}\n\nMade with RoastBook.app 🔥`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  const handleMainShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: bookUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-6 md:p-8 text-center relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* The End Title */}
        <div className="mb-8">
          <h2 className="text-6xl md:text-7xl font-heading font-black text-white mb-2 drop-shadow-lg">
            The End
          </h2>
          <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full"></div>
        </div>

        {/* Share Message */}
        <div className="mb-6">
          <p className="text-xl md:text-2xl font-heading font-bold text-white mb-2">
            Share the Roast! 🔥
          </p>
          <p className="text-sm text-gray-300">
            Let others enjoy this masterpiece
          </p>
        </div>

        {/* Sharing Icons Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center justify-center p-4 bg-[#25D366] hover:bg-[#20BA5A] border-2 border-white/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Share on WhatsApp"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>

          {/* SMS */}
          <button
            onClick={handleSMSShare}
            className="flex flex-col items-center justify-center p-4 bg-[#0084FF] hover:bg-[#006FDB] border-2 border-white/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Share via SMS"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Email */}
          <button
            onClick={handleEmailShare}
            className="flex flex-col items-center justify-center p-4 bg-gray-700 hover:bg-gray-600 border-2 border-white/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Share via Email"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-gray-100 border-2 border-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Copy Link"
          >
            {copied ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <Copy className="w-8 h-8 text-black" />
            )}
          </button>
        </div>

        {/* Main Share Button */}
        <Button
          onClick={handleMainShare}
          size="lg"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-heading font-black text-lg py-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share This Roast
        </Button>

        {/* Attribution */}
        <div className="mt-8 space-y-1">
          <p className="text-sm text-gray-400">
            Made with 🔥 for <span className="text-white font-bold">{victimName}</span>
          </p>
          <p className="text-xs text-gray-500">
            <a
              href="https://theroastbook.com"
              className="hover:text-yellow-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              RoastBook.app
            </a>
          </p>
        </div>

        {/* Create Your Own CTA */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full border-2 border-white text-white hover:bg-white hover:text-black font-bold transition-all"
          >
            Create Your Own Roast Book
          </Button>
        </div>
      </div>
    </div>
  );
}
