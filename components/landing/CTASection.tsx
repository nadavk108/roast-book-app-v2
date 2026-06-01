'use client';

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { captureEvent, Events } from "@/lib/posthog";

const benefits = [
  { icon: '🎁', text: "Perfect for any occasion" },
  { icon: '⚡', text: "Ready in under 2 minutes" },
  { icon: '💳', text: "One-time payment, no subscription" },
  { icon: '✨', text: "8 AI-generated illustrated pages" },
];

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-foreground" aria-labelledby="cta-heading">
      <div className="container max-w-[800px] mx-auto px-4 text-center">
        <h2 id="cta-heading" className="font-heading font-black text-3xl md:text-5xl tracking-[-1px] leading-[1.02] text-background mb-4">
          Their roast book is one photo away.
        </h2>
        <p className="text-background/60 text-base md:text-lg mb-10 max-w-lg mx-auto">
          Instant digital delivery - ready in under 2 minutes.
          Start free, pay only when you love it.
        </p>

        {/* Feature grid */}
        <ul className="grid grid-cols-2 gap-3 mb-10 list-none max-w-lg mx-auto">
          {benefits.map((b) => (
            <li
              key={b.text}
              className="flex items-center gap-2.5 bg-background/5 border border-background/10 rounded-xl p-3 text-left"
            >
              <span className="text-xl shrink-0" aria-hidden="true">{b.icon}</span>
              <span className="text-background/80 text-sm font-medium">{b.text}</span>
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="font-heading font-black text-4xl text-primary">$9.99</span>
          <span className="text-background/40 line-through text-xl" aria-label="Original price $29">$29</span>
          <span className="bg-accent text-background font-heading font-black text-xs px-3 py-1.5 rounded-full border-[2px] border-background/20">
            Save 66%
          </span>
        </div>

        {/* CTA */}
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-primary text-foreground font-heading font-black text-xl px-10 py-5 rounded-xl border-[2.5px] border-background shadow-[6px_6px_0_#F5B400] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#F5B400] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
          onClick={() => {
            try { captureEvent(Events.START_ROASTING_CLICKED, { button_location: 'cta_section' }); } catch {}
          }}
        >
          Start Roasting Free
          <ArrowRight className="h-6 w-6" aria-hidden="true" />
        </Link>

        <p className="mt-4 text-background/40 text-sm">
          Not funny enough? Regenerate the roasts free.
        </p>
      </div>
    </section>
  );
}
