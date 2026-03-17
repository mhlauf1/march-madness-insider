import Link from "next/link";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { OddsChip } from "@/components/ui/OddsChip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatProbability, oddsToImpliedProb } from "@/lib/utils/probability";
import type { ChampionshipFuture } from "@/lib/types";

interface ChampionshipOddsProps {
  futures: ChampionshipFuture[];
}

export function ChampionshipOdds({ futures }: ChampionshipOddsProps) {
  const unique = futures
    .filter((f, i, arr) => arr.findIndex((x) => x.team_id === f.team_id) === i)
    .slice(0, 8);

  if (unique.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Championship Odds" subtitle="Top contenders by market" />
      <div className="space-y-2">
        {unique.map((future) =>
          future.team ? (
            <Link
              key={future.team_id}
              href={`/teams/${future.team.slug}`}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-4 py-3 transition-colors hover:border-accent-blue/30 hover:bg-bg-hover"
            >
              <TeamBadge team={future.team} size="sm" />
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">
                  {formatProbability(oddsToImpliedProb(future.odds))}
                </span>
                <OddsChip odds={future.odds} />
              </div>
            </Link>
          ) : null,
        )}
      </div>
    </section>
  );
}
