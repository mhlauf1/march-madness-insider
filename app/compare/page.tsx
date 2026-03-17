"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TeamBadge } from "@/components/ui/TeamBadge";
import {
  formatEfficiency,
  formatStatPct,
  formatDecimalPct,
  formatRank,
  formatSignedNumber,
  formatRecord,
} from "@/lib/utils/format";
import {
  getWinProbability,
  formatProbability,
} from "@/lib/utils/probability";
import type { Team, KenpomRatings, TeamSeasonStats } from "@/lib/types";

interface TeamWithRatings extends Team {
  kenpom_ratings: KenpomRatings[];
  team_season_stats: TeamSeasonStats[];
}

function getLatestRating(ratings: KenpomRatings[]): KenpomRatings | null {
  if (!ratings || ratings.length === 0) return null;
  return ratings.reduce((a, b) => (a.season > b.season ? a : b));
}

interface ComparisonRow {
  label: string;
  team1Val: string;
  team2Val: string;
  team1Better: boolean;
}

function getLatestSeasonStats(stats: TeamSeasonStats[]): TeamSeasonStats | null {
  if (!stats || stats.length === 0) return null;
  return stats.reduce((a, b) => (a.season > b.season ? a : b));
}

interface ComparisonSection {
  title: string;
  rows: ComparisonRow[];
}

