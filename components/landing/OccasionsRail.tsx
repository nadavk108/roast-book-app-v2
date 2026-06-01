const OCCASIONS = [
  { label: 'Birthdays', emoji: '🎂' },
  { label: 'Farewells', emoji: '👋' },
  { label: 'Weddings', emoji: '💍' },
  { label: 'Graduations', emoji: '🎓' },
  { label: 'Bachelor(ette)', emoji: '🎉' },
  { label: 'Retirements', emoji: '🏖️' },
  { label: 'Father\'s Day', emoji: '👨' },
  { label: 'Just because', emoji: '😂' },
];

export function OccasionsRail() {
  return (
    <section className="py-10 bg-background overflow-hidden" aria-label="Occasions">
      <div className="container max-w-[1200px] mx-auto px-4">
        <p className="text-center text-xs font-heading font-black uppercase tracking-widest text-foreground/40 mb-5">
          Perfect for every occasion
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {OCCASIONS.map((occ) => (
            <span
              key={occ.label}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border-[2.5px] border-foreground shadow-[3px_3px_0_#0E0E0E] font-body font-semibold text-sm text-foreground"
            >
              <span aria-hidden="true">{occ.emoji}</span>
              {occ.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
