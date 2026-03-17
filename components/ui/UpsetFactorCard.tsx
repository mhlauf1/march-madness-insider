import type { UpsetFactor } from "@/lib/utils/upset-factors";

interface UpsetFactorCardProps {
  factor: UpsetFactor;
  team1Name: string;
  team2Name: string;
}

export function UpsetFactorCard({
  factor,
  team1Name,
  team2Name,
}: UpsetFactorCardProps) {
  const borderClass =
    factor.severity === "high"
      ? "border-accent-amber/40"
      : "border-border-subtle";

  return (
    <div
      className={`rounded-[var(--radius-md)] border ${borderClass} bg-bg-surface p-5`}
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {factor.title}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            factor.severity === "high"
              ? "bg-accent-amber/15 text-accent-amber"
              : "bg-bg-elevated text-text-secondary"
          }`}
        >
          {factor.severity}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            {team1Name}
          </p>
          <p className="font-mono text-sm font-bold text-text-primary">
            {factor.team1Value}
          </p>
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            {team2Name}
          </p>
          <p className="font-mono text-sm font-bold text-text-primary">
            {factor.team2Value}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-secondary">
        {factor.description}
      </p>
    </div>
  );
}
