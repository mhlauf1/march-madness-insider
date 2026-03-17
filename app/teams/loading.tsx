export default function TeamsLoading() {
  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-4">
        <div className="h-7 w-40 animate-pulse rounded bg-bg-elevated" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-bg-elevated" />
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-6 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-36 animate-pulse rounded-[var(--radius-md)] bg-bg-elevated"
          />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 animate-pulse rounded-full bg-bg-elevated" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-bg-elevated" />
                <div className="h-3 w-32 animate-pulse rounded bg-bg-elevated" />
              </div>
            </div>
            <div className="my-3 h-px bg-border-subtle" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-bg-elevated" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
