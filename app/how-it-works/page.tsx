import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How The Roast Book Works - Create a Personalized Roast Gift in 3 Steps",
  description:
    "Learn how to create a personalized AI roast book in under 2 minutes. Upload a photo, describe your friend's traits, and get a hilarious illustrated flipbook for $9.99.",
  alternates: {
    canonical: "https://theroastbook.com/how-it-works",
  },
};

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

        {/* GEO content: standalone explanatory sections */}
        <div className="bg-background py-16 md:py-20">
          <div className="container max-w-[800px] mx-auto px-4 space-y-16">

            <section aria-labelledby="different-heading">
              <h2 id="different-heading" className="text-2xl md:text-3xl font-heading font-black mb-6">
                What Makes The Roast Book Different From a Regular Gift?
              </h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  The Roast Book is a $9.99 AI-powered personalized gift that creates an illustrated
                  flipbook of funny quotes your friend would never say. Unlike generic greeting cards
                  or gift cards, each roast book is unique - generated from the specific personality
                  traits and quirks you describe about your friend. The AI reads those traits,
                  inverts them into comedy gold, and pairs each quote with a custom illustration of
                  your friend in an absurd scene that makes the joke land visually.
                </p>
                <p>
                  The whole thing takes under 2 minutes to create and is ready to share instantly via
                  a link - no printing, no shipping, no waiting. It works for birthdays, weddings,
                  bachelor and bachelorette parties, farewells, graduations, and retirement parties.
                  Any occasion where you want to make someone laugh harder than they ever have at a
                  gift.
                </p>
                <p>
                  The humor approach is what sets it apart: we call it "comedy through contradiction."
                  If your friend is obsessed with the gym, we imagine them passionately defending
                  skipping leg day forever. If they live for coffee, we picture them declaring tea
                  superior. The quotes only work because they are the exact opposite of who that
                  person actually is - and the AI illustrations show them sincerely trying to live
                  those contradictions. That combination of a personalized quote and a matching image
                  is what makes people cry laughing every time.
                </p>
              </div>
            </section>

            <section aria-labelledby="who-heading">
              <h2 id="who-heading" className="text-2xl md:text-3xl font-heading font-black mb-6">
                Who Is The Roast Book For?
              </h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  Anyone with a best friend, sibling, partner, coworker, or parent who has a sense
                  of humor. You do not need design skills, writing skills, or any technical ability -
                  just a photo and a few sentences describing the person. One person creates the
                  entire book start to finish, with no coordination needed with other people.
                </p>
                <p>
                  It is especially popular for people who are impossible to buy for - the friend who
                  has everything, the coworker who does not want another candle, the dad who only
                  wants practical things. A personalized roast book is funny, memorable, and
                  impossible to regift. It works just as well on mobile as on desktop, and the
                  recipient does not need to download any app to view it.
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
