import Link from "next/link";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getWinProbability, getWinProbFromOdds, formatProbability } from "@/lib/utils/probability";
import { computeKenpomSpread } from "@/lib/utils/kenpom";
import type { GameWithTeams } from "@/lib/types";

interface UpsetWatchProps {
  games: GameWithTeams[];
}

interface UpsetCandidate {
  game: GameWithTeams;
  underdog: NonNullable<GameWithTeams["team1"]>;
  favorite: NonNullable<GameWithTeams["team1"]>;
  underdogWinProb: number;
  seedDiff: number;
  spread: number;
}

export function UpsetWatch({ games }: UpsetWatchProps) {
  const candidates: UpsetCandidate[] = [];

  for (const game of games) {
    if (!game.team1 || !game.team2) continue;
    const r1 = game.team1.kenpom_ratings?.[0];
    const r2 = game.team2.kenpom_ratings?.[0];
    if (!r1?.adj_em || !r2?.adj_em) continue;

    const seedDiff = Math.abs(game.team1.seed - game.team2.seed);
    if (seedDiff < 3) continue;

    // Determine favorite / underdog: prefer moneyline odds, fall back to KenPom
    const team1Prob = getWinProbFromOdds(game.betting_odds) ?? getWinProbability(r1.adj_em, r2.adj_em);
    const isFav1 = team1Prob >= 0.5;
    const underdogProb = isFav1 ? 1 - team1Prob : team1Prob;

    if (underdogProb < 0.25) continue;

    const spread = computeKenpomSpread(
      r1.adj_em, r2.adj_em,
      r1.adj_t ?? 68, r2.adj_t ?? 68,
    );

    candidates.push({
      game,
      underdog: isFav1 ? game.team2 : game.team1,
      favorite: isFav1 ? game.team1 : game.team2,
      underdogWinProb: underdogProb,
      seedDiff,
      spread: Math.abs(spread),
    });
  }

  candidates.sort((a, b) => b.underdogWinProb - a.underdogWinProb);
  const top = candidates.slice(0, 6);

  if (top.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Upset Watch" subtitle="Underdogs with real chances" />
      <div className="space-y-2">
        {top.map((c) => (
          <Link
            key={c.game.id}
            href={`/matchups/${c.game.id}`}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-accent-amber/20 bg-bg-surface px-4 py-3 transition-colors hover:border-accent-amber/40 hover:bg-bg-hover"
          >
            <div className="flex items-center gap-2">
              <TeamBadge team={c.underdog} size="sm" />
              <span className="text-xs text-text-muted">vs</span>
              <TeamBadge team={c.favorite} size="sm" showSeed={false} />
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="font-mono text-xs font-semibold text-accent-amber">
                {formatProbability(c.underdogWinProb)}
              </span>
              <span className="font-mono text-xs text-text-muted">
                +{c.spread.toFixed(1)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
