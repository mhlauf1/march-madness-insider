import Link from "next/link";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { format } from "date-fns";
import type { Game, Team } from "@/lib/types";

interface ScoreboardCardProps {
  game: Game & { team1?: Team; team2?: Team; winner?: Team };
}

export function ScoreboardCard({ game }: ScoreboardCardProps) {
  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final" || game.is_completed;

  return (
    <Link
      href={`/matchups/${game.id}`}
      className={`block rounded-[var(--radius-md)] border bg-bg-surface px-4 py-3.5 transition-colors hover:bg-bg-hover ${
        isLive
          ? "border-accent-green/40 shadow-[0_0_0_1px_var(--accent-green-dim,rgba(34,197,94,0.1))]"
          : game.is_upset && isFinal
            ? "border-accent-amber/40"
            : "border-border-subtle"
      }`}
    >
      {/* Header: round + time */}
      <div className="mb-3 flex items-center justify-between text-xs text-text-muted">
        <span>
          {game.round_name}
          {game.region ? ` · ${game.region}` : ""}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 font-semibold text-accent-green">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent-green" />
            LIVE
          </span>
        ) : isFinal ? (
          <span>FINAL</span>
        ) : game.scheduled_at ? (
          <span>{format(new Date(game.scheduled_at), "MMM d · h:mma")}</span>
        ) : null}
      </div>

      {/* Team 1 */}
      <div className="flex items-center justify-between">
        <div
          className={
            isFinal && game.winner_id === game.team1_id
              ? ""
              : isFinal
                ? "opacity-50"
                : ""
          }
        >
          {game.team1 ? (
            <TeamBadge team={game.team1} size="sm" />
          ) : (
            <span className="text-sm text-text-muted">TBD</span>
          )}
        </div>
        {(isLive || isFinal) && game.team1_score != null && (
          <span
            className={`font-mono text-sm font-bold ${
              isFinal && game.winner_id === game.team1_id
                ? "text-text-primary"
                : "text-text-muted"
            }`}
          >
            {game.team1_score}
          </span>
        )}
      </div>

      {/* Team 2 */}
      <div className="mt-1.5 flex items-center justify-between">
        <div
          className={
            isFinal && game.winner_id === game.team2_id
              ? ""
              : isFinal
                ? "opacity-50"
                : ""
          }
        >
          {game.team2 ? (
            <TeamBadge team={game.team2} size="sm" />
          ) : (
            <span className="text-sm text-text-muted">TBD</span>
          )}
        </div>
        {(isLive || isFinal) && game.team2_score != null && (
          <span
            className={`font-mono text-sm font-bold ${
              isFinal && game.winner_id === game.team2_id
                ? "text-text-primary"
                : "text-text-muted"
            }`}
          >
            {game.team2_score}
          </span>
        )}
      </div>

      {/* Footer: upset badge */}
      {isFinal && game.is_upset && (
        <div className="mt-2 text-xs font-semibold text-accent-amber">
          UPSET
        </div>
      )}
    </Link>
  );
}
