"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import type { TeamWithFullStats } from "@/lib/types";
import {
  formatRank,
  formatEfficiency,
  formatPct,
  formatStatPct,
  formatSignedNumber,
  formatRecord,
} from "@/lib/utils/format";
import { getExperienceLabel } from "@/lib/utils/stats";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey =
  | "overview"
  | "kenpom"
  | "offense"
  | "defense"
  | "shooting"
  | "experience";
type SeedRange = "all" | "1-4" | "5-8" | "9-12" | "13-16";
type SortDir = "asc" | "desc";

interface ColumnDef {
  key: string;
  label: string;
  shortLabel?: string;
  getValue: (t: TeamWithFullStats) => number | string | null;
  format: (v: number | string | null) => string;
  defaultDir: SortDir;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const kr = (t: TeamWithFullStats) => t.kenpom_ratings?.[0];
const ss = (t: TeamWithFullStats) => t.team_season_stats?.[0];
const cf = (t: TeamWithFullStats) => t.championship_futures?.[0];

function seedInRange(seed: number, range: SeedRange): boolean {
  if (range === "all") return true;
  const [lo, hi] = range.split("-").map(Number);
  return seed >= lo && seed <= hi;
}

const fRank = (v: number | string | null) =>
  typeof v === "number" ? formatRank(v) : "—";
const fEff = (v: number | string | null) =>
  typeof v === "number" ? formatEfficiency(v) : "—";
const fPct = (v: number | string | null) =>
  typeof v === "number" ? formatPct(v) : "—";
const fSPct = (v: number | string | null) =>
  typeof v === "number" ? formatStatPct(v) : "—";
const fSigned = (v: number | string | null) =>
  typeof v === "number" ? formatSignedNumber(v) : "—";
const fStr = (v: number | string | null) => (v != null ? String(v) : "—");
const fOdds = (v: number | string | null) => {
  if (typeof v !== "number") return "—";
  if (v >= 0) return `+${v}`;
  return String(v);
};
const fBool = (v: number | string | null) =>
  v === 1 || v === "true" ? "Yes" : v === 0 || v === "false" ? "No" : "—";

// ---------------------------------------------------------------------------
// Column definitions per tab
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "kenpom", label: "KenPom" },
  { key: "offense", label: "Offense" },
  { key: "defense", label: "Defense" },
  { key: "shooting", label: "Shooting" },
  { key: "experience", label: "Experience" },
];

