'use client';

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrutalButton } from "@/components/ui/brutal-button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Flame,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Heart,
  Users,
  Gift,
  Star
} from "lucide-react";

// Featured examples with REAL AI-generated output images from different projects
const FEATURED_EXAMPLES = [
  {
    id: "dad-2ec7af3a",
    slug: "things-dad-never-says",
    bookTitle: "Things Dad Would Never Say",
    category: "Family",
    categoryColor: "from-rose-500 to-orange-500",
    slides: [
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_0.jpg",
        quote: "Protests? What good do they do?!",
        alt: "AI-generated image of Dad dismissing protests humorously",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_1.jpg",
        quote: "I made an amazing omelette today!",
        alt: "AI-generated image of Dad proudly cooking an omelette",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_2.jpg",
        quote: "I absolutely love the smell of popcorn",
        alt: "AI-generated image of Dad enjoying popcorn aroma",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_3.jpg",
        quote: "Leave the laundry, I'll fold it",
        alt: "AI-generated image of Dad volunteering for laundry",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_4.jpg",
        quote: "I booked us a relaxing beach vacation",
        alt: "AI-generated image of Dad planning a spontaneous vacation",
      },
    ],
    highlight: "Perfect for Father's Day!",
    rating: 5,
  },
  {
    id: "josh-56f74711",
    slug: "things-josh-never-says",
    bookTitle: "Things Josh Would Never Say",
    category: "Friends",
    categoryColor: "from-blue-500 to-cyan-500",
    slides: [
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/56f74711-2bd0-4a58-be17-7a95ba532b8f/image_0.jpg",
        quote: "Let's skip the cold brew and get some warm herbal tea",
        alt: "AI-generated image of Josh choosing herbal tea over coffee",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/56f74711-2bd0-4a58-be17-7a95ba532b8f/image_1.jpg",
        quote: "I'm thinking of trading in the MacBook for a Dell",
        alt: "AI-generated image of Josh considering Dell over Apple",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/56f74711-2bd0-4a58-be17-7a95ba532b8f/image_2.jpg",
        quote: "Driving to the gym in silence instead of a passive income podcast",
        alt: "AI-generated image of Josh driving without podcasts",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/56f74711-2bd0-4a58-be17-7a95ba532b8f/image_3.jpg",
        quote: "Green text bubbles? Totally fine. I actually prefer Android.",
        alt: "AI-generated image of Josh preferring Android phones",
      },
    ],
    highlight: "The ultimate tech bro roast!",
    rating: 5,
  },
  {
    id: "tal-605f704c",
    slug: "things-tal-never-says",
    bookTitle: "Things Tal Would Never Say",
    category: "Partners",
    categoryColor: "from-purple-500 to-pink-500",
    slides: [
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/605f704c-45a8-4a82-ad2f-6e5571c847a5/image_0.jpg",
        quote: "After the baby, let's move to a quiet village up north",
        alt: "AI-generated image of Tal suggesting country life",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/605f704c-45a8-4a82-ad2f-6e5571c847a5/image_1.jpg",
        quote: "Wow, I don't know anyone here!",
        alt: "AI-generated image of social Tal not knowing anyone",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/605f704c-45a8-4a82-ad2f-6e5571c847a5/image_2.jpg",
        quote: "I need new workout clothes. I'll just buy them at Hoodies",
        alt: "AI-generated image of Tal shopping at a regular store",
      },
      {
        image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/605f704c-45a8-4a82-ad2f-6e5571c847a5/image_3.jpg",
        quote: "What restaurant? Never heard of it",
        alt: "AI-generated image of foodie Tal being unfamiliar with a restaurant",
      },
    ],
    highlight: "Perfect for baby showers!",
    rating: 5,
  },
];

