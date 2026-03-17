import { formatRank } from "@/lib/utils/format";

interface StatCardProps {
  label: string;
  value: string | number;
  rank?: number | null;
  rankTotal?: number;
  delta?: number | null;
  color?: "blue" | "amber" | "green" | "red";
}

export function StatCard({
  label,
  value,
  rank,
  rankTotal = 68,
  delta,
  color = "blue",
}: StatCardProps) {
  const colorMap = {
    blue: "text-accent-blue",
    amber: "text-accent-amber",
    green: "text-accent-green",
    red: "text-accent-red",
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4">
      <p className="stat-label mb-1">{label}</p>
      <p className={`stat-value ${colorMap[color]}`}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {rank != null && (
          <span className="text-xs text-text-muted">
            {formatRank(rank)}{rankTotal ? ` of ${rankTotal}` : ""}
          </span>
        )}
        {delta != null && (
          <span
            className={`text-xs font-medium ${delta > 0 ? "text-accent-green" : delta < 0 ? "text-accent-red" : "text-text-muted"}`}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
