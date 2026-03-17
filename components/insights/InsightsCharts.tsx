"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Cell,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { KenpomRatings, Team } from "@/lib/types";

type RatingRow = KenpomRatings & { teams: Team };

interface InsightsChartsProps {
  data: RatingRow[];
}

// Hardcoded colors — Recharts can't use CSS variables
const REGION_COLORS: Record<string, string> = {
  East: "#2563eb",
  West: "#d97706",
  Midwest: "#059669",
  South: "#dc2626",
};

const SEED_TIER_COLORS = {
  elite: "#2563eb",
  strong: "#059669",
  mid: "#d97706",
  low: "#dc2626",
};

const SEED_TIER_LABELS = [
  { label: "Seeds 1-4", color: SEED_TIER_COLORS.elite },
  { label: "Seeds 5-8", color: SEED_TIER_COLORS.strong },
  { label: "Seeds 9-12", color: SEED_TIER_COLORS.mid },
  { label: "Seeds 13-16", color: SEED_TIER_COLORS.low },
];

function getSeedTierColor(seed: number): string {
  if (seed <= 4) return SEED_TIER_COLORS.elite;
  if (seed <= 8) return SEED_TIER_COLORS.strong;
  if (seed <= 12) return SEED_TIER_COLORS.mid;
  return SEED_TIER_COLORS.low;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface ChartPoint {
  name: string;
  abbreviation: string;
  seed: number;
  region: string;
  color: string;
  adj_o: number;
  adj_d: number;
  adj_em: number;
  adj_t: number;
  off_efg_pct: number;
  off_to_pct: number;
  luck: number;
  sos_adj_em: number;
  primary_color: string;
}

function flattenData(data: RatingRow[]): ChartPoint[] {
  return data
    .filter(
      (r) =>
        r.teams &&
        r.adj_o != null &&
        r.adj_d != null &&
        r.adj_em != null &&
        r.adj_t != null &&
        r.off_efg_pct != null &&
        r.off_to_pct != null &&
        r.luck != null &&
        r.sos_adj_em != null,
    )
    .map((r) => ({
      name: r.teams.name,
      abbreviation: r.teams.abbreviation,
      seed: r.teams.seed,
      region: r.teams.region,
      color: REGION_COLORS[r.teams.region] ?? "#6b7280",
      adj_o: r.adj_o!,
      adj_d: r.adj_d!,
      adj_em: r.adj_em!,
      adj_t: r.adj_t!,
      off_efg_pct: r.off_efg_pct!,
      off_to_pct: r.off_to_pct!,
      luck: r.luck!,
      sos_adj_em: r.sos_adj_em!,
      primary_color: r.teams.primary_color ?? "#6b7280",
    }));
}

function groupBySeed(points: ChartPoint[]): Map<number, ChartPoint[]> {
  const map = new Map<number, ChartPoint[]>();
  for (const p of points) {
    const arr = map.get(p.seed) ?? [];
    arr.push(p);
    map.set(p.seed, arr);
  }
  return map;
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6">
      {children}
    </div>
  );
}

function InlineLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  fields,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  fields: { key: keyof ChartPoint; label: string; format?: (v: number) => string }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-text-primary">
        ({d.seed}) {d.name}
      </p>
      <p className="mb-1 text-xs text-text-muted">{d.region} Region</p>
      {fields.map((f) => (
        <p key={f.key} className="text-xs text-text-secondary">
          {f.label}:{" "}
          <span className="font-mono font-medium">
            {f.format
              ? f.format(d[f.key] as number)
              : (d[f.key] as number).toFixed(1)}
          </span>
        </p>
      ))}
    </div>
  );
}

/* ─── Chart 1: Offense vs Defense (KEPT) ─── */

