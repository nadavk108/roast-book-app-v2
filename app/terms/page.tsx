'use client';

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-12 max-w-4xl">
        <h1 className="font-heading text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using The Roast Book ("Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">2. Description of Service</h2>
            <p>
              The Roast Book is a platform that allows users to create personalized, humorous
              gift books featuring AI-generated images based on uploaded photos and user-submitted
              quotes. The Service is intended for entertainment purposes only.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <p className="mb-4">By using our Service, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only upload photos of individuals who have given their consent</li>
              <li>Not upload content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
              <li>Not use the Service to harass, bully, or harm any individual</li>
              <li>Not upload content that infringes on intellectual property rights</li>
              <li>Be responsible for all content you submit to the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">4. Content Guidelines</h2>
            <p className="mb-4">
              The Roast Book is designed for lighthearted, friendly roasting among friends and family.
              Content that violates our guidelines may be removed without notice. Prohibited content includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Hateful, discriminatory, or offensive material</li>
              <li>Sexually explicit content</li>
              <li>Content promoting violence or illegal activities</li>
              <li>Photos of minors without parental consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">5. Intellectual Property</h2>
            <p>
              You retain ownership of the photos and quotes you upload. By using our Service, you
              grant The Roast Book a limited license to use, process, and store your content solely
              for the purpose of creating and delivering your roast book. AI-generated images created
              through our Service are licensed to you for personal, non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">6. Payments & Refunds</h2>
            <p className="mb-4">
              All payments are processed securely through Stripe. Prices are displayed in USD unless
              otherwise specified. Due to the personalized nature of our products:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All sales are final once your book has been generated</li>
              <li>Refunds may be considered on a case-by-case basis for technical issues</li>
              <li>Contact our support team within 7 days of purchase for refund requests</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee
              that the AI-generated content will meet your expectations. Results may vary based on
              the quality of uploaded photos and the nature of submitted quotes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p>
              The Roast Book shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of the Service. Our total liability
              shall not exceed the amount you paid for the Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Service
              after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">10. Contact</h2>
            <p>
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:hello@theroastbook.com" className="text-primary hover:underline">
                hello@theroastbook.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
