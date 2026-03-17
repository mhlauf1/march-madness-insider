interface BigStatCardProps {
  label: string;
  value: number | null;
  d1Average: number;
  format?: "fixed1" | "pct";
  higherIsBetter: boolean;
  subtitle?: string;
}

export function BigStatCard({
  label,
  value,
  d1Average,
  format = "fixed1",
  higherIsBetter,
  subtitle,
}: BigStatCardProps) {
  if (value == null) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-5">
        <p className="stat-label mb-2">{label}</p>
        <p className="font-mono text-3xl font-bold text-text-muted">—</p>
      </div>
    );
  }

  const delta = value - d1Average;
  const formattedValue =
    format === "pct" ? `${value.toFixed(1)}%` : value.toFixed(1);
  const formattedDelta =
    format === "pct"
      ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`
      : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;

  const isGood = higherIsBetter ? delta > 0 : delta < 0;
  const isBad = higherIsBetter ? delta < 0 : delta > 0;
  const deltaColor =
    Math.abs(delta) < 0.05
      ? "text-text-muted"
      : isGood
        ? "text-accent-green"
        : isBad
          ? "text-accent-red"
          : "text-text-muted";

  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-5">
      <p className="stat-label mb-2">{label}</p>
      <p className="font-mono text-3xl font-bold text-text-primary">
        {formattedValue}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={`font-mono text-sm font-medium ${deltaColor}`}>
          {formattedDelta}
        </span>
        <span className="text-xs text-text-muted">vs D1 avg</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
