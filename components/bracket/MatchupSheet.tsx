"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getGameById, getTeamSeasonStats } from "@/lib/queries/games";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { UpsetFactorCard } from "@/components/ui/UpsetFactorCard";
import { OddsChip } from "@/components/ui/OddsChip";
import {
  getWinProbability,
  getWinProbFromOdds,
  formatProbability,
  formatOdds,
} from "@/lib/utils/probability";
import {
  formatEfficiency,
  formatStatPct,
  formatPct,
  formatRank,
  formatSignedNumber,
} from "@/lib/utils/format";
import { computeMatchupUpsetFactors } from "@/lib/utils/upset-factors";
import type {
  Game,
  GameWithTeams,
  KenpomRatings,
  Player,
  TeamSeasonStats,
} from "@/lib/types";

interface MatchupSheetProps {
  game: Game;
  currentPick: string | null;
  onClose: () => void;
}

type TabId = "matchup" | "team1" | "team2";

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
  s1: TeamSeasonStats | null,
  s2: TeamSeasonStats | null,
): StatRow[] {
  if (!r1 || !r2) return [];

  const ppg1 =
    s1?.ppg ??
    (r1.adj_o != null && r1.adj_t != null
      ? (r1.adj_o / 100) * r1.adj_t
      : null);
  const ppg2 =
    s2?.ppg ??
    (r2.adj_o != null && r2.adj_t != null
      ? (r2.adj_o / 100) * r2.adj_t
      : null);

  return [
    {
      label: "KenPom Rank",
      team1Val: formatRank(r1.kenpom_rank),
      team2Val: formatRank(r2.kenpom_rank),
      team1Better: (r1.kenpom_rank ?? 999) < (r2.kenpom_rank ?? 999),
    },
    {
      label: "Adj. Efficiency",
      team1Val: formatSignedNumber(r1.adj_em),
      team2Val: formatSignedNumber(r2.adj_em),
      team1Better: (r1.adj_em ?? -999) > (r2.adj_em ?? -999),
    },
    {
      label: "Adj. Offense",
      team1Val: formatEfficiency(r1.adj_o),
      team2Val: formatEfficiency(r2.adj_o),
      team1Better: (r1.adj_o ?? 0) > (r2.adj_o ?? 0),
    },
    {
      label: "Adj. Defense",
      team1Val: formatEfficiency(r1.adj_d),
      team2Val: formatEfficiency(r2.adj_d),
      team1Better: (r1.adj_d ?? 999) < (r2.adj_d ?? 999),
    },
    {
      label: "Pace (Poss/40)",
      team1Val: `${formatEfficiency(r1.adj_t)}${r1.adj_t_rank != null ? ` (${formatRank(r1.adj_t_rank)} of 364)` : ""}`,
      team2Val: `${formatEfficiency(r2.adj_t)}${r2.adj_t_rank != null ? ` (${formatRank(r2.adj_t_rank)} of 364)` : ""}`,
      team1Better: (r1.adj_t ?? 0) > (r2.adj_t ?? 0),
    },
    {
      label: "PPG",
      team1Val: ppg1 != null ? ppg1.toFixed(1) : "—",
      team2Val: ppg2 != null ? ppg2.toFixed(1) : "—",
      team1Better: (ppg1 ?? 0) > (ppg2 ?? 0),
    },
    {
      label: "eFG%",
      team1Val: formatStatPct(r1.off_efg_pct),
      team2Val: formatStatPct(r2.off_efg_pct),
      team1Better: (r1.off_efg_pct ?? 0) > (r2.off_efg_pct ?? 0),
    },
    {
      label: "3PT%",
      team1Val:
        s1?.three_pt_pct != null
          ? `${s1.three_pt_pct.toFixed(1)}%`
          : formatPct(r1.pct_3pt),
      team2Val:
        s2?.three_pt_pct != null
          ? `${s2.three_pt_pct.toFixed(1)}%`
          : formatPct(r2.pct_3pt),
      team1Better:
        (s1?.three_pt_pct ?? r1.pct_3pt ?? 0) >
        (s2?.three_pt_pct ?? r2.pct_3pt ?? 0),
    },
    {
      label: "FT%",
      team1Val: s1?.ft_pct != null ? formatStatPct(s1.ft_pct) : "—",
      team2Val: s2?.ft_pct != null ? formatStatPct(s2.ft_pct) : "—",
      team1Better: (s1?.ft_pct ?? 0) > (s2?.ft_pct ?? 0),
    },
    {
      label: "Turnovers/G",
      team1Val: s1?.avg_turnovers != null ? s1.avg_turnovers.toFixed(1) : "—",
      team2Val: s2?.avg_turnovers != null ? s2.avg_turnovers.toFixed(1) : "—",
      team1Better: (s1?.avg_turnovers ?? 999) < (s2?.avg_turnovers ?? 999),
    },
    {
      label: "Off. Reb/G",
      team1Val:
        s1?.avg_off_rebounds != null ? s1.avg_off_rebounds.toFixed(1) : "—",
      team2Val:
        s2?.avg_off_rebounds != null ? s2.avg_off_rebounds.toFixed(1) : "—",
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

export function MatchupSheet({
  game,
  currentPick,
  onClose,
}: MatchupSheetProps) {
  const [fullGame, setFullGame] = useState<GameWithTeams | null>(null);
  const [stats1, setStats1] = useState<TeamSeasonStats | null>(null);
  const [stats2, setStats2] = useState<TeamSeasonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("matchup");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function load() {
      try {
        const g = (await getGameById(supabase, game.id)) as GameWithTeams;
        setFullGame(g);

        const [s1, s2] = await Promise.all([
          g.team1 ? getTeamSeasonStats(supabase, g.team1.id) : null,
          g.team2 ? getTeamSeasonStats(supabase, g.team2.id) : null,
        ]);
        setStats1(s1 as TeamSeasonStats | null);
        setStats2(s2 as TeamSeasonStats | null);
      } catch (err) {
        // silently handle load failure
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [game.id]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close with animation
  function handleClose() {
    setClosing(true);
    setTimeout(() => onClose(), 200);
  }

  const team1 = fullGame?.team1;
  const team2 = fullGame?.team2;
  const r1 = team1 ? getLatestRating(team1.kenpom_ratings) : null;
  const r2 = team2 ? getLatestRating(team2.kenpom_ratings) : null;

  const winProb =
    getWinProbFromOdds(fullGame?.betting_odds) ??
    (r1?.adj_em != null && r2?.adj_em != null
      ? getWinProbability(r1.adj_em, r2.adj_em)
      : null);

  const statRows = buildStatRows(r1, r2, stats1, stats2);
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

  const tabs: { id: TabId; label: string }[] = [
    { id: "matchup", label: "Matchup" },
    { id: "team1", label: team1?.name ?? "Team 1" },
    { id: "team2", label: team2?.name ?? "Team 2" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className={`flex-1 bg-black/30 transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />

      {/* Sheet panel */}
      <div
        className={`flex h-full w-full flex-col bg-bg-base shadow-xl sm:w-[480px] ${
          closing ? "sheet-exit" : "sheet-enter"
        }`}
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-text-primary">
              Matchup Details
            </h2>
            <p className="truncate text-xs text-text-muted">
              {game.round_name}
              {game.region ? ` — ${game.region} Region` : ""}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="ml-3 shrink-0 rounded-[var(--radius-sm)] p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        {!loading && team1 && team2 && (
          <div className="flex shrink-0 gap-1 border-b border-border-subtle px-5 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-accent-blue text-white"
                    : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
            </div>
          ) : !team1 || !team2 ? (
            <p className="py-12 text-center text-text-muted">
              Teams not yet determined for this game.
            </p>
          ) : activeTab === "matchup" ? (
            <>
              {/* Team Header + Win Probability */}
              <div className="mb-6 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 text-center">
                    <TeamBadge team={team1} size="lg" showRecord />
                  </div>
                  <div className="shrink-0 text-xs font-medium text-text-muted">
                    VS
                  </div>
                  <div className="flex-1 text-center">
                    <TeamBadge team={team2} size="lg" showRecord />
                  </div>
                </div>

                {winProb !== null && (
                  <div className="mt-5">
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
                        style={{
                          width: `${(winProb * 100).toFixed(1)}%`,
                        }}
                      />
                      <div
                        className="rounded-r-full bg-accent-amber transition-all"
                        style={{
                          width: `${((1 - winProb) * 100).toFixed(1)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stat Comparison Table */}
              {statRows.length > 0 && (
                <section className="mb-6">
                  <SectionHeader
                    title="Statistical Comparison"
                    subtitle="KenPom ratings & season stats"
                  />
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-bg-surface">
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary">
                            {team1.name}
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-medium text-text-muted">
                            Stat
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium text-text-primary">
                            {team2.name}
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
                              className={`px-3 py-2 text-left font-mono text-sm ${
                                row.team1Better
                                  ? "font-bold text-accent-green"
                                  : "text-text-secondary"
                              }`}
                            >
                              {row.team1Val}
                            </td>
                            <td className="px-3 py-2 text-center text-[11px] font-medium uppercase text-text-muted">
                              {row.label}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono text-sm ${
                                !row.team1Better
                                  ? "font-bold text-accent-green"
                                  : "text-text-secondary"
                              }`}
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

              {/* Starting Five — stacked vertically */}
              {(starters1.length > 0 || starters2.length > 0) && (
                <section className="mb-6">
                  <SectionHeader
                    title="Projected Starting 5"
                    subtitle="Top players by minutes played"
                  />
                  <div className="flex flex-col gap-3">
                    {[
                      { team: team1, starters: starters1 },
                      { team: team2, starters: starters2 },
                    ].map(({ team, starters }) =>
                      starters.length > 0 ? (
                        <div
                          key={team.id}
                          className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle"
                        >
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border-subtle bg-bg-elevated text-left text-xs uppercase text-text-muted">
                                <th className="px-3 py-2" colSpan={5}>
                                  {team.name}
                                </th>
                              </tr>
                              <tr className="border-b border-border-subtle bg-bg-elevated text-left text-xs uppercase text-text-muted">
                                <th className="px-3 py-2">Player</th>
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
                                  className="border-b border-border-subtle bg-bg-surface"
                                >
                                  <td className="px-3 py-2 font-medium text-text-primary">
                                    {p.name}
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

              {/* Upset Factors — single column */}
              {upsetFactors.length > 0 && (
                <section className="mb-6">
                  <SectionHeader
                    title="Upset Factors"
                    subtitle="Key variables that could swing this matchup"
                  />
                  <div className="flex flex-col gap-3">
                    {upsetFactors.map((factor) => (
                      <UpsetFactorCard
                        key={factor.id}
                        factor={factor}
                        team1Name={team1.name}
                        team2Name={team2.name}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Betting Lines */}
              {fullGame.betting_odds && fullGame.betting_odds.length > 0 && (
                <section className="mb-6">
                  <SectionHeader
                    title="Betting Lines"
                    subtitle="Latest odds from sportsbooks"
                  />
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-bg-surface">
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted">
                            Book
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-medium text-text-muted">
                            Spread
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-medium text-text-muted">
                            ML
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-medium text-text-muted">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fullGame.betting_odds.map((odds) => (
                          <tr
                            key={odds.id}
                            className="border-b border-border-subtle"
                          >
                            <td className="px-3 py-2.5 font-medium text-text-primary">
                              {odds.bookmaker}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {odds.spread_team1 != null && (
                                <span className="font-mono text-text-secondary">
                                  {team1.abbreviation}{" "}
                                  {formatOdds(odds.spread_team1)}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex justify-center gap-2">
                                {odds.ml_team1 != null && (
                                  <OddsChip
                                    odds={odds.ml_team1}
                                    label={team1.abbreviation}
                                  />
                                )}
                                {odds.ml_team2 != null && (
                                  <OddsChip
                                    odds={odds.ml_team2}
                                    label={team2.abbreviation}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
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
            </>
          ) : (
            /* Team tab placeholder */
            <div className="flex flex-col items-center gap-4 py-16">
              <TeamBadge
                team={activeTab === "team1" ? team1 : team2}
                size="lg"
                showRecord
              />
              <p className="text-sm text-text-muted">
                Team report coming soon
              </p>
            </div>
          )}
        </div>

        {/* Current pick indicator */}
        {currentPick && team1 && team2 && !loading && (
          <div className="shrink-0 border-t border-border-subtle bg-bg-base px-5 py-3">
            <p className="text-center text-xs text-text-muted">
              Your pick:{" "}
              <span className="font-semibold text-accent-blue">
                {currentPick === team1.id ? team1.name : team2.name}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
