import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { aggregateSeedRecords } from "@/lib/utils/kenpom";
import type { HistoricalSeedData } from "@/lib/types";

interface SeedPerformanceProps {
  seedData: HistoricalSeedData[];
  completedGames: {
    team1: { id: string; seed: number } | null;
    team2: { id: string; seed: number } | null;
    winner_id: string | null;
  }[];
}

export function SeedPerformance({ seedData, completedGames }: SeedPerformanceProps) {
  const currentRecords = aggregateSeedRecords(completedGames);

  // Get round 1 historical data per seed
  const r1BySeed = new Map<number, HistoricalSeedData>();
  for (const d of seedData) {
    if (d.round === 1) {
      r1BySeed.set(d.seed, d);
    }
  }

  const seeds = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <section>
      <SectionHeader title="Seed Performance" subtitle="2026 results vs historical R1 win rates" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {seeds.map((seed) => {
          const hist = r1BySeed.get(seed);
          const current = currentRecords.get(seed);
          const histWinRate = hist?.win_rate ?? 0;
          const currentWinRate =
            current && current.wins + current.losses > 0
              ? current.wins / (current.wins + current.losses)
              : null;
          const delta = currentWinRate != null ? currentWinRate - histWinRate : null;

          return (
            <div
              key={seed}
              className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-text-primary">
                  #{seed}
                </span>
                {current ? (
                  <span className="font-mono text-xs text-text-secondary">
                    {current.wins}-{current.losses}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-text-muted">0-0</span>
                )}
              </div>
              <ProgressBar
                value={histWinRate * 100}
                max={100}
                color={seed <= 4 ? "blue" : seed <= 8 ? "green" : seed <= 12 ? "amber" : "red"}
              />
              {delta != null && (
                <p className={`mt-1 text-right font-mono text-xs ${delta >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {delta >= 0 ? "+" : ""}{(delta * 100).toFixed(0)}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
