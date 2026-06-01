export function SocialProofBand() {
  return (
    <section className="bg-foreground py-12 px-4" aria-label="Social proof">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Rating */}
          <div className="text-center shrink-0">
            <div className="font-heading font-black text-5xl text-primary leading-none">4.9</div>
            <div className="text-[#FFC700] text-xl mt-1">★★★★★</div>
            <div className="text-background/50 text-xs mt-1 font-medium">out of 5</div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-24 bg-background/10" aria-hidden="true" />

          {/* Testimonials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {[
              {
                text: "My dad literally cried laughing. Best birthday gift I've ever given him!",
                name: 'Sarah M.',
                occasion: 'Birthday',
              },
              {
                text: "The AI images are insanely good. My friends couldn't believe it wasn't real.",
                name: 'Mike T.',
                occasion: 'Farewell',
              },
              {
                text: "Took me 2 minutes to make. My coworker's farewell party was unforgettable!",
                name: 'Rachel K.',
                occasion: 'Work',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-background/5 border-[2px] border-background/10 rounded-2xl p-4"
              >
                <div className="text-[#FFC700] text-sm mb-2">★★★★★</div>
                <p className="text-background/80 text-sm leading-relaxed mb-3">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary border-[2px] border-background/20 flex items-center justify-center font-heading font-black text-xs text-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <span className="text-background/70 text-xs font-bold">{t.name}</span>
                    <span className="mx-1.5 text-background/30 text-xs">·</span>
                    <span className="text-background/40 text-xs">{t.occasion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
