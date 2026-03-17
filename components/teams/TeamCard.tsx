import Image from "next/image";
import Link from "next/link";
import type { TeamWithRatings } from "@/lib/types";
import {
  formatRecord,
  formatEfficiency,
  formatRank,
  formatSignedNumber,
} from "@/lib/utils/format";

interface TeamCardProps {
  team: TeamWithRatings;
}

export function TeamCard({ team }: TeamCardProps) {
  const rating = team.kenpom_ratings?.[0];
  const future = team.championship_futures?.[0];

  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4 transition-colors hover:bg-bg-hover"
    >
      {/* Team identity */}
      <div className="flex items-center gap-3">
        {team.logo_url ? (
          <Image
            src={team.logo_url}
            alt={team.name}
            width={64}
            height={64}
            className="shrink-0"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-lg font-bold text-text-muted">
            {team.abbreviation}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-text-primary">
            <span className="font-mono text-xs text-text-muted">
              ({team.seed})
            </span>{" "}
            {team.name}
          </p>
          <p className="text-xs text-text-secondary">
            {team.conference} &middot;{" "}
            {formatRecord(team.record_wins, team.record_losses)}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-border-subtle" />

      {/* KenPom stats */}
      {rating ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">KenPom</span>
            <span className="font-mono text-sm font-semibold text-accent-blue">
              {formatRank(rating.kenpom_rank)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase text-text-muted">AdjEM</p>
              <p className="font-mono text-xs text-text-primary">
                {formatSignedNumber(rating.adj_em)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-text-muted">AdjO</p>
              <p className="font-mono text-xs text-accent-green">
                {formatEfficiency(rating.adj_o)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-text-muted">AdjD</p>
              <p className="font-mono text-xs text-accent-red">
                {formatEfficiency(rating.adj_d)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">No ratings available</p>
      )}

      {/* Championship odds */}
      {future && (
        <div className="mt-3 flex items-center justify-between rounded bg-bg-elevated px-2 py-1">
          <span className="text-[10px] uppercase text-text-muted">
            Title Odds
          </span>
          <span className="font-mono text-xs font-medium text-accent-amber">
            {future.odds > 0 ? `+${future.odds}` : future.odds}
          </span>
        </div>
      )}
    </Link>
  );
}
