'use client';

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-12 max-w-4xl">
        <h1 className="font-heading text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              When you use The Roast Book, we collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email address)</li>
              <li>Photos and images you upload for your roast books</li>
              <li>Quotes and text content you submit</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and deliver your personalized roast books</li>
              <li>Process payments and send transaction confirmations</li>
              <li>Communicate with you about your orders and account</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">3. AI-Generated Content</h2>
            <p>
              The Roast Book uses artificial intelligence to generate humorous images based on your
              uploaded photos and quotes. These AI-generated images are created solely for your
              personal use and entertainment. We do not use your uploaded content to train our AI models.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. Photos and generated
              content are stored temporarily for book creation and delivery. We implement appropriate
              technical and organizational measures to protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">5. Sharing Your Information</h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your information only in the
              following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With service providers who assist in operating our platform (e.g., payment processing)</li>
              <li>When required by law or to protect our rights</li>
              <li>With your consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
