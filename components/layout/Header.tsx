'use client';

import Link from "next/link";
import { BrutalButton } from "@/components/ui/brutal-button";
import { Flame, Menu, X, User, LogOut, BookOpen, ChevronDown, Shield, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentUser, signOut, identifyUserInAnalytics } from "@/lib/auth";
import { captureEvent, Events } from '@/lib/posthog';
import { isAdminUser } from "@/lib/admin";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminMode = isAdminUser(user);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Identify user in analytics when session loads
        if (currentUser) {
          await identifyUserInAnalytics(currentUser);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 md:border-b-3 border-foreground bg-background">
      {/* Ultra-compact height on mobile: h-10 vs h-14 on desktop */}
      <div className="container flex h-10 md:h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center rounded-lg border-2 md:border-3 border-foreground bg-primary shadow-brutal group-hover:animate-wiggle">
            <Flame className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <span className="font-heading text-sm md:text-lg font-bold hidden xs:inline">The Roast Book</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/how-it-works" className="font-heading font-semibold hover:text-accent transition-colors">
            How It Works
          </Link>
          <Link href="/examples" className="font-heading font-semibold hover:text-accent transition-colors">
            Examples
          </Link>

          {!loading && (
            <>
              {user ? (
                <div className="relative flex items-center gap-3">
                  {/* Admin Badge */}
                  {adminMode && (
                    <div className="hidden md:flex items-center gap-1.5 bg-primary border-2 border-foreground px-3 py-1.5 rounded-lg shadow-brutal-sm">
                      <Shield className="h-4 w-4" />
                      <span className="font-heading font-bold text-sm">ADMIN</span>
                    </div>
                  )}

                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email || 'User'}
                        className="h-8 w-8 rounded-full border-2 border-foreground"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full border-2 border-foreground bg-primary flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span className="font-heading font-semibold text-sm max-w-[100px] truncate">
                      {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-card border-3 border-foreground rounded-xl shadow-brutal-lg z-50 overflow-hidden">
                        <div className="p-3 border-b-2 border-border">
                          <p className="font-semibold text-sm truncate">{user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium text-sm">My Books</span>
                          </Link>
                          {adminMode && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span className="font-medium text-sm">Admin Dashboard</span>
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleSignOut();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="font-medium text-sm">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <button className="font-heading font-semibold px-4 py-2 hover:text-accent transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <BrutalButton
                      size="sm"
                      onClick={() => captureEvent(Events.START_ROASTING_CLICKED, { location: 'header_desktop' })}
                    >
                      Start Roasting 🔥
                    </BrutalButton>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Mobile Menu Button - larger touch target */}
        <button
          className="md:hidden p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-3 border-foreground bg-background p-4 animate-slide-up">
          <nav className="flex flex-col gap-4">
            <Link
              href="/how-it-works"
              className="font-heading font-semibold py-2 hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/examples"
              className="font-heading font-semibold py-2 hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Examples
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    {/* Admin Badge - Mobile */}
                    {adminMode && (
                      <div className="flex items-center gap-2 bg-primary border-2 border-foreground px-4 py-2 rounded-lg shadow-brutal">
                        <Shield className="h-5 w-5" />
                        <span className="font-heading font-bold text-sm">ADMIN MODE</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 py-2 px-3 bg-muted rounded-lg">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || user.email || 'User'}
                          className="h-10 w-10 rounded-full border-2 border-foreground"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border-2 border-foreground bg-primary flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="font-heading font-semibold py-2 hover:text-accent flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <BookOpen className="h-5 w-5" />
                      My Books
                    </Link>
                    {adminMode && (
                      <Link
                        href="/admin"
                        className="font-heading font-semibold py-2 hover:text-accent flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="font-heading font-semibold py-2 hover:text-accent flex items-center gap-2 text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="font-heading font-semibold py-2 hover:text-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link href="/dashboard" onClick={() => {
                      setMobileMenuOpen(false);
                      captureEvent(Events.START_ROASTING_CLICKED, { location: 'header_mobile' });
                    }}>
                      <BrutalButton className="w-full">
                        Start Roasting 🔥
                      </BrutalButton>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
