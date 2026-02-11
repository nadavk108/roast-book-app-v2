'use client';

import { BrutalButton } from "@/components/ui/brutal-button";
import { ArrowRight, Flame, Gift, Clock, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const benefits = [
  { icon: Gift, text: "Perfect for any occasion" },
  { icon: Clock, text: "Ready in 24 hours" },
  { icon: CreditCard, text: "One-time payment, no subscription" },
  { icon: Sparkles, text: "8 AI-generated illustrations" },
];

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden" aria-labelledby="cta-heading">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 max-w-[1200px] mx-auto">
        <div className="max-w-4xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6"
              aria-hidden="true"
            >
              <Flame className="h-10 w-10 text-primary-foreground" />
            </motion.div>

            <h2 id="cta-heading" className="text-3xl md:text-5xl lg:text-6xl font-heading font-black mb-4">
              Ready to Create Something{" "}
              <span className="text-primary">Unforgettable</span>?
            </h2>

            <p className="text-lg md:text-xl text-background/70 max-w-2xl mx-auto mb-8">
              Join 500+ people who've given the most memorable, laugh-out-loud gift ever.
              Start free, pay only when you're ready.
            </p>

            {/* Price reminder */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-primary">$9.99</span>
                <span className="text-background/50 line-through text-xl" aria-label="Original price $29">$29</span>
              </div>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
                Save 66%
              </span>
            </div>
          </motion.header>

          {/* Benefits grid */}
          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 list-none"
          >
            {benefits.map((benefit) => (
              <li
                key={benefit.text}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-background/5 border border-background/10"
              >
                <benefit.icon className="h-6 w-6 text-primary mb-2" aria-hidden="true" />
                <span className="text-sm text-background/80">{benefit.text}</span>
              </li>
            ))}
          </motion.ul>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Link href="/dashboard">
              <BrutalButton
                size="xl"
                className="bg-primary text-primary-foreground border-background hover:bg-accent text-lg px-10"
              >
                Start Your Roast Book Free
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </BrutalButton>
            </Link>

            <p className="mt-6 text-background/50 text-sm">
              ✓ No credit card required &nbsp;•&nbsp; ✓ Free to create &nbsp;•&nbsp; ✓ Pay only for the final book
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
