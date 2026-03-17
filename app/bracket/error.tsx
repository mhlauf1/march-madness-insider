"use client";

export default function BracketError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent-red/30 bg-accent-red/10">
        <svg
          className="h-6 w-6 text-accent-red"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-text-primary">
        Failed to load bracket
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        Something went wrong while fetching the tournament data. This is
        usually temporary — please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-[var(--radius-md)] bg-accent-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-dim"
      >
        Try again
      </button>
    </div>
  );
}
