import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Game, Team } from "@/lib/types";

interface RecentResultsCompactProps {
  games: (Game & { team1?: Team; team2?: Team; winner?: Team })[];
}

export function RecentResultsCompact({ games }: RecentResultsCompactProps) {
  if (games.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Recent Results" />
      <div className="space-y-2">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/matchups/${game.id}`}
            className={`block rounded-[var(--radius-md)] border bg-bg-surface px-4 py-3 transition-colors hover:bg-bg-hover ${
              game.is_upset ? "border-accent-amber/40" : "border-border-subtle"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {game.team1?.name ?? "TBD"}
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  game.winner_id === game.team1_id ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {game.team1_score}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold">
                {game.team2?.name ?? "TBD"}
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  game.winner_id === game.team2_id ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {game.team2_score}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
              <span>{game.round_name}</span>
              {game.is_upset && (
                <span className="font-semibold text-accent-amber">UPSET</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
