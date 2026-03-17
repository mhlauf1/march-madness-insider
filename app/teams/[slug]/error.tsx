"use client";

export default function TeamDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24">
      <div className="rounded-[var(--radius-md)] border border-accent-red/30 bg-bg-surface p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          Team not found
        </h2>
        <p className="mb-6 text-sm text-text-secondary">
          {error.message || "We couldn't load this team's data. Please try again."}
        </p>
        <button
          onClick={reset}
          className="rounded-[var(--radius-md)] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/80"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
