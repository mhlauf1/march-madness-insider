import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="display-stat mb-4 text-text-muted">404</p>
      <h1 className="mb-2 text-2xl font-semibold">Page Not Found</h1>
      <p className="mb-8 text-text-secondary">
        This page doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/bracket"
          className="rounded-[var(--radius-md)] bg-accent-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue-dim"
        >
          View Bracket
        </Link>
        <Link
          href="/teams"
          className="rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover"
        >
          Browse Teams
        </Link>
      </div>
    </div>
  );
}
