export default function TeamDetailLoading() {
  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      {/* Hero skeleton */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-surface p-6 md:p-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-bg-elevated" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-24 animate-pulse rounded bg-bg-elevated" />
              <div className="h-5 w-20 animate-pulse rounded bg-bg-elevated" />
            </div>
            <div className="h-8 w-64 animate-pulse rounded bg-bg-elevated" />
            <div className="h-4 w-48 animate-pulse rounded bg-bg-elevated" />
          </div>
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-6 w-36 animate-pulse rounded bg-bg-elevated" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4"
            >
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-bg-elevated" />
              <div className="mb-2 h-7 w-16 animate-pulse rounded bg-bg-elevated" />
              <div className="h-3 w-24 animate-pulse rounded bg-bg-elevated" />
            </div>
          ))}
        </div>
      </div>

      {/* Four Factors skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-bg-elevated" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4"
            >
              <div className="mb-4 h-4 w-16 animate-pulse rounded bg-bg-elevated" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-3 w-16 animate-pulse rounded bg-bg-elevated" />
                    <div className="h-2 flex-1 animate-pulse rounded-full bg-bg-elevated" />
                    <div className="h-3 w-10 animate-pulse rounded bg-bg-elevated" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player table skeleton */}
      <div className="mb-8">
        <div className="mb-4 h-6 w-24 animate-pulse rounded bg-bg-elevated" />
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-border-subtle">
          <div className="h-10 w-full animate-pulse bg-bg-elevated" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 items-center gap-4 border-b border-border-subtle bg-bg-surface px-4"
            >
              <div className="h-3 w-32 animate-pulse rounded bg-bg-elevated" />
              <div className="h-3 w-8 animate-pulse rounded bg-bg-elevated" />
              <div className="h-3 w-12 animate-pulse rounded bg-bg-elevated" />
              <div className="ml-auto h-3 w-10 animate-pulse rounded bg-bg-elevated" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
