import { createServerClient } from "@/lib/supabase/server";
import { getGameById, getTeamSeasonStats } from "@/lib/queries/games";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { OddsChip } from "@/components/ui/OddsChip";
import { RoundBadge } from "@/components/ui/RoundBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  getWinProbability,
  getWinProbFromOdds,
  formatProbability,
  formatOdds,
} from "@/lib/utils/probability";
import {
  formatEfficiency,
  formatPct,
  formatStatPct,
  formatRank,
  formatSignedNumber,
} from "@/lib/utils/format";
import { format } from "date-fns";
import { computeMatchupUpsetFactors } from "@/lib/utils/upset-factors";
import { UpsetFactorCard } from "@/components/ui/UpsetFactorCard";
import type { GameWithTeams, KenpomRatings, Player, TeamSeasonStats } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function getLatestRating(ratings: KenpomRatings[]): KenpomRatings | null {
  if (!ratings || ratings.length === 0) return null;
  return ratings.reduce((a, b) => (a.season > b.season ? a : b));
}

interface StatRow {
  label: string;
  team1Val: string;
  team2Val: string;
  team1Better: boolean;
}

function buildStatRows(
  r1: KenpomRatings | null,
  r2: KenpomRatings | null,
  ppg1: number | null,
  ppg2: number | null,
  s1: TeamSeasonStats | null,
  s2: TeamSeasonStats | null,
): StatRow[] {
  if (!r1 || !r2) return [];

  return [
    {
      label: "KenPom Rank",
      team1Val: formatRank(r1.kenpom_rank),
      team2Val: formatRank(r2.kenpom_rank),
      team1Better: (r1.kenpom_rank ?? 999) < (r2.kenpom_rank ?? 999),
    },
    {
      label: "Adjusted Efficiency Margin",
      team1Val: formatSignedNumber(r1.adj_em),
      team2Val: formatSignedNumber(r2.adj_em),
      team1Better: (r1.adj_em ?? -999) > (r2.adj_em ?? -999),
    },
    {
      label: "Adjusted Offense",
      team1Val: formatEfficiency(r1.adj_o),
      team2Val: formatEfficiency(r2.adj_o),
      team1Better: (r1.adj_o ?? 0) > (r2.adj_o ?? 0),
    },
    {
      label: "Adjusted Defense",
      team1Val: formatEfficiency(r1.adj_d),
      team2Val: formatEfficiency(r2.adj_d),
      team1Better: (r1.adj_d ?? 999) < (r2.adj_d ?? 999),
    },
    {
      label: "Tempo",
      team1Val: `${formatEfficiency(r1.adj_t)}${r1.adj_t_rank != null ? ` (${formatRank(r1.adj_t_rank)} of 364)` : ""}`,
      team2Val: `${formatEfficiency(r2.adj_t)}${r2.adj_t_rank != null ? ` (${formatRank(r2.adj_t_rank)} of 364)` : ""}`,
      team1Better: (r1.adj_t ?? 0) > (r2.adj_t ?? 0),
    },
    {
      label: "Points Per Game",
      team1Val: ppg1 != null ? ppg1.toFixed(1) : "—",
      team2Val: ppg2 != null ? ppg2.toFixed(1) : "—",
      team1Better: (ppg1 ?? 0) > (ppg2 ?? 0),
    },
    {
      label: "Effective Field Goal %",
      team1Val: formatStatPct(r1.off_efg_pct),
      team2Val: formatStatPct(r2.off_efg_pct),
      team1Better: (r1.off_efg_pct ?? 0) > (r2.off_efg_pct ?? 0),
    },
    {
      label: "3PA Per Game",
      team1Val: s1?.avg_3pa != null ? s1.avg_3pa.toFixed(1) : "—",
      team2Val: s2?.avg_3pa != null ? s2.avg_3pa.toFixed(1) : "—",
      team1Better: (s1?.avg_3pa ?? 0) > (s2?.avg_3pa ?? 0),
    },
    {
      label: "3PM Per Game",
      team1Val: s1?.avg_3pm != null ? s1.avg_3pm.toFixed(1) : "—",
      team2Val: s2?.avg_3pm != null ? s2.avg_3pm.toFixed(1) : "—",
      team1Better: (s1?.avg_3pm ?? 0) > (s2?.avg_3pm ?? 0),
    },
    {
      label: "3-Point %",
      team1Val: s1?.three_pt_pct != null ? `${s1.three_pt_pct.toFixed(1)}%` : formatPct(r1.pct_3pt),
      team2Val: s2?.three_pt_pct != null ? `${s2.three_pt_pct.toFixed(1)}%` : formatPct(r2.pct_3pt),
      team1Better: (s1?.three_pt_pct ?? r1.pct_3pt ?? 0) > (s2?.three_pt_pct ?? r2.pct_3pt ?? 0),
    },
    {
      label: "Free Throw %",
      team1Val: s1?.ft_pct != null ? formatStatPct(s1.ft_pct) : "—",
      team2Val: s2?.ft_pct != null ? formatStatPct(s2.ft_pct) : "—",
      team1Better: (s1?.ft_pct ?? 0) > (s2?.ft_pct ?? 0),
    },
    {
      label: "Avg FT Attempted / Game",
      team1Val: s1?.avg_fta != null ? s1.avg_fta.toFixed(1) : "—",
      team2Val: s2?.avg_fta != null ? s2.avg_fta.toFixed(1) : "—",
      team1Better: (s1?.avg_fta ?? 0) > (s2?.avg_fta ?? 0),
    },
    {
      label: "Avg Turnovers / Game",
      team1Val: s1?.avg_turnovers != null ? s1.avg_turnovers.toFixed(1) : "—",
      team2Val: s2?.avg_turnovers != null ? s2.avg_turnovers.toFixed(1) : "—",
      team1Better: (s1?.avg_turnovers ?? 999) < (s2?.avg_turnovers ?? 999),
    },
    {
      label: "Avg Offensive Rebounds / Game",
      team1Val: s1?.avg_off_rebounds != null ? s1.avg_off_rebounds.toFixed(1) : "—",
      team2Val: s2?.avg_off_rebounds != null ? s2.avg_off_rebounds.toFixed(1) : "—",
      team1Better: (s1?.avg_off_rebounds ?? 0) > (s2?.avg_off_rebounds ?? 0),
    },
  ];
}

