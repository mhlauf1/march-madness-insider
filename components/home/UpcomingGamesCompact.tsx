import Link from "next/link";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { format } from "date-fns";
import type { Game, Team } from "@/lib/types";

interface UpcomingGamesCompactProps {
  games: (Game & { team1?: Team; team2?: Team })[];
}

export function UpcomingGamesCompact({ games }: UpcomingGamesCompactProps) {
  if (games.length === 0) {
    return (
      <section>
        <SectionHeader title="Upcoming Games" />
        <p className="text-sm text-text-muted">No games scheduled yet.</p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Upcoming Games" subtitle="Next matchups" />
      <div className="space-y-2">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/matchups/${game.id}`}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-4 py-3 transition-colors hover:border-accent-blue/30 hover:bg-bg-hover"
          >
            <div className="flex items-center gap-2">
              {game.team1 && <TeamBadge team={game.team1} size="sm" />}
              <span className="text-xs text-text-muted">vs</span>
              {game.team2 && <TeamBadge team={game.team2} size="sm" showSeed={false} />}
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{game.round_name}</span>
              {game.scheduled_at && (
                <span>{format(new Date(game.scheduled_at), "MMM d")}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
