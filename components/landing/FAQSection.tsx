const faqs = [
  {
    question: 'What is The Roast Book?',
    answer:
      'The Roast Book is an AI-powered personalized gift. You upload a photo of your friend, describe their personality traits and quirks, and AI generates a custom illustrated flipbook called "Things [Name] Would Never Say" - featuring funny quotes paired with illustrated images of your friend in hilarious scenarios. It costs $9.99 and is ready in under 2 minutes.',
  },
  {
    question: 'How does The Roast Book work?',
    answer:
      'It takes 3 simple steps: (1) Upload a photo of your friend and enter their name, (2) Describe their personality traits - AI generates personalized roast quotes and you pick your favorites, (3) Preview 3 free illustrated pages, then pay $9.99 to unlock the full 8-page flipbook. The entire process takes under 2 minutes.',
  },
  {
    question: 'What occasions is The Roast Book good for?',
    answer:
      'The Roast Book is perfect for birthdays, weddings, farewell parties, bachelor and bachelorette parties, graduations, holidays, retirement celebrations, or any time you want to make a friend laugh. It is especially popular as a funny birthday gift and a personalized farewell gift for coworkers.',
  },
  {
    question: 'How much does The Roast Book cost?',
    answer:
      'You can preview 3 illustrated pages for free. The full 8-page personalized roast book costs $9.99 - a one-time payment with no subscription or hidden fees.',
  },
  {
    question: 'Is The Roast Book mean or offensive?',
    answer:
      'Not at all. The humor is based on "comedy through contradiction" - imagining things your friend would never say based on their actual personality. It is affectionate and playful, not cruel. Think of it as an inside joke turned into a beautifully illustrated gift book.',
  },
  {
    question: 'How do I share The Roast Book with my friend?',
    answer:
      'After your roast book is generated, you get a unique shareable link. Send it via WhatsApp, text message, email, or any messaging app. Your friend opens the link and flips through their personalized illustrated roast book on any device - no app download needed.',
  },
];

export function FAQSection() {
  return (
    <section className="py-20 md:py-28 bg-background" aria-labelledby="faq-heading">
      <div className="container max-w-[800px] mx-auto px-4">
        <h2
          id="faq-heading"
          className="text-3xl md:text-4xl font-heading font-black text-center mb-12"
        >
          Frequently Asked Questions About The Roast Book
        </h2>

        <dl className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border-3 border-foreground bg-background overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none font-heading font-bold text-foreground text-base md:text-lg hover:bg-muted/30 transition-colors [&::-webkit-details-marker]:hidden">
                <dt>{faq.question}</dt>
                <span
                  className="shrink-0 text-foreground transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                  style={{ display: 'inline-block' }}
                >
                  ▾
                </span>
              </summary>
              <dd className="px-6 pb-6 text-muted-foreground text-sm md:text-base leading-relaxed border-t border-border pt-4">
                {faq.answer}
              </dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