function buildComparison(
  r1: KenpomRatings | null,
  r2: KenpomRatings | null,
  s1: TeamSeasonStats | null,
  s2: TeamSeasonStats | null,
  t1: Team | null,
  t2: Team | null,
): ComparisonSection[] {
  if (!r1 || !r2) return [];

  const fmtStat = (val: number | null) => (val != null ? val.toFixed(1) : "—");

  return [
    {
      title: "Overview",
      rows: [
        {
          label: "Record",
          team1Val: formatRecord(t1?.record_wins ?? null, t1?.record_losses ?? null),
          team2Val: formatRecord(t2?.record_wins ?? null, t2?.record_losses ?? null),
          team1Better: (t1?.record_wins ?? 0) / Math.max((t1?.record_wins ?? 0) + (t1?.record_losses ?? 1), 1) >
                       (t2?.record_wins ?? 0) / Math.max((t2?.record_wins ?? 0) + (t2?.record_losses ?? 1), 1),
        },
        {
          label: "KenPom Rank",
          team1Val: formatRank(r1.kenpom_rank),
          team2Val: formatRank(r2.kenpom_rank),
          team1Better: (r1.kenpom_rank ?? 999) < (r2.kenpom_rank ?? 999),
        },
        {
          label: "Adj. Efficiency Margin",
          team1Val: formatSignedNumber(r1.adj_em),
          team2Val: formatSignedNumber(r2.adj_em),
          team1Better: (r1.adj_em ?? -999) > (r2.adj_em ?? -999),
        },
        {
          label: "Points Per Game",
          team1Val: fmtStat(s1?.ppg ?? null),
          team2Val: fmtStat(s2?.ppg ?? null),
          team1Better: (s1?.ppg ?? 0) > (s2?.ppg ?? 0),
        },
        {
          label: "Opp. Points Per Game",
          team1Val: fmtStat(s1?.opp_ppg ?? null),
          team2Val: fmtStat(s2?.opp_ppg ?? null),
          team1Better: (s1?.opp_ppg ?? 999) < (s2?.opp_ppg ?? 999),
        },
        {
          label: "Avg. Margin of Victory",
          team1Val: s1?.avg_margin != null ? formatSignedNumber(s1.avg_margin) : "—",
          team2Val: s2?.avg_margin != null ? formatSignedNumber(s2.avg_margin) : "—",
          team1Better: (s1?.avg_margin ?? -999) > (s2?.avg_margin ?? -999),
        },
      ],
    },
    {
      title: "Offense",
      rows: [
        {
          label: "Adj. Offense",
          team1Val: formatEfficiency(r1.adj_o),
          team2Val: formatEfficiency(r2.adj_o),
          team1Better: (r1.adj_o ?? 0) > (r2.adj_o ?? 0),
        },
        {
          label: "Effective FG%",
          team1Val: formatDecimalPct(r1.off_efg_pct),
          team2Val: formatDecimalPct(r2.off_efg_pct),
          team1Better: (r1.off_efg_pct ?? 0) > (r2.off_efg_pct ?? 0),
        },
        {
          label: "Turnover %",
          team1Val: formatDecimalPct(r1.off_to_pct),
          team2Val: formatDecimalPct(r2.off_to_pct),
          team1Better: (r1.off_to_pct ?? 999) < (r2.off_to_pct ?? 999),
        },
        {
          label: "Off. Rebound %",
          team1Val: formatDecimalPct(r1.off_or_pct),
          team2Val: formatDecimalPct(r2.off_or_pct),
          team1Better: (r1.off_or_pct ?? 0) > (r2.off_or_pct ?? 0),
        },
        {
          label: "Free Throw Rate",
          team1Val: formatDecimalPct(r1.off_ftr),
          team2Val: formatDecimalPct(r2.off_ftr),
          team1Better: (r1.off_ftr ?? 0) > (r2.off_ftr ?? 0),
        },
        {
          label: "Tempo",
          team1Val: formatEfficiency(r1.adj_t),
          team2Val: formatEfficiency(r2.adj_t),
          team1Better: (r1.adj_t ?? 0) > (r2.adj_t ?? 0),
        },
      ],
    },
    {
      title: "Shooting",
      rows: [
        {
          label: "3-Point %",
          team1Val: s1?.three_pt_pct != null ? formatStatPct(s1.three_pt_pct) : "—",
          team2Val: s2?.three_pt_pct != null ? formatStatPct(s2.three_pt_pct) : "—",
          team1Better: (s1?.three_pt_pct ?? 0) > (s2?.three_pt_pct ?? 0),
        },
        {
          label: "3PM Per Game",
          team1Val: fmtStat(s1?.avg_3pm ?? null),
          team2Val: fmtStat(s2?.avg_3pm ?? null),
          team1Better: (s1?.avg_3pm ?? 0) > (s2?.avg_3pm ?? 0),
        },
        {
          label: "3PA Per Game",
          team1Val: fmtStat(s1?.avg_3pa ?? null),
          team2Val: fmtStat(s2?.avg_3pa ?? null),
          team1Better: (s1?.avg_3pa ?? 0) > (s2?.avg_3pa ?? 0),
        },
        {
          label: "Free Throw %",
          team1Val: s1?.ft_pct != null ? formatStatPct(s1.ft_pct) : "—",
          team2Val: s2?.ft_pct != null ? formatStatPct(s2.ft_pct) : "—",
          team1Better: (s1?.ft_pct ?? 0) > (s2?.ft_pct ?? 0),
        },
        {
          label: "FTA Per Game",
          team1Val: fmtStat(s1?.avg_fta ?? null),
          team2Val: fmtStat(s2?.avg_fta ?? null),
          team1Better: (s1?.avg_fta ?? 0) > (s2?.avg_fta ?? 0),
        },
      ],
    },
    {
      title: "Defense",
      rows: [
        {
          label: "Adj. Defense",
          team1Val: formatEfficiency(r1.adj_d),
          team2Val: formatEfficiency(r2.adj_d),
          team1Better: (r1.adj_d ?? 999) < (r2.adj_d ?? 999),
        },
        {
          label: "Opp. Effective FG%",
          team1Val: formatDecimalPct(r1.def_efg_pct),
          team2Val: formatDecimalPct(r2.def_efg_pct),
          team1Better: (r1.def_efg_pct ?? 999) < (r2.def_efg_pct ?? 999),
        },
        {
          label: "Forced Turnover %",
          team1Val: formatDecimalPct(r1.def_to_pct),
          team2Val: formatDecimalPct(r2.def_to_pct),
          team1Better: (r1.def_to_pct ?? 0) > (r2.def_to_pct ?? 0),
        },
        {
          label: "Opp. Off. Rebound %",
          team1Val: formatDecimalPct(r1.def_or_pct),
          team2Val: formatDecimalPct(r2.def_or_pct),
          team1Better: (r1.def_or_pct ?? 999) < (r2.def_or_pct ?? 999),
        },
        {
          label: "Opp. Free Throw Rate",
          team1Val: formatDecimalPct(r1.def_ftr),
          team2Val: formatDecimalPct(r2.def_ftr),
          team1Better: (r1.def_ftr ?? 999) < (r2.def_ftr ?? 999),
        },
      ],
    },
    {
      title: "Other",
      rows: [
        {
          label: "Avg Assists / Game",
          team1Val: fmtStat(s1?.avg_assists ?? null),
          team2Val: fmtStat(s2?.avg_assists ?? null),
          team1Better: (s1?.avg_assists ?? 0) > (s2?.avg_assists ?? 0),
        },
        {
          label: "Avg Steals / Game",
          team1Val: fmtStat(s1?.avg_steals ?? null),
          team2Val: fmtStat(s2?.avg_steals ?? null),
          team1Better: (s1?.avg_steals ?? 0) > (s2?.avg_steals ?? 0),
        },
        {
          label: "Avg Blocks / Game",
          team1Val: fmtStat(s1?.avg_blocks ?? null),
          team2Val: fmtStat(s2?.avg_blocks ?? null),
          team1Better: (s1?.avg_blocks ?? 0) > (s2?.avg_blocks ?? 0),
        },
        {
          label: "Avg Turnovers / Game",
          team1Val: fmtStat(s1?.avg_turnovers ?? null),
          team2Val: fmtStat(s2?.avg_turnovers ?? null),
          team1Better: (s1?.avg_turnovers ?? 999) < (s2?.avg_turnovers ?? 999),
        },
        {
          label: "Avg Off. Rebounds / Game",
          team1Val: fmtStat(s1?.avg_off_rebounds ?? null),
          team2Val: fmtStat(s2?.avg_off_rebounds ?? null),
          team1Better: (s1?.avg_off_rebounds ?? 0) > (s2?.avg_off_rebounds ?? 0),
        },
        {
          label: "Strength of Schedule",
          team1Val: r1.sos_adj_em != null ? formatSignedNumber(r1.sos_adj_em) : "—",
          team2Val: r2.sos_adj_em != null ? formatSignedNumber(r2.sos_adj_em) : "—",
          team1Better: (r1.sos_adj_em ?? -999) > (r2.sos_adj_em ?? -999),
        },
        {
          label: "Luck",
          team1Val: r1.luck != null ? formatSignedNumber(r1.luck) : "—",
          team2Val: r2.luck != null ? formatSignedNumber(r2.luck) : "—",
          team1Better: (r1.luck ?? -999) > (r2.luck ?? -999),
        },
      ],
    },
  ];
}

