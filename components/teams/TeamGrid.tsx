"use client";

import { useState, useMemo } from "react";
import type { TeamWithRatings } from "@/lib/types";
import { TeamCard } from "@/components/teams/TeamCard";

type SortKey = "seed" | "kenpom_rank" | "adj_em" | "adj_o" | "adj_d";
type SeedRange = "all" | "1-4" | "5-8" | "9-12" | "13-16";

const REGIONS = ["All", "East", "West", "Midwest", "South"] as const;
const SEED_RANGES: { label: string; value: SeedRange }[] = [
  { label: "All Seeds", value: "all" },
  { label: "1-4", value: "1-4" },
  { label: "5-8", value: "5-8" },
  { label: "9-12", value: "9-12" },
  { label: "13-16", value: "13-16" },
];
const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Seed", value: "seed" },
  { label: "KenPom Rank", value: "kenpom_rank" },
  { label: "AdjEM", value: "adj_em" },
  { label: "AdjO", value: "adj_o" },
  { label: "AdjD", value: "adj_d" },
];

function seedInRange(seed: number, range: SeedRange): boolean {
  if (range === "all") return true;
  const [lo, hi] = range.split("-").map(Number);
  return seed >= lo && seed <= hi;
}

interface TeamGridProps {
  teams: TeamWithRatings[];
}

export function TeamGrid({ teams }: TeamGridProps) {
  const [region, setRegion] = useState<string>("All");
  const [seedRange, setSeedRange] = useState<SeedRange>("all");
  const [conference, setConference] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("seed");

  const conferences = useMemo(() => {
    const set = new Set(teams.map((t) => t.conference));
    return ["All", ...Array.from(set).sort()];
  }, [teams]);

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

    result = [...result].sort((a, b) => {
      const aRating = a.kenpom_ratings?.[0];
      const bRating = b.kenpom_ratings?.[0];

      switch (sort) {
        case "seed": {
          if (a.seed !== b.seed) return a.seed - b.seed;
          // Tiebreak by best championship odds (lower = better)
          const aOdds = Math.min(...(a.championship_futures ?? []).map((f) => f.odds), 999999);
          const bOdds = Math.min(...(b.championship_futures ?? []).map((f) => f.odds), 999999);
          return aOdds - bOdds;
        }
        case "kenpom_rank":
          return (aRating?.kenpom_rank ?? 999) - (bRating?.kenpom_rank ?? 999);
        case "adj_em":
          return (bRating?.adj_em ?? -999) - (aRating?.adj_em ?? -999);
        case "adj_o":
          return (bRating?.adj_o ?? -999) - (aRating?.adj_o ?? -999);
        case "adj_d":
          return (aRating?.adj_d ?? 999) - (bRating?.adj_d ?? 999);
        default:
          return 0;
      }
    });

    return result;
  }, [teams, region, seedRange, conference, sort]);

  const selectClass =
    "rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue";

  return (
    <div>
      {/* Filter / Sort bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
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

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClass}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-text-muted">
        {filtered.length} team{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Team grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-text-muted">
          No teams match the current filters.
        </p>
      )}
    </div>
  );
}