function getStartingFive(players: Player[] | undefined): Player[] {
  if (!players || players.length === 0) return [];
  return [...players]
    .sort((a, b) => (b.minutes_pct ?? 0) - (a.minutes_pct ?? 0))
    .slice(0, 5);
}

export default async function MatchupPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const supabase = createServerClient();
  const game = (await getGameById(supabase, gameId)) as GameWithTeams;

  const team1 = game.team1;
  const team2 = game.team2;

  const r1 = team1 ? getLatestRating(team1.kenpom_ratings) : null;
  const r2 = team2 ? getLatestRating(team2.kenpom_ratings) : null;

  // Fetch season stats for PPG
  const [stats1, stats2] = await Promise.all([
    team1 ? getTeamSeasonStats(supabase, team1.id) : null,
    team2 ? getTeamSeasonStats(supabase, team2.id) : null,
  ]);

  // Use season stats PPG, fall back to KenPom estimate: (adj_o / 100) * adj_t
  const ppg1 = (stats1 as TeamSeasonStats | null)?.ppg
    ?? (r1?.adj_o != null && r1?.adj_t != null ? (r1.adj_o / 100) * r1.adj_t : null);
  const ppg2 = (stats2 as TeamSeasonStats | null)?.ppg
    ?? (r2?.adj_o != null && r2?.adj_t != null ? (r2.adj_o / 100) * r2.adj_t : null);

  const winProb =
    getWinProbFromOdds(game.betting_odds) ??
    (r1?.adj_em != null && r2?.adj_em != null
      ? getWinProbability(r1.adj_em, r2.adj_em)
      : null);

  const statRows = buildStatRows(r1, r2, ppg1, ppg2, stats1 as TeamSeasonStats | null, stats2 as TeamSeasonStats | null);

  const starters1 = getStartingFive(team1?.kenpom_players);
  const starters2 = getStartingFive(team2?.kenpom_players);

  const upsetFactors =
    team1 && team2
      ? computeMatchupUpsetFactors(
          team1,
          team2,
          team1.kenpom_players,
          team2.kenpom_players,
        )
      : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Round / Venue / Time Info */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <RoundBadge round={game.round} roundName={game.round_name} />
        {game.venue_name && (
          <span className="text-xs text-text-muted">
            {game.venue_name}
            {game.venue_city && `, ${game.venue_city}`}
            {game.venue_state && `, ${game.venue_state}`}
          </span>
        )}
        {game.scheduled_at && (
          <span className="text-xs text-text-muted">
            {format(new Date(game.scheduled_at), "MMM d, yyyy h:mm a")}
          </span>
        )}
      </div>

      {/* Header: Teams with Win Probability */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-surface p-4 sm:p-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <div className="flex-1 text-center">
            {team1 ? (
              <TeamBadge team={team1} size="lg" showRecord centered />
            ) : (
              <p className="text-text-muted">TBD</p>
            )}
          </div>

          <div className="shrink-0 text-center">
            {game.is_completed ? (
              <div>
                <p className="font-mono text-2xl font-bold">
                  <span
                    className={
                      game.winner_id === game.team1_id
                        ? "text-accent-green"
                        : "text-text-muted"
                    }
                  >
                    {game.team1_score}
                  </span>
                  <span className="mx-2 text-text-muted">-</span>
                  <span
                    className={
                      game.winner_id === game.team2_id
                        ? "text-accent-green"
                        : "text-text-muted"
                    }
                  >
                    {game.team2_score}
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium uppercase text-text-muted">
                  Final
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium text-text-muted">VS</p>
            )}
          </div>

          <div className="flex-1 text-center">
            {team2 ? (
              <TeamBadge team={team2} size="lg" showRecord centered />
            ) : (
              <p className="text-text-muted">TBD</p>
            )}
          </div>
        </div>

        {/* Win Probability Bar */}
        {winProb !== null && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-medium">
              <span className="text-accent-blue">
                {formatProbability(winProb)}
              </span>
              <span className="text-text-muted">Win Probability</span>
              <span className="text-accent-amber">
                {formatProbability(1 - winProb)}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="rounded-l-full bg-accent-blue transition-all"
                style={{ width: `${(winProb * 100).toFixed(1)}%` }}
              />
              <div
                className="rounded-r-full bg-accent-amber transition-all"
                style={{ width: `${((1 - winProb) * 100).toFixed(1)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stat Comparison Table */}
      {statRows.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Statistical Comparison"
            subtitle="KenPom ratings side by side"
          />
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-surface">
                  <th className="px-4 py-3 text-left font-medium text-text-primary">
                    {team1?.name ?? "Team 1"}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-text-muted">
                    Stat
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-text-primary">
                    {team2?.name ?? "Team 2"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border-subtle transition-colors hover:bg-bg-hover"
                  >
                    <td
                      className={`px-4 py-3 text-left font-mono ${row.team1Better ? "font-bold text-accent-green" : "text-text-secondary"}`}
                    >
                      {row.team1Val}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium uppercase text-text-muted">
                      {row.label}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${!row.team1Better ? "font-bold text-accent-green" : "text-text-secondary"}`}
                    >
                      {row.team2Val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Projected Starting 5 */}
      {(starters1.length > 0 || starters2.length > 0) && (
        <section className="mb-8">
          <SectionHeader
            title="Projected Starting 5"
            subtitle="Top players by minutes played"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { team: team1, starters: starters1 },
              { team: team2, starters: starters2 },
            ].map(({ team, starters }) =>
              team && starters.length > 0 ? (
                <div
                  key={team.id}
                  className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle"
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-elevated text-left text-xs uppercase text-text-muted">
                        <th className="px-4 py-2" colSpan={6}>
                          {team.name}
                        </th>
                      </tr>
                      <tr className="border-b border-border-subtle bg-bg-elevated text-left text-xs uppercase text-text-muted">
                        <th className="px-4 py-2">Player</th>
                        <th className="px-2 py-2">Pos</th>
                        <th className="px-2 py-2 text-right">PPG</th>
                        <th className="px-2 py-2 text-right">RPG</th>
                        <th className="px-2 py-2 text-right">APG</th>
                        <th className="px-2 py-2 text-right">eFG%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {starters.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-border-subtle bg-bg-surface transition-colors hover:bg-bg-hover"
                        >
                          <td className="px-4 py-2 font-medium text-text-primary">
                            {p.name}
                          </td>
                          <td className="px-2 py-2 text-text-secondary">
                            {p.position ?? "—"}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-text-primary">
                            {formatEfficiency(p.ppg)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-text-secondary">
                            {formatEfficiency(p.rpg)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-text-secondary">
                            {formatEfficiency(p.apg)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-text-secondary">
                            {formatStatPct(p.efg_pct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null,
            )}
          </div>
        </section>
      )}

      {/* Upset Factors */}
      {upsetFactors.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Upset Factors"
            subtitle="Key variables that could swing this matchup"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upsetFactors.map((factor) => (
              <UpsetFactorCard
                key={factor.id}
                factor={factor}
                team1Name={team1?.name ?? "Team 1"}
                team2Name={team2?.name ?? "Team 2"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Betting Lines */}
      {game.betting_odds && game.betting_odds.length > 0 && (
        <section>
          <SectionHeader
            title="Betting Lines"
            subtitle="Latest odds from sportsbooks"
          />
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-surface">
                  <th className="px-4 py-3 text-left font-medium text-text-muted">
                    Book
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-text-muted">
                    Spread
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-text-muted">
                    Moneyline
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-text-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {game.betting_odds.map((odds) => (
                  <tr
                    key={odds.id}
                    className="border-b border-border-subtle transition-colors hover:bg-bg-hover"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {odds.bookmaker}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        {odds.spread_team1 != null && (
                          <span className="font-mono text-text-secondary">
                            {team1?.abbreviation}{" "}
                            {formatOdds(odds.spread_team1)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        {odds.ml_team1 != null && (
                          <OddsChip
                            odds={odds.ml_team1}
                            label={team1?.abbreviation}
                          />
                        )}
                        {odds.ml_team2 != null && (
                          <OddsChip
                            odds={odds.ml_team2}
                            label={team2?.abbreviation}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {odds.total_over != null && (
                        <span className="font-mono text-text-secondary">
                          O/U {odds.total_over}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
