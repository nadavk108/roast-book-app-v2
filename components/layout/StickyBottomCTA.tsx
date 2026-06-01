'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function StickyBottomCTA({ watchId }: { watchId: string }) {
  const [visible, setVisible] = useState(false);
  const hasShown = useRef(false);

  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          hasShown.current = true;
        }
        setVisible(hasShown.current && !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="bg-foreground border-t-[2.5px] border-[#FFC700] px-4 py-3 flex items-center justify-between gap-4 max-w-lg mx-auto md:max-w-none md:rounded-none">
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-black text-[#FFC700] text-lg">$9.99</span>
          <span className="text-background/50 line-through text-sm">$29</span>
          <span className="text-[#FF2E88] text-xs font-bold">Save 66%</span>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-1.5 bg-[#FFC700] text-foreground font-heading font-black px-5 py-2.5 rounded-xl border-[2.5px] border-foreground shadow-[3px_3px_0_#0E0E0E] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all text-sm"
        >
          Start Roasting Free
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
