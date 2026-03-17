import type { Player } from "@/lib/types";

const YEAR_VALUES: Record<string, number> = {
  Fr: 1,
  So: 2,
  Jr: 3,
  Sr: 4,
};

export function computeExperienceScore(players: Player[]): number | null {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const p of players) {
    const yearVal = p.year_class ? YEAR_VALUES[p.year_class] : null;
    const mins = p.minutes_pct;
    if (yearVal == null || mins == null || mins <= 0) continue;
    weightedSum += yearVal * mins;
    totalWeight += mins;
  }

  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

export function getExperienceLabel(score: number): string {
  if (score < 2.0) return "Young";
  if (score < 3.0) return "Average";
  return "Veteran";
}
