import { formatOdds } from "@/lib/utils/probability";
import { format } from "date-fns";
import type { ChampionshipFuture, Game } from "@/lib/types";

interface HeroStatsProps {
  upsetCount: number;
  gamesPlayed: number;
  topFavorite: ChampionshipFuture | undefined;
  nextGame: (Game & { team1?: { name: string }; team2?: { name: string } }) | undefined;
}

export function HeroStats({ upsetCount, gamesPlayed, topFavorite, nextGame }: HeroStatsProps) {
  return (
    <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-5">
        <p className="stat-label mb-1">Tournament Favorite</p>
        {topFavorite?.team ? (
          <>
            <p className="stat-value text-accent-blue">{topFavorite.team.name}</p>
            <p className="mt-1 font-mono text-xs text-text-muted">
              {formatOdds(topFavorite.odds)}
            </p>
          </>
        ) : (
          <p className="stat-value text-text-muted">TBD</p>
        )}
      </div>
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-5">
        <p className="stat-label mb-1">Games Played</p>
        <p className="stat-value text-text-primary">
          {gamesPlayed}{" "}
          <span className="text-sm font-normal text-text-muted">of 67</span>
        </p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-5">
        <p className="stat-label mb-1">Upsets This Year</p>
        <p className="stat-value text-accent-amber">{upsetCount}</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-5">
        <p className="stat-label mb-1">Next Game</p>
        {nextGame?.team1 && nextGame.team2 ? (
          <>
            <p className="truncate text-sm font-semibold">
              {nextGame.team1.name} vs {nextGame.team2.name}
            </p>
            {nextGame.scheduled_at && (
              <p className="mt-1 text-xs text-text-muted">
                {format(new Date(nextGame.scheduled_at), "MMM d, h:mm a")}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-text-muted">No games scheduled</p>
        )}
      </div>
    </div>
  );
}