function OffenseDefenseChart({ points }: { points: ChartPoint[] }) {
  const medO = median(points.map((p) => p.adj_o));
  const medD = median(points.map((p) => p.adj_d));

  return (
    <ChartCard>
      <SectionHeader
        title="Offense vs Defense Efficiency"
        subtitle="Top-right quadrant = elite teams (good offense + good defense)"
      />
      <InlineLegend
        items={Object.entries(REGION_COLORS).map(([label, color]) => ({
          label,
          color,
        }))}
      />
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="adj_o"
            type="number"
            name="Adj. Offense"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "Adj. Offensive Efficiency →", position: "bottom", fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            dataKey="adj_d"
            type="number"
            name="Adj. Defense"
            domain={["auto", "auto"]}
            reversed
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "← Better Defense", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280", dx: -5 }}
          />
          <ReferenceLine x={medO} stroke="#9ca3af" strokeDasharray="4 4" />
          <ReferenceLine y={medD} stroke="#9ca3af" strokeDasharray="4 4" />
          <Tooltip
            content={
              <CustomTooltip
                fields={[
                  { key: "adj_o", label: "Adj. Offense" },
                  { key: "adj_d", label: "Adj. Defense" },
                  { key: "adj_em", label: "Adj. EM" },
                ]}
              />
            }
          />
          <Scatter data={points}>
            {points.map((p, i) => (
              <Cell key={i} fill={p.color} fillOpacity={0.8} r={5} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── Chart 2: Shooting vs Turnover (KEPT) ─── */

function ShootingTurnoverChart({ points }: { points: ChartPoint[] }) {
  return (
    <ChartCard>
      <SectionHeader
        title="Shooting Efficiency vs Turnover Rate"
        subtitle="Top-right = efficient shooting with low turnovers"
      />
      <InlineLegend items={SEED_TIER_LABELS} />
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="off_efg_pct"
            type="number"
            name="eFG%"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "Effective FG% →", position: "bottom", fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            dataKey="off_to_pct"
            type="number"
            name="TO%"
            domain={["auto", "auto"]}
            reversed
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "← Lower Turnover Rate", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280", dx: -5 }}
          />
          <Tooltip
            content={
              <CustomTooltip
                fields={[
                  { key: "off_efg_pct", label: "eFG%", format: (v) => v.toFixed(1) + "%" },
                  { key: "off_to_pct", label: "TO%", format: (v) => v.toFixed(1) + "%" },
                  { key: "adj_em", label: "Adj. EM" },
                ]}
              />
            }
          />
          <Scatter data={points}>
            {points.map((p, i) => (
              <Cell
                key={i}
                fill={getSeedTierColor(p.seed)}
                fillOpacity={0.8}
                r={5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── Chart 3: Seed Efficiency Ranges (REPLACES Efficiency by Seed) ─── */

interface SeedRangeRow {
  seed: number;
  min: number;
  max: number;
  avg: number;
  range: [number, number];
  teams: ChartPoint[];
  color: string;
}

function buildSeedRanges(points: ChartPoint[]): SeedRangeRow[] {
  const bySeeds = groupBySeed(points);
  const rows: SeedRangeRow[] = [];
  for (let seed = 1; seed <= 16; seed++) {
    const group = bySeeds.get(seed);
    if (!group || group.length === 0) continue;
    const ems = group.map((p) => p.adj_em);
    const min = Math.min(...ems);
    const max = Math.max(...ems);
    const avg = ems.reduce((s, v) => s + v, 0) / ems.length;
    rows.push({
      seed,
      min,
      max,
      avg,
      range: [min, max],
      teams: group,
      color: getSeedTierColor(seed),
    });
  }
  return rows;
}

function SeedRangeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as SeedRangeRow | undefined;
  if (!d) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-text-primary">
        Seed {d.seed}
      </p>
      <p className="text-xs text-text-secondary">
        Range: <span className="font-mono font-medium">{d.min.toFixed(1)} to {d.max.toFixed(1)}</span>
      </p>
      <p className="text-xs text-text-secondary">
        Avg: <span className="font-mono font-medium">{d.avg.toFixed(1)}</span>
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {d.teams.map((t) => t.abbreviation).join(", ")}
      </p>
    </div>
  );
}

function SeedEfficiencyRangesChart({ points }: { points: ChartPoint[] }) {
  const seedRanges = buildSeedRanges(points);

  return (
    <ChartCard>
      <SectionHeader
        title="Seed Efficiency Ranges"
        subtitle="Where seed lines overlap in quality = upset potential"
      />
      <InlineLegend items={SEED_TIER_LABELS} />
      <ResponsiveContainer width="100%" height={520}>
        <ComposedChart
          layout="vertical"
          data={seedRanges}
          margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} horizontal={false} />
          <XAxis
            type="number"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "Adj. Efficiency Margin →", position: "bottom", fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            dataKey="seed"
            type="category"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "Seed", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280", dx: -5 }}
            width={40}
          />
          <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <Tooltip content={<SeedRangeTooltip />} />
          {/* Range bars: min to max */}
          <Bar dataKey="range" barSize={14}>
            {seedRanges.map((row, i) => (
              <Cell key={i} fill={row.color} fillOpacity={0.3} />
            ))}
          </Bar>
          {/* Average marker */}
          <Scatter data={seedRanges} dataKey="avg" fill="#1f2937" r={4}>
            {seedRanges.map((row, i) => (
              <Cell key={i} fill={row.color} fillOpacity={1} />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-xs text-text-muted">
        Dots = seed average · Bars = min–max range within seed line
      </div>
    </ChartCard>
  );
}

/* ─── Chart 4: Luck vs Strength of Schedule (REPLACES Tempo vs Luck) ─── */

function LuckVsSosChart({ points }: { points: ChartPoint[] }) {
  const medSos = median(points.map((p) => p.sos_adj_em));

  return (
    <ChartCard>
      <SectionHeader
        title="Luck vs Strength of Schedule"
        subtitle="Top-left = lucky + easy schedule (fade); bottom-right = unlucky + tough schedule (sleepers)"
      />
      <InlineLegend items={SEED_TIER_LABELS} />
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="sos_adj_em"
            type="number"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "Strength of Schedule (AdjEM) →", position: "bottom", fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            dataKey="luck"
            type="number"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "KenPom Luck Rating", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7280", dx: -5 }}
          />
          {/* Quadrant reference lines */}
          <ReferenceLine x={medSos} stroke="#9ca3af" strokeDasharray="4 4" />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <Tooltip
            content={
              <CustomTooltip
                fields={[
                  { key: "sos_adj_em", label: "SOS AdjEM" },
                  { key: "luck", label: "Luck" },
                  { key: "adj_em", label: "Adj. EM" },
                ]}
              />
            }
          />
          <Scatter data={points}>
            {points.map((p, i) => (
              <Cell
                key={i}
                fill={getSeedTierColor(p.seed)}
                fillOpacity={0.8}
                r={5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ─── Main Export ─── */

export function InsightsCharts({ data }: InsightsChartsProps) {
  const points = flattenData(data);

  if (points.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          No KenPom data available yet. Check back once ratings are loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <OffenseDefenseChart points={points} />
      <ShootingTurnoverChart points={points} />
      <SeedEfficiencyRangesChart points={points} />
      <LuckVsSosChart points={points} />
    </div>
  );
}
