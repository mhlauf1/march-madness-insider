export function getWinProbability(adjEmA: number, adjEmB: number): number {
  const k = 0.038;
  return 1 / (1 + Math.exp(-k * (adjEmA - adjEmB)));
}

export function getWinProbFromOdds(
  bettingOdds: { ml_team1: number | null; ml_team2: number | null }[] | undefined,
): number | null {
  if (!bettingOdds) return null;
  const entry = bettingOdds.find(
    (o) => o.ml_team1 != null && o.ml_team2 != null,
  );
  if (!entry) return null;
  const prob1 = oddsToImpliedProb(entry.ml_team1!);
  const prob2 = oddsToImpliedProb(entry.ml_team2!);
  return prob1 / (prob1 + prob2);
}

export function oddsToImpliedProb(americanOdds: number): number {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(0)}%`;
}
