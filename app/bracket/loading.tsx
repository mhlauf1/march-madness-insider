export default function BracketLoading() {
  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 animate-pulse rounded-[var(--radius-sm)] bg-bg-surface" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded-[var(--radius-sm)] bg-bg-surface" />
      </div>

      {/* Desktop bracket skeleton */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-9 gap-2">
          {/* Left regions (East + Midwest) */}
          {[0, 1, 2, 3].map((col) => (
            <div key={`left-${col}`} className="flex flex-col gap-3">
              {Array.from({ length: Math.max(1, 8 >> col) }).map((_, row) => (
                <div
                  key={row}
                  className="h-16 animate-pulse rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface"
                />
              ))}
            </div>
          ))}

          {/* Final Four center */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-20 w-full animate-pulse rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface" />
            <div className="h-20 w-full animate-pulse rounded-[var(--radius-md)] border border-accent-blue/20 bg-bg-surface" />
            <div className="h-20 w-full animate-pulse rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface" />
          </div>

          {/* Right regions (West + South) */}
          {[3, 2, 1, 0].map((col) => (
            <div key={`right-${col}`} className="flex flex-col gap-3">
              {Array.from({ length: Math.max(1, 8 >> col) }).map((_, row) => (
                <div
                  key={row}
                  className="h-16 animate-pulse rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="lg:hidden">
        {/* Tab bar skeleton */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-14 shrink-0 animate-pulse rounded-[var(--radius-sm)] bg-bg-surface"
            />
          ))}
        </div>
        {/* Game cards skeleton */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
