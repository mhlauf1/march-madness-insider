interface ProgressBarProps {
  value: number;
  max: number;
  color?: "blue" | "amber" | "green" | "red";
  label?: string;
}

const colorMap = {
  blue: "bg-accent-blue",
  amber: "bg-accent-amber",
  green: "bg-accent-green",
  red: "bg-accent-red",
};

export function ProgressBar({
  value,
  max,
  color = "blue",
  label,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3">
      {label && <span className="stat-label w-24 shrink-0">{label}</span>}
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={`h-full rounded-full transition-all ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-xs text-text-secondary">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
