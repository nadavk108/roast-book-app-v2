const steps = [
  {
    number: '1',
    title: 'Describe their personality',
    description: 'Enter their name and describe their quirks, obsessions, and inside jokes. The more specific, the funnier.',
    duration: '60 sec',
    bg: '#FFC700',
  },
  {
    number: '2',
    title: 'Pick your favorite roasts',
    description: 'AI writes 8 personalized "Things [Name] Would Never Say" quotes. Edit or regenerate any you want.',
    duration: '30 sec',
    bg: '#FBF6E6',
  },
  {
    number: '3',
    title: 'Upload their photo',
    description: 'One clear photo is all we need. AI places them in hilarious illustrated scenes matching each quote.',
    duration: '30 sec',
    bg: '#FFC700',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-24 bg-background" aria-labelledby="how-it-works-heading">
      <div className="container max-w-[1200px] mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block bg-primary border-[2.5px] border-foreground rounded-full px-4 py-1 shadow-[3px_3px_0_#0E0E0E] mb-4">
            <span className="font-heading font-black text-xs uppercase tracking-widest text-foreground">Under 2 minutes</span>
          </div>
          <h2 id="how-it-works-heading" className="font-heading font-black text-3xl md:text-4xl tracking-tight leading-[1.02] text-foreground">
            From &ldquo;I have an idea&rdquo; to them crying laughing
          </h2>
        </div>

        <ol className="grid md:grid-cols-3 gap-6 list-none">
          {steps.map((step, i) => (
            <li key={step.number}>
              <article
                className="bg-card border-[2.5px] border-foreground rounded-2xl p-6 h-full shadow-[6px_6px_0_#0E0E0E] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_#0E0E0E]"
              >
                <div
                  className="w-12 h-12 rounded-xl border-[2.5px] border-foreground flex items-center justify-center font-heading font-black text-xl mb-5 shadow-[3px_3px_0_#0E0E0E]"
                  style={{ backgroundColor: step.bg }}
                  aria-hidden="true"
                >
                  {step.number}
                </div>
                <h3 className="font-heading font-black text-lg mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-foreground/60 text-sm leading-relaxed mb-4">
                  {step.description}
                </p>
                <span className="inline-block font-heading font-black text-xs bg-primary border-[2px] border-foreground rounded-full px-3 py-1">
                  {step.duration}
                </span>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