const COLUMNS: Record<TabKey, ColumnDef[]> = {
  overview: [
    { key: "seed", label: "Seed", getValue: (t) => t.seed, format: fStr, defaultDir: "asc" },
    { key: "record", label: "Record", getValue: (t) => (t.record_wins != null ? `${t.record_wins}-${t.record_losses}` : null), format: fStr, defaultDir: "desc" },
    { key: "kenpom_rank", label: "KenPom Rank", shortLabel: "KP Rk", getValue: (t) => kr(t)?.kenpom_rank ?? null, format: fRank, defaultDir: "asc" },
    { key: "adj_em", label: "AdjEM", getValue: (t) => kr(t)?.adj_em ?? null, format: fSigned, defaultDir: "desc" },
    { key: "ppg", label: "PPG", getValue: (t) => ss(t)?.ppg ?? null, format: fEff, defaultDir: "desc" },
    { key: "opp_ppg", label: "Opp PPG", getValue: (t) => ss(t)?.opp_ppg ?? null, format: fEff, defaultDir: "asc" },
    { key: "avg_margin", label: "Margin", getValue: (t) => ss(t)?.avg_margin ?? null, format: fSigned, defaultDir: "desc" },
    { key: "champ_odds", label: "Champ Odds", shortLabel: "Odds", getValue: (t) => cf(t)?.odds ?? null, format: fOdds, defaultDir: "asc" },
  ],
  kenpom: [
    { key: "kenpom_rank", label: "KenPom Rank", shortLabel: "KP Rk", getValue: (t) => kr(t)?.kenpom_rank ?? null, format: fRank, defaultDir: "asc" },
    { key: "adj_em", label: "AdjEM", getValue: (t) => kr(t)?.adj_em ?? null, format: fSigned, defaultDir: "desc" },
    { key: "adj_o", label: "AdjO", getValue: (t) => kr(t)?.adj_o ?? null, format: fEff, defaultDir: "desc" },
    { key: "adj_o_rank", label: "AdjO Rk", getValue: (t) => kr(t)?.adj_o_rank ?? null, format: fRank, defaultDir: "asc" },
    { key: "adj_d", label: "AdjD", getValue: (t) => kr(t)?.adj_d ?? null, format: fEff, defaultDir: "asc" },
    { key: "adj_d_rank", label: "AdjD Rk", getValue: (t) => kr(t)?.adj_d_rank ?? null, format: fRank, defaultDir: "asc" },
    { key: "adj_t", label: "Tempo", getValue: (t) => kr(t)?.adj_t ?? null, format: fEff, defaultDir: "desc" },
    { key: "luck", label: "Luck", getValue: (t) => kr(t)?.luck ?? null, format: fSigned, defaultDir: "desc" },
    { key: "sos_adj_em", label: "SOS", getValue: (t) => kr(t)?.sos_adj_em ?? null, format: fSigned, defaultDir: "desc" },
  ],
  offense: [
    { key: "ppg", label: "PPG", getValue: (t) => ss(t)?.ppg ?? null, format: fEff, defaultDir: "desc" },
    { key: "first_half_ppg", label: "1st Half PPG", shortLabel: "1H PPG", getValue: (t) => ss(t)?.first_half_ppg ?? null, format: fEff, defaultDir: "desc" },
    { key: "second_half_ppg", label: "2nd Half PPG", shortLabel: "2H PPG", getValue: (t) => ss(t)?.second_half_ppg ?? null, format: fEff, defaultDir: "desc" },
    { key: "off_efg_pct", label: "Off eFG%", getValue: (t) => kr(t)?.off_efg_pct ?? null, format: fPct, defaultDir: "desc" },
    { key: "off_ftr", label: "FT Rate", getValue: (t) => kr(t)?.off_ftr ?? null, format: fPct, defaultDir: "desc" },
    { key: "off_or_pct", label: "Off Reb%", getValue: (t) => kr(t)?.off_or_pct ?? null, format: fPct, defaultDir: "desc" },
    { key: "off_to_pct", label: "TO%", getValue: (t) => kr(t)?.off_to_pct ?? null, format: fPct, defaultDir: "asc" },
    { key: "avg_assists", label: "Assists", getValue: (t) => ss(t)?.avg_assists ?? null, format: fEff, defaultDir: "desc" },
    { key: "adj_o", label: "AdjO", getValue: (t) => kr(t)?.adj_o ?? null, format: fEff, defaultDir: "desc" },
  ],
  defense: [
    { key: "opp_ppg", label: "Opp PPG", getValue: (t) => ss(t)?.opp_ppg ?? null, format: fEff, defaultDir: "asc" },
    { key: "opp_first_half_ppg", label: "Opp 1st Half", shortLabel: "Opp 1H", getValue: (t) => ss(t)?.opp_first_half_ppg ?? null, format: fEff, defaultDir: "asc" },
    { key: "opp_second_half_ppg", label: "Opp 2nd Half", shortLabel: "Opp 2H", getValue: (t) => ss(t)?.opp_second_half_ppg ?? null, format: fEff, defaultDir: "asc" },
    { key: "def_efg_pct", label: "Def eFG%", getValue: (t) => kr(t)?.def_efg_pct ?? null, format: fPct, defaultDir: "asc" },
    { key: "def_ftr", label: "Def FT Rate", getValue: (t) => kr(t)?.def_ftr ?? null, format: fPct, defaultDir: "asc" },
    { key: "def_or_pct", label: "Def Reb%", getValue: (t) => kr(t)?.def_or_pct ?? null, format: fPct, defaultDir: "asc" },
    { key: "def_to_pct", label: "Def TO%", getValue: (t) => kr(t)?.def_to_pct ?? null, format: fPct, defaultDir: "desc" },
    { key: "avg_steals", label: "Steals", getValue: (t) => ss(t)?.avg_steals ?? null, format: fEff, defaultDir: "desc" },
    { key: "avg_blocks", label: "Blocks", getValue: (t) => ss(t)?.avg_blocks ?? null, format: fEff, defaultDir: "desc" },
    { key: "adj_d", label: "AdjD", getValue: (t) => kr(t)?.adj_d ?? null, format: fEff, defaultDir: "asc" },
  ],
  shooting: [
    { key: "efg_pct", label: "eFG%", getValue: (t) => ss(t)?.efg_pct ?? null, format: fSPct, defaultDir: "desc" },
    { key: "off_efg_pct", label: "Off eFG%", getValue: (t) => kr(t)?.off_efg_pct ?? null, format: fPct, defaultDir: "desc" },
    { key: "pct_2pt", label: "%Pts 2PT", getValue: (t) => kr(t)?.pct_2pt ?? null, format: fPct, defaultDir: "desc" },
    { key: "pct_3pt", label: "%Pts 3PT", getValue: (t) => kr(t)?.pct_3pt ?? null, format: fPct, defaultDir: "desc" },
    { key: "pct_ft", label: "%Pts FT", getValue: (t) => kr(t)?.pct_ft ?? null, format: fPct, defaultDir: "desc" },
    { key: "ft_pct", label: "FT%", getValue: (t) => ss(t)?.ft_pct ?? null, format: fSPct, defaultDir: "desc" },
    { key: "off_ftr", label: "FT Rate", getValue: (t) => kr(t)?.off_ftr ?? null, format: fPct, defaultDir: "desc" },
  ],
  experience: [
    { key: "experience_score", label: "Exp Score", getValue: (t) => t.experience_score, format: (v) => (typeof v === "number" ? v.toFixed(2) : "—"), defaultDir: "desc" },
    { key: "experience_label", label: "Experience", getValue: (t) => (t.experience_score != null ? getExperienceLabel(t.experience_score) : null), format: fStr, defaultDir: "desc" },
    { key: "coach", label: "Coach", getValue: (t) => t.coach, format: fStr, defaultDir: "asc" },
    { key: "coach_tenure", label: "Tenure", getValue: (t) => t.coach_tenure_years, format: (v) => (typeof v === "number" ? `${v} yr${v !== 1 ? "s" : ""}` : "—"), defaultDir: "desc" },
    { key: "coach_tourney_apps", label: "Coach Tourney Apps", shortLabel: "Coach Apps", getValue: (t) => t.coach_tournament_apps, format: fStr, defaultDir: "desc" },
    { key: "coach_first_year", label: "1st Yr Coach", getValue: (t) => (t.coach_is_first_year ? 1 : 0), format: fBool, defaultDir: "desc" },
    { key: "ncaa_titles", label: "NCAA Titles", getValue: (t) => t.ncaa_titles, format: fStr, defaultDir: "desc" },
    { key: "tourney_apps", label: "Tourney Apps", getValue: (t) => t.tournament_appearances, format: fStr, defaultDir: "desc" },
    { key: "conference", label: "Conference", getValue: (t) => t.conference, format: fStr, defaultDir: "asc" },
  ],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REGIONS = ["All", "East", "West", "Midwest", "South"] as const;
const SEED_RANGES: { label: string; value: SeedRange }[] = [
  { label: "All Seeds", value: "all" },
  { label: "1-4", value: "1-4" },
  { label: "5-8", value: "5-8" },
  { label: "9-12", value: "9-12" },
  { label: "13-16", value: "13-16" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StatsExplorerProps {
  teams: TeamWithFullStats[];
}

export function StatsExplorer({ teams }: StatsExplorerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [region, setRegion] = useState<string>("All");
  const [seedRange, setSeedRange] = useState<SeedRange>("all");
  const [conference, setConference] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("seed");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const conferences = useMemo(() => {
    const set = new Set(teams.map((t) => t.conference));
    return ["All", ...Array.from(set).sort()];
  }, [teams]);

  const columns = COLUMNS[activeTab];

  const filtered = useMemo(() => {
    let result = teams;

    if (region !== "All") {
      result = result.filter((t) => t.region === region);
    }
    if (seedRange !== "all") {
      result = result.filter((t) => seedInRange(t.seed, seedRange));
    }
    if (conference !== "All") {
      result = result.filter((t) => t.conference === conference);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.full_name.toLowerCase().includes(q) ||
          (t.coach && t.coach.toLowerCase().includes(q)),
      );
    }

    // Sort
    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      result = [...result].sort((a, b) => {
        const aVal = col.getValue(a);
        const bVal = col.getValue(b);
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        const diff = (aVal as number) - (bVal as number);
        return sortDir === "asc" ? diff : -diff;
      });
    }

    return result;
  }, [teams, region, seedRange, conference, searchQuery, sortKey, sortDir, columns]);

  function handleSort(colKey: string) {
    if (sortKey === colKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      const col = columns.find((c) => c.key === colKey);
      setSortKey(colKey);
      setSortDir(col?.defaultDir ?? "asc");
    }
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    // Reset sort to first column of new tab
    const firstCol = COLUMNS[tab][0];
    if (firstCol) {
      setSortKey(firstCol.key);
      setSortDir(firstCol.defaultDir);
    }
  }

  const selectClass =
    "rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue";

  return (
    <div>
      {/* Tab bar */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4">
        <div className="flex gap-1 border-b border-border-subtle">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-accent-blue text-accent-blue"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={selectClass}
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All Regions" : r}
            </option>
          ))}
        </select>

        <select
          value={seedRange}
          onChange={(e) => setSeedRange(e.target.value as SeedRange)}
          className={selectClass}
        >
          {SEED_RANGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={conference}
          onChange={(e) => setConference(e.target.value)}
          className={selectClass}
        >
          {conferences.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Conferences" : c}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className={`${selectClass} pl-8`}
          />
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-text-muted">
        Showing {filtered.length} of {teams.length} teams
      </p>

      {/* Stats table */}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface">
              {/* Sticky team column */}
              <th className="sticky left-0 z-10 bg-bg-surface px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Team
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.shortLabel ?? col.label}
                    {sortKey === col.key && (
                      sortDir === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((team) => (
              <tr
                key={team.id}
                className="border-b border-border-subtle transition-colors hover:bg-bg-hover"
              >
                {/* Sticky team cell */}
                <td className="sticky left-0 z-10 bg-bg-base px-3 py-2.5">
                  <Link
                    href={`/teams/${team.slug}`}
                    className="flex items-center gap-2.5 hover:text-accent-blue"
                  >
                    {team.logo_url && (
                      <Image
                        src={team.logo_url}
                        alt={team.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="whitespace-nowrap font-medium text-text-primary">
                      {team.name}
                    </span>
                  </Link>
                </td>
                {columns.map((col) => {
                  const val = col.getValue(team);
                  const formatted = col.format(val);
                  const isNumber = typeof val === "number";
                  return (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-3 py-2.5 text-right text-text-secondary ${
                        isNumber ? "font-mono" : ""
                      }`}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-text-muted">
            No teams match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}
