import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getTeamBySlug } from "@/lib/queries/teams";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { D1_AVERAGES } from "@/lib/constants/d1-averages";
import {
  formatRecord,
  formatEfficiency,
  formatRank,
  formatSignedNumber,
  formatPct,
  formatStatPct,
} from "@/lib/utils/format";
import { computeTeamUpsetProfile } from "@/lib/utils/upset-factors";
import { UpsetProfileSection } from "@/components/teams/UpsetProfileSection";
import type { TeamDetail } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function getDelta(
  value: number | null | undefined,
  avg: number,
  higherIsBetter: boolean,
  format: "fixed1" | "pct" = "fixed1",
) {
  if (value == null) return null;
  const d = value - avg;
  const text =
    format === "pct"
      ? `${d > 0 ? "+" : ""}${d.toFixed(1)}%`
      : `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
  const good = higherIsBetter ? d > 0 : d < 0;
  const color =
    Math.abs(d) < 0.05
      ? "text-text-muted"
      : good
        ? "text-accent-green"
        : "text-accent-red";
  return { text, color };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();

  let team: TeamDetail;
  try {
    team = (await getTeamBySlug(supabase, slug)) as TeamDetail;
  } catch {
    notFound();
  }

  const rating = team.kenpom_ratings?.[0];
  const seasonStats = team.team_season_stats?.[0];
  const players = team.kenpom_players ?? [];
  const history = team.kenpom_program_history ?? [];
  const travel = team.team_travel ?? [];

  // Derive approximate scoring from KenPom when season stats aren't available
  const estimatedPpg =
    seasonStats?.ppg ??
    (rating?.adj_o != null && rating?.adj_t != null
      ? Math.round((rating.adj_o / 100) * rating.adj_t * 10) / 10
      : null);
  const estimatedOppPpg =
    seasonStats?.opp_ppg ??
    (rating?.adj_d != null && rating?.adj_t != null
      ? Math.round((rating.adj_d / 100) * rating.adj_t * 10) / 10
      : null);
  const estimatedMargin =
    seasonStats?.avg_margin ??
    (estimatedPpg != null && estimatedOppPpg != null
      ? Math.round((estimatedPpg - estimatedOppPpg) * 10) / 10
      : null);
  const hasScoring = estimatedPpg != null;

  const gradientColor = team.primary_color ?? "#3b82f6";

  // Efficiency stat definitions
  const offenseStats = [
    { label: "Effective FG%", value: seasonStats?.efg_pct, avg: D1_AVERAGES.efg_pct, format: "pct" as const, higher: true },
    { label: "Turnovers/Game", value: seasonStats?.avg_turnovers, avg: D1_AVERAGES.avg_turnovers, format: "fixed1" as const, higher: false },
    { label: "Off. Rebounds/Game", value: seasonStats?.avg_off_rebounds, avg: D1_AVERAGES.avg_off_rebounds, format: "fixed1" as const, higher: true },
    { label: "Free Throw %", value: seasonStats?.ft_pct, avg: D1_AVERAGES.ft_pct, format: "pct" as const, higher: true },
    { label: "3PA/Game", value: seasonStats?.avg_3pa, avg: D1_AVERAGES.avg_3pa, format: "fixed1" as const, higher: true },
    { label: "3PM/Game", value: seasonStats?.avg_3pm, avg: D1_AVERAGES.avg_3pm, format: "fixed1" as const, higher: true },
    { label: "3-Point %", value: seasonStats?.three_pt_pct, avg: D1_AVERAGES.three_pt_pct, format: "pct" as const, higher: true },
  ];
  const defenseStats = [
    { label: "Opp eFG%", value: rating?.def_efg_pct, avg: D1_AVERAGES.def_efg_pct, format: "pct" as const, higher: false },
    { label: "Assists/Game", value: seasonStats?.avg_assists, avg: D1_AVERAGES.avg_assists, format: "fixed1" as const, higher: true },
    { label: "Steals/Game", value: seasonStats?.avg_steals, avg: D1_AVERAGES.avg_steals, format: "fixed1" as const, higher: true },
    { label: "Blocks/Game", value: seasonStats?.avg_blocks, avg: D1_AVERAGES.avg_blocks, format: "fixed1" as const, higher: true },
  ];

  // Half-time splits for scoring section
  const halfTimeStats = [
    { label: "1st Half PPG", value: seasonStats?.first_half_ppg ?? null, avg: D1_AVERAGES.first_half_ppg, higher: true },
    { label: "2nd Half PPG", value: seasonStats?.second_half_ppg ?? null, avg: D1_AVERAGES.second_half_ppg, higher: true },
    { label: "Opp 1st Half PPG", value: seasonStats?.opp_first_half_ppg ?? null, avg: D1_AVERAGES.opp_first_half_ppg, higher: false },
  ];

  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      {/* Hero */}
      <section
        className="mb-8 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle p-6 md:p-10"
        style={{
          background: `linear-gradient(135deg, ${gradientColor}22 0%, var(--bg-surface) 60%)`,
        }}
      >
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={team.name}
              width={120}
              height={120}
              className="shrink-0"
            />
          ) : (
            <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full bg-bg-elevated text-3xl font-bold text-text-muted">
              {team.abbreviation}
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-bg-elevated px-2 py-0.5 font-mono text-xs font-medium text-text-secondary">
                {team.region} Region
              </span>
              <span className="rounded bg-bg-elevated px-2 py-0.5 font-mono text-xs font-medium text-accent-blue">
                #{team.seed} Seed
              </span>
            </div>
            <h1 className="mb-1 text-3xl font-bold text-text-primary">
              {team.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span>{team.conference}</span>
              <span className="text-border-subtle">|</span>
              <span>{formatRecord(team.record_wins, team.record_losses)}</span>
              {team.coach && (
                <>
                  <span className="text-border-subtle">|</span>
                  <span>Coach: {team.coach}{team.coach_tenure_years != null && ` (${team.coach_tenure_years} yr${team.coach_tenure_years !== 1 ? "s" : ""})`}</span>
                </>
              )}
            </div>
            {team.ncaa_titles > 0 && (
              <p className="mt-2 text-xs text-text-muted">
                {team.ncaa_titles} NCAA Title
                {team.ncaa_titles > 1 ? "s" : ""}{" "}
                &middot; {team.tournament_appearances} Tournament Appearances
                {team.last_title_year && ` \u00b7 Last Title: ${team.last_title_year}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* KenPom Ratings — single panel */}
      {rating && (
        <section className="mb-8">
          <SectionHeader
            title="KenPom Ratings"
            subtitle={`Season ${rating.season}`}
          />
          <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6 md:p-8">
            {/* Hero rank */}
            <div className="mb-6 text-center">
              <p className="font-mono text-5xl font-bold text-accent-blue">
                {formatRank(rating.kenpom_rank)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">Overall Rank</p>
            </div>
            {/* Sub-stats */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { label: "Adj. Offense", value: formatEfficiency(rating.adj_o), rank: rating.adj_o_rank },
                { label: "Adj. Defense", value: formatEfficiency(rating.adj_d), rank: rating.adj_d_rank },
                { label: "Adj. Tempo", value: formatEfficiency(rating.adj_t), rank: rating.adj_t_rank },
                { label: "Strength of Schedule", value: formatSignedNumber(rating.sos_adj_em), rank: rating.sos_adj_em_rank },
              ].map((s) => (
                <div key={s.label}>
                  <p className="stat-label mb-1">{s.label}</p>
                  <p className="font-mono text-2xl font-bold text-text-primary">
                    {s.value}
                  </p>
                  {s.rank != null && (
                    <p className="text-xs text-text-muted">
                      #{s.rank} of 364
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* March Factors */}
      {rating && (
        <UpsetProfileSection
          profile={computeTeamUpsetProfile(team, rating, players)}
          threesPerGame={
            estimatedPpg != null && rating.pct_3pt != null
              ? (estimatedPpg * rating.pct_3pt) / 3
              : null
          }
        />
      )}

      {/* Scoring Overview — single panel */}
      {hasScoring && (
        <section className="mb-8">
          <SectionHeader
            title="Scoring Overview"
            subtitle={
              seasonStats?.games_played
                ? `Season averages across ${seasonStats.games_played} games`
                : "Estimated from KenPom efficiency ratings"
            }
          />
          <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6 md:p-8">
            {/* Top row: PPG, Opp PPG, Margin */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Points Per Game", value: estimatedPpg, avg: D1_AVERAGES.ppg, higher: true },
                { label: "Opp Points Per Game", value: estimatedOppPpg, avg: D1_AVERAGES.opp_ppg, higher: false },
                { label: "Scoring Margin", value: estimatedMargin, avg: D1_AVERAGES.avg_margin, higher: true },
              ].map((s) => {
                const delta = getDelta(s.value, s.avg, s.higher);
                return (
                  <div key={s.label}>
                    <p className="stat-label mb-1">{s.label}</p>
                    <p className="font-mono text-3xl font-bold text-text-primary md:text-4xl">
                      {s.value != null ? s.value.toFixed(1) : "—"}
                    </p>
                    {delta && (
                      <p className={`mt-1 font-mono text-sm ${delta.color}`}>
                        {delta.text} vs D1 avg
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Half-time splits */}
            {halfTimeStats.some((s) => s.value != null) && (
              <>
                <div className="mt-6 border-t border-border-subtle pt-4">
                  {halfTimeStats.map((s) => {
                    const delta = getDelta(s.value, s.avg, s.higher);
                    return (
                      <div
                        key={s.label}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-text-secondary">{s.label}</span>
                        <span className="font-mono text-sm font-medium text-text-primary">
                          {s.value != null ? s.value.toFixed(1) : "—"}
                          {delta && (
                            <span className={`ml-2 ${delta.color}`}>
                              ({delta.text})
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Efficiency Breakdown — single panel with stat rows */}
      {seasonStats?.efg_pct != null && (
        <section className="mb-8">
          <SectionHeader
            title="Efficiency Breakdown"
            subtitle="Season stats vs D1 average"
          />
          <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6 md:p-8">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Offense
            </h3>
            {offenseStats.map((s, i) => {
              const delta = getDelta(s.value, s.avg, s.higher, s.format);
              return (
                <div
                  key={s.label}
                  className={`flex items-center justify-between py-3 ${i < offenseStats.length - 1 ? "border-b border-border-subtle" : ""}`}
                >
                  <span className="text-sm text-text-secondary">{s.label}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-text-primary">
                      {s.value != null
                        ? s.format === "pct"
                          ? `${s.value.toFixed(1)}%`
                          : s.value.toFixed(1)
                        : "—"}
                    </span>
                    {delta && (
                      <span className={`font-mono text-xs ${delta.color}`}>
                        {delta.text}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}

            <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Defense
            </h3>
            {defenseStats.map((s, i) => {
              const delta = getDelta(s.value, s.avg, s.higher, s.format);
              return (
                <div
                  key={s.label}
                  className={`flex items-center justify-between py-3 ${i < defenseStats.length - 1 ? "border-b border-border-subtle" : ""}`}
                >
                  <span className="text-sm text-text-secondary">{s.label}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-text-primary">
                      {s.value != null
                        ? s.format === "pct"
                          ? `${s.value.toFixed(1)}%`
                          : s.value.toFixed(1)
                        : "—"}
                    </span>
                    {delta && (
                      <span className={`font-mono text-xs ${delta.color}`}>
                        {delta.text}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Players Table */}
      {players.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Roster"
            subtitle="Key player metrics from KenPom"
          />
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated text-left text-xs uppercase text-text-muted">
                  <th className="px-4 py-3">Player</th>
                  <th className="px-3 py-3">Pos</th>
                  <th className="px-3 py-3">Ht</th>
                  <th className="px-3 py-3">Yr</th>
                  <th className="px-3 py-3 text-right">MPG</th>
                  <th className="px-3 py-3 text-right">PPG</th>
                  <th className="px-3 py-3 text-right">RPG</th>
                  <th className="px-3 py-3 text-right">APG</th>
                  <th className="px-3 py-3 text-right">ORtg</th>
                  <th className="px-3 py-3 text-right">Usg%</th>
                  <th className="px-3 py-3 text-right">eFG%</th>
                </tr>
              </thead>
              <tbody>
                {players
                  .sort(
                    (a, b) => (b.minutes_pct ?? 0) - (a.minutes_pct ?? 0),
                  )
                  .map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-border-subtle bg-bg-surface transition-colors hover:bg-bg-hover"
                    >
                      <td className="px-4 py-2.5 font-medium text-text-primary">
                        {player.name}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {player.position ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {player.height ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {player.year_class ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">
                        {player.minutes_pct != null
                          ? (player.minutes_pct * 0.4).toFixed(1)
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-primary">
                        {formatEfficiency(player.ppg)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">
                        {formatEfficiency(player.rpg)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">
                        {formatEfficiency(player.apg)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">
                        {formatEfficiency(player.off_rtg)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">
                        {formatStatPct(player.usg_pct)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-text-secondary">
                        {formatStatPct(player.efg_pct)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Program History */}
      {history.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Program History"
            subtitle="Recent tournament performance"
          />
          <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6">
            {/* Placeholder for chart visualization */}
            <div className="mb-4 flex h-48 items-center justify-center rounded bg-bg-elevated text-sm text-text-muted">
              KenPom ranking trend chart coming soon
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-xs uppercase text-text-muted">
                    <th className="px-3 py-2">Season</th>
                    <th className="px-3 py-2 text-right">KenPom</th>
                    <th className="px-3 py-2 text-right">AdjEM</th>
                    <th className="px-3 py-2">Record</th>
                    <th className="px-3 py-2 text-right">Seed</th>
                    <th className="px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .sort((a, b) => b.season - a.season)
                    .map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-border-subtle transition-colors hover:bg-bg-hover"
                      >
                        <td className="px-3 py-2 font-medium text-text-primary">
                          {h.season}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-accent-blue">
                          {formatRank(h.kenpom_rank)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary">
                          {formatSignedNumber(h.adj_em)}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {h.record ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary">
                          {h.tournament_seed ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {h.tournament_result ?? "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Travel Info — single panel with rows */}
      {travel.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="Travel Information"
            subtitle="Distance and logistics for tournament games"
          />
          <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6 md:p-8">
            <div className="divide-y divide-border-subtle">
              {travel.map((t) => (
                <div key={t.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {t.games?.venue_name ?? "TBD Venue"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t.games?.venue_city}
                      {t.games?.venue_state ? `, ${t.games.venue_state}` : ""}
                    </p>
                    {t.travel_notes && (
                      <p className="mt-1 text-xs italic text-text-muted">
                        {t.travel_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {t.distance_miles != null && (
                      <span>
                        <span className="text-text-muted">Distance: </span>
                        <span className="font-mono text-text-primary">
                          {Math.round(t.distance_miles)} mi
                        </span>
                      </span>
                    )}
                    {t.timezone_changes != null && t.timezone_changes > 0 && (
                      <span>
                        <span className="text-text-muted">TZ Change: </span>
                        <span className="font-mono text-accent-amber">
                          {t.timezone_changes}hr
                        </span>
                      </span>
                    )}
                    <span>
                      <span className="text-text-muted">Flight: </span>
                      <span
                        className={
                          t.flight_required
                            ? "text-accent-amber"
                            : "text-accent-green"
                        }
                      >
                        {t.flight_required ? "Yes" : "No"}
                      </span>
                    </span>
                    {t.is_home_state && (
                      <span className="text-accent-green">Home State</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
