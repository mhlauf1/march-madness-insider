"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password);
        setSignUpSuccess(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-[var(--radius-lg)] border border-border-subtle bg-bg-surface p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-[var(--radius-sm)] p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="mb-1 text-lg font-bold text-text-primary">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h2>
        <p className="mb-5 text-sm text-text-muted">
          {mode === "signin"
            ? "Sign in to pick your bracket"
            : "Create an account to save your picks"}
        </p>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-[var(--radius-sm)] bg-bg-elevated p-1">
          <button
            onClick={() => { setMode("signin"); setError(null); setSignUpSuccess(false); }}
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(null); setSignUpSuccess(false); }}
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Sign Up
          </button>
        </div>

        {signUpSuccess ? (
          <div className="rounded-[var(--radius-md)] bg-accent-green/10 p-4 text-sm text-accent-green">
            Check your email for a confirmation link, then sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
            />

            {error && (
              <p className="text-sm text-accent-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-[var(--radius-md)] bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
            >
              {submitting
                ? "..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