function ExampleCard({ example, index }: { example: typeof FEATURED_EXAMPLES[0]; index: number }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % example.slides.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + example.slides.length) % example.slides.length);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      viewport={{ once: true, margin: "-50px" }}
      className="group"
    >
      <div className="relative bg-card rounded-2xl overflow-hidden border-2 border-border shadow-brutal-sm hover:shadow-brutal transition-all duration-300 hover:-translate-y-1">
        {/* Image Container - Fixed aspect ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <img
                src={example.slides[currentSlide].image}
                alt={example.slides[currentSlide].alt}
                className="w-full h-full object-contain bg-black"
                loading="lazy"
                width={400}
                height={533}
              />

              {/* Quote Overlay at Bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20 pb-6 px-4">
                <motion.p
                  key={`quote-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white text-lg md:text-xl font-medium leading-tight text-center"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                >
                  "{example.slides[currentSlide].quote}"
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Category Badge */}
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${example.categoryColor}`}>
            {example.category}
          </div>

          {/* Navigation Arrows */}
          {example.slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 hover:scale-110"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 hover:scale-110"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </>
          )}

          {/* Slide Indicators */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden="true">
            {example.slides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                className={`h-1 rounded-full transition-all ${
                  idx === currentSlide
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-bold leading-tight">
                {example.bookTitle}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{example.highlight}</p>
            </div>
            <div className="flex items-center gap-0.5" aria-label={`${example.rating} out of 5 stars`}>
              {Array.from({ length: example.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
              ))}
            </div>
          </div>

          <BrutalButton
            variant="outline"
            className="w-full group/btn"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" aria-hidden="true" />
          </BrutalButton>
        </div>
      </div>
    </motion.article>
  );
}

const USE_CASES = [
  {
    icon: Gift,
    title: "Birthdays",
    description: "The gift that makes them laugh-cry",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Weddings",
    description: "Roast the bride or groom in style",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "Retirements",
    description: "Send them off with a bang",
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function Examples() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden" aria-labelledby="examples-heading">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" aria-hidden="true" />

          <div className="container relative max-w-[1200px] mx-auto">
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Real AI-Generated Examples
              </Badge>
              <h1 id="examples-heading" className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 tracking-tight">
                See The{" "}
                <span className="text-primary relative">
                  Magic
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden="true">
                    <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                {" "}In Action
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Describe your friend. AI writes the roasts and creates hilarious illustrations.
                Swipe through real examples to see what's possible.
              </p>
            </motion.header>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-8 md:py-16" aria-labelledby="gallery-heading">
          <h2 id="gallery-heading" className="sr-only">Featured Roast Book Examples</h2>
          <div className="container max-w-[1200px] mx-auto">
            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {FEATURED_EXAMPLES.map((example, index) => (
                <ExampleCard key={example.id} example={example} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-24" aria-labelledby="use-cases-heading">
          <div className="container max-w-[1200px] mx-auto">
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 id="use-cases-heading" className="text-3xl md:text-4xl font-heading font-bold mb-3">
                Perfect For Any Occasion
              </h2>
              <p className="text-muted-foreground">
                The gift that steals the show
              </p>
            </motion.header>

            <ul className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto list-none">
              {USE_CASES.map((useCase, index) => (
                <motion.li
                  key={useCase.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <article className="relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-300 text-center">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${useCase.gradient} text-white mb-4 group-hover:scale-110 transition-transform`} aria-hidden="true">
                      <useCase.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-1">{useCase.title}</h3>
                    <p className="text-muted-foreground text-sm">{useCase.description}</p>
                  </article>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* Big CTA */}
        <section className="py-16 md:py-24 bg-primary/5 border-y-2 border-border" aria-labelledby="cta-heading">
          <div className="container max-w-[1200px] mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6" aria-hidden="true">
                <Flame className="h-10 w-10 text-primary" />
              </div>
              <h2 id="cta-heading" className="text-3xl md:text-5xl font-heading font-black mb-4">
                Ready to Roast?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Create a one-of-a-kind gift in under 5 minutes.
                Upload a photo, describe their quirks, and watch the magic happen.
              </p>
              <Link href="/dashboard">
                <BrutalButton size="lg">
                  Start Your Book Now
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </BrutalButton>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
