'use client';

import { Home, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type FlipbookHeaderProps = {
  bookTitle: string;
  victimName: string;
  onShare: () => void;
};

export function FlipbookHeader({ bookTitle, victimName, onShare }: FlipbookHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b-2 border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Home Button - Left */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="text-white hover:text-yellow-400 hover:bg-white/10 transition-colors"
        >
          <Home className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Home</span>
        </Button>

        {/* Book Title - Center */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-sm md:text-base font-heading font-bold text-white truncate">
            Things <span className="text-yellow-400">{victimName}</span> Would Never Say
          </h1>
        </div>

        {/* Share Button - Right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="text-white hover:text-yellow-400 hover:bg-white/10 transition-colors"
        >
          <Share2 className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">Share</span>
        </Button>
      </div>
    </header>
  );
}
