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
      <div className="bg-[#0E0E0E] border-t-[2px] border-[#FFC700] px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-heading font-black text-[#FFC700] text-base leading-none">$9.99</span>
          <span className="text-white/40 line-through text-xs leading-none">$29</span>
          <span className="text-[#FF2E88] text-xs font-bold leading-none">Save 66%</span>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-1 bg-[#FFC700] text-[#0E0E0E] font-heading font-black text-xs px-3 py-2 rounded-lg border-[2px] border-[#0E0E0E] shadow-[2px_2px_0_#0E0E0E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all whitespace-nowrap shrink-0"
        >
          Start Roasting Free
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
