import { getRoundName } from "@/lib/utils/bracket";

interface RoundBadgeProps {
  round: number;
  roundName?: string;
}

export function RoundBadge({ round, roundName }: RoundBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      {roundName ?? getRoundName(round)}
    </span>
  );
}
