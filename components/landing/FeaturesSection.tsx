'use client';

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "My dad literally cried laughing. Best birthday gift I've ever given him!",
    author: "Sarah M.",
    role: "Gifted to Dad",
    rating: 5,
    avatar: "👩",
  },
  {
    quote: "The AI images are insanely good. My friends couldn't believe it wasn't real.",
    author: "Mike T.",
    role: "Bachelor Party",
    rating: 5,
    avatar: "👨",
  },
  {
    quote: "Took me 2 minutes to make. My coworker's farewell party was unforgettable!",
    author: "Rachel K.",
    role: "Office Farewell",
    rating: 5,
    avatar: "👩‍💼",
  },
];

const SHOWCASE_IMAGES = [
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_0.jpg",
    quote: "Protests? What good do they do?!",
    alt: "AI-generated image of Dad dismissing protests - a humorous roast scenario",
  },
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/56f74711-2bd0-4a58-be17-7a95ba532b8f/image_1.jpg",
    quote: "Trading in MacBook for a Dell",
    alt: "AI-generated image of tech enthusiast considering switching from Mac to Dell",
  },
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/605f704c-45a8-4a82-ad2f-6e5571c847a5/image_2.jpg",
    quote: "I'll buy clothes at a regular store",
    alt: "AI-generated image of fashion-conscious person shopping at a regular store",
  },
  {
    image: "https://ynptkppxwsnocvqjqisz.supabase.co/storage/v1/object/public/roast-book-images/2ec7af3a-411d-4f4d-a9ff-407918c022ed/image_4.jpg",
    quote: "I booked us a beach vacation",
    alt: "AI-generated image of Dad booking an unexpected beach vacation",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 overflow-hidden" aria-labelledby="features-heading">
      <div className="container max-w-[1200px] mx-auto">
        {/* Showcase Grid */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-primary font-bold text-sm uppercase tracking-wider">
            AI-Powered Magic
          </span>
          <h2 id="features-heading" className="text-3xl md:text-5xl font-heading font-black mt-2 mb-4">
            Real Results, Real Laughs
          </h2>
          <p className="text-lg text-muted-foreground">
            See actual AI-generated images from real roast books
          </p>
        </motion.header>

        {/* Image showcase grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-20 md:mb-28">
          {SHOWCASE_IMAGES.map((item, index) => (
            <motion.figure
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-border shadow-brutal-sm hover:shadow-brutal transition-all hover:-translate-y-1"
            >
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                width={300}
                height={400}
              />
              <figcaption className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium text-center">
                    "{item.quote}"
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        {/* Testimonials */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-accent font-bold text-sm uppercase tracking-wider">
            Loved By Thousands
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-black mt-2 mb-4">
            What People Are Saying
          </h2>
        </motion.header>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border-2 border-border rounded-2xl p-6 relative"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 h-8 w-8 text-muted-foreground/20" aria-hidden="true" />
              
              {/* Rating */}
              <div className="flex gap-0.5 mb-4" aria-label={`${testimonial.rating} out of 5 stars`}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground font-medium mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <footer className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl" aria-hidden="true">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm">{testimonial.author}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                </div>
              </footer>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