export default function ComparePage() {
  const [teams, setTeams] = useState<TeamWithRatings[]>([]);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [team1, setTeam1] = useState<TeamWithRatings | null>(null);
  const [team2, setTeam2] = useState<TeamWithRatings | null>(null);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from("teams")
        .select("*, kenpom_ratings(*), team_season_stats(*)")
        .order("seed", { ascending: true });
      setTeams((data as TeamWithRatings[]) ?? []);
      setLoading(false);
    }
    fetchTeams();
  }, []);

  const filtered1 = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search1.toLowerCase()) ||
      t.full_name.toLowerCase().includes(search1.toLowerCase()),
  );

  const filtered2 = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search2.toLowerCase()) ||
      t.full_name.toLowerCase().includes(search2.toLowerCase()),
  );

  const r1 = team1 ? getLatestRating(team1.kenpom_ratings) : null;
  const r2 = team2 ? getLatestRating(team2.kenpom_ratings) : null;
  const s1 = team1 ? getLatestSeasonStats(team1.team_season_stats) : null;
  const s2 = team2 ? getLatestSeasonStats(team2.team_season_stats) : null;
  const sections = buildComparison(r1, r2, s1, s2, team1, team2);
  const winProb =
    r1?.adj_em != null && r2?.adj_em != null
      ? getWinProbability(r1.adj_em, r2.adj_em)
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Compare Teams
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Select two teams to see a head-to-head statistical breakdown
        </p>
      </div>

      {/* Team Selectors */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* Team 1 Selector */}
        <div className="relative">
          <label className="stat-label mb-2 block">Team 1</label>
          <button
            onClick={() => {
              setOpen1(!open1);
              setOpen2(false);
            }}
            className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-accent-blue/30"
          >
            {team1 ? (
              <TeamBadge team={team1} size="sm" />
            ) : (
              <span className="text-text-muted">Select a team...</span>
            )}
          </button>
          {open1 && (
            <div className="absolute z-20 mt-1 w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-elevated shadow-lg">
              <div className="border-b border-border-subtle p-2">
                <input
                  type="text"
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filtered1.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTeam1(t);
                      setOpen1(false);
                      setSearch1("");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-bg-hover"
                  >
                    <span className="font-mono text-xs text-text-muted">
                      ({t.seed})
                    </span>
                    <span className="font-medium text-text-primary">
                      {t.name}
                    </span>
                    <span className="text-xs text-text-muted">
                      {t.region}
                    </span>
                  </button>
                ))}
                {filtered1.length === 0 && (
                  <p className="px-4 py-3 text-sm text-text-muted">
                    No teams found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team 2 Selector */}
        <div className="relative">
          <label className="stat-label mb-2 block">Team 2</label>
          <button
            onClick={() => {
              setOpen2(!open2);
              setOpen1(false);
            }}
            className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-accent-blue/30"
          >
            {team2 ? (
              <TeamBadge team={team2} size="sm" />
            ) : (
              <span className="text-text-muted">Select a team...</span>
            )}
          </button>
          {open2 && (
            <div className="absolute z-20 mt-1 w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-elevated shadow-lg">
              <div className="border-b border-border-subtle p-2">
                <input
                  type="text"
                  value={search2}
                  onChange={(e) => setSearch2(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filtered2.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTeam2(t);
                      setOpen2(false);
                      setSearch2("");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-bg-hover"
                  >
                    <span className="font-mono text-xs text-text-muted">
                      ({t.seed})
                    </span>
                    <span className="font-medium text-text-primary">
                      {t.name}
                    </span>
                    <span className="text-xs text-text-muted">
                      {t.region}
                    </span>
                  </button>
                ))}
                {filtered2.length === 0 && (
                  <p className="px-4 py-3 text-sm text-text-muted">
                    No teams found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {team1 && team2 && sections.length > 0 && (
        <>
          {/* Win Probability */}
          {winProb !== null && (
            <div className="mb-8 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-surface p-6">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-text-muted">
                Projected Win Probability
              </p>
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-accent-blue">
                  {team1.name} {formatProbability(winProb)}
                </span>
                <span className="text-accent-amber">
                  {formatProbability(1 - winProb)} {team2.name}
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className="rounded-l-full bg-accent-blue transition-all"
                  style={{ width: `${(winProb * 100).toFixed(1)}%` }}
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

          {/* Stat Comparison Tables by Section */}
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <SectionHeader
                title={section.title}
              />
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-surface">
                      <th className="px-4 py-3 text-left font-medium text-text-primary">
                        {team1.name}
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-text-muted">
                        Stat
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-text-primary">
                        {team2.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row) => (
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
            </div>
          ))}
        </>
      )}

      {/* Empty state */}
      {(!team1 || !team2) && !loading && (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-12 text-center">
          <p className="text-sm text-text-muted">
            Select two teams above to see their head-to-head comparison
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-12 text-center">
          <p className="text-sm text-text-muted">Loading teams...</p>
        </div>
      )}
    </div>
  );
}
