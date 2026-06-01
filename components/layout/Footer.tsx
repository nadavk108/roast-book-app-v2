import Link from "next/link";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background border-t-[2.5px] border-foreground">
      <div className="container max-w-[1200px] mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-background bg-primary shadow-[3px_3px_0_#FFC700] group-hover:animate-wiggle">
                <Flame className="h-5 w-5 text-foreground" />
              </div>
              <span className="font-heading text-lg font-black tracking-tight">THE ROAST BOOK</span>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed max-w-xs">
              The funniest personalized gift you can give. Upload a photo, describe their quirks, and AI creates a custom illustrated roast book in minutes.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-black text-sm uppercase tracking-widest text-background/40 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-background/70 hover:text-primary transition-colors text-sm font-medium">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-background/70 hover:text-primary transition-colors text-sm font-medium">
                  Examples
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-background/70 hover:text-primary transition-colors text-sm font-medium">
                  Start Roasting
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-black text-sm uppercase tracking-widest text-background/40 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-background/70 hover:text-primary transition-colors text-sm font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-background/70 hover:text-primary transition-colors text-sm font-medium">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/40">
            © 2026 The Roast Book. All rights reserved.
          </p>
          <p className="text-sm text-background/40">
            Made for your best frenemies
          </p>
        </div>
      </div>
    </footer>
  );
}
