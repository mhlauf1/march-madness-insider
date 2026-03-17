export default function MatchupLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Round badge skeleton */}
      <div className="mb-6 flex gap-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-bg-elevated" />
        <div className="h-6 w-48 animate-pulse rounded bg-bg-elevated" />
      </div>

      {/* Header card skeleton */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-bg-elevated" />
            <div className="h-5 w-32 animate-pulse rounded bg-bg-elevated" />
          </div>
          <div className="h-6 w-10 animate-pulse rounded bg-bg-elevated" />
          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="h-5 w-32 animate-pulse rounded bg-bg-elevated" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-bg-elevated" />
          </div>
        </div>
        {/* Win probability bar */}
        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <div className="h-4 w-10 animate-pulse rounded bg-bg-elevated" />
            <div className="h-4 w-24 animate-pulse rounded bg-bg-elevated" />
            <div className="h-4 w-10 animate-pulse rounded bg-bg-elevated" />
          </div>
          <div className="h-3 animate-pulse rounded-full bg-bg-elevated" />
        </div>
      </div>

      {/* Stat comparison table skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-bg-elevated" />
        <div className="rounded-[var(--radius-md)] border border-border-subtle">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-border-subtle px-4 py-3"
            >
              <div className="h-4 w-16 animate-pulse rounded bg-bg-elevated" />
              <div className="h-4 w-12 animate-pulse rounded bg-bg-elevated" />
              <div className="h-4 w-16 animate-pulse rounded bg-bg-elevated" />
            </div>
          ))}
        </div>
      </div>

      {/* Betting lines skeleton */}
      <div>
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-bg-elevated" />
        <div className="rounded-[var(--radius-md)] border border-border-subtle">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-border-subtle px-4 py-3"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-bg-elevated" />
              <div className="h-4 w-16 animate-pulse rounded bg-bg-elevated" />
              <div className="h-4 w-20 animate-pulse rounded bg-bg-elevated" />
              <div className="h-4 w-16 animate-pulse rounded bg-bg-elevated" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
