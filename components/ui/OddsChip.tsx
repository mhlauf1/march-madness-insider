import { formatOdds } from "@/lib/utils/probability";

interface OddsChipProps {
  odds: number;
  label?: string;
}

export function OddsChip({ odds, label }: OddsChipProps) {
  const colorClass =
    odds > 0
      ? "bg-accent-green/10 text-accent-green"
      : "bg-accent-red/10 text-accent-red";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${colorClass}`}
    >
      {label && <span className="text-text-muted">{label}</span>}
      {formatOdds(odds)}
    </span>
  );
}
