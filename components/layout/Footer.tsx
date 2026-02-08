import Link from "next/link";
import { Flame, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-3 border-foreground bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-3 border-secondary-foreground bg-primary text-primary-foreground">
                <Flame className="h-6 w-6" />
              </div>
              <span className="font-heading text-xl font-bold">The Roast Book</span>
            </Link>
            <p className="text-secondary-foreground/80 max-w-md">
              Create hilarious, personalized gift books for your friends. Upload photos, submit ironic quotes, and let AI bring the roast to life!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Examples
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-secondary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/60">
            © 2026 The Roast Book. All rights reserved.
          </p>
          <p className="text-sm text-secondary-foreground/60 flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-accent fill-accent" /> for your best frenemies
          </p>
        </div>
      </div>
    </footer>
  );
}
