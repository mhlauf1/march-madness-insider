"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/bracket", label: "Bracket" },
  { href: "/teams", label: "Teams" },
  { href: "/stats", label: "Stats" },
  { href: "/compare", label: "Compare" },
  { href: "/insights", label: "Insights" },
];

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base backdrop-blur-xl md:bg-bg-base/80">
        <div className="mx-auto flex h-14 max-w-400 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-text-primary">
              Burger<span className="text-accent-blue">Lab</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}

            {/* Auth button */}
            {!loading && (
              <div className="ml-2 border-l border-border-subtle pl-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="max-w-[140px] truncate text-xs text-text-muted">
                      {user.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="rounded-sm p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                      aria-label="Sign out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="rounded-sm bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-blue/90"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="rounded-sm p-2 text-text-secondary transition-colors hover:bg-bg-hover md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </nav>

      {/* Mobile backdrop overlay - OUTSIDE nav to escape stacking context */}
      <div
        className={`fixed inset-0 top-14 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile sliding nav panel - OUTSIDE nav to escape stacking context */}
      <div
        className={`fixed top-14 right-0 bottom-0 z-50 w-72 bg-bg-surface shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-4 py-3 text-lg font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile auth */}
          {!loading && (
            <div className="mt-4 border-t border-border-subtle pt-4">
              {user ? (
                <div className="flex items-center justify-between px-4">
                  <span className="truncate text-sm text-text-muted">
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="rounded-sm px-3 py-1.5 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red/10"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full rounded-md bg-accent-blue px-4 py-3 text-center text-lg font-medium text-white transition-colors hover:bg-accent-blue/90"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}
