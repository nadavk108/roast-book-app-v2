'use client';

import { motion } from "framer-motion";
import { Upload, Users, Vote, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "1",
    title: "Upload Photos",
    description: "Add 3-5 photos of your 'victim' - the AI needs to learn their face.",
    duration: "30 sec",
    color: "from-primary to-yellow-400",
  },
  {
    icon: Users,
    number: "2",
    title: "Share The Link",
    description: "Friends submit ironic quotes they'd never actually say.",
    duration: "Send once",
    color: "from-accent to-pink-400",
  },
  {
    icon: Vote,
    number: "3",
    title: "Vote on Best",
    description: "Everyone votes. The funniest quotes rise to the top.",
    duration: "Have fun",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Sparkles,
    number: "4",
    title: "AI Does Magic",
    description: "AI generates hilarious images of them 'saying' each quote.",
    duration: "24 hours",
    color: "from-purple-500 to-pink-500",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/50 relative overflow-hidden" aria-labelledby="how-it-works-heading">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />

      <div className="container relative max-w-[1200px] mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-bold text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 id="how-it-works-heading" className="text-3xl md:text-5xl font-heading font-black mt-2 mb-4">
            Ready in 4 Easy Steps
          </h2>
          <p className="text-lg text-muted-foreground">
            From idea to personalized gift in under 5 minutes of your time
          </p>
        </motion.header>

        <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 list-none mx-auto">
          {steps.map((step, index) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent z-0" aria-hidden="true">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                </div>
              )}

              <article className="relative z-10 bg-card border-2 border-border rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:shadow-brutal-sm">
                {/* Step number with gradient */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white font-black text-xl mb-4 shadow-lg`} aria-hidden="true">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="mb-4" aria-hidden="true">
                  <step.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Content */}
                <h3 className="font-heading text-lg font-bold mb-2">
                  Step {step.number}: {step.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {step.description}
                </p>

                {/* Duration badge */}
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {step.duration}
                </span>
              </article>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
