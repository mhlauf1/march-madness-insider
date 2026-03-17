export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-7 w-44 animate-pulse rounded bg-bg-elevated" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-bg-elevated" />
      </div>

      {/* Team selectors skeleton */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 h-3 w-14 animate-pulse rounded bg-bg-elevated" />
          <div className="h-12 animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
        </div>
        <div>
          <div className="mb-2 h-3 w-14 animate-pulse rounded bg-bg-elevated" />
          <div className="h-12 animate-pulse rounded-[var(--radius-md)] bg-bg-elevated" />
        </div>
      </div>

      {/* Empty state skeleton */}
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-12">
        <div className="mx-auto h-4 w-72 animate-pulse rounded bg-bg-elevated" />
      </div>
    </div>
  );
}
