'use client';

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="py-12 bg-background">
          <div className="container text-center max-w-[1200px] mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              How The Roast Book Works
            </h1>
            <p className="text-xl text-muted-foreground">
              Create the ultimate personalized gag gift in just a few simple steps
            </p>
          </div>
        </div>
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
