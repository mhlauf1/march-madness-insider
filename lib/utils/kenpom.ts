/**
 * Compute a projected point spread using KenPom adjusted efficiency margins and tempo.
 * Positive return = team1 favored.
 */
export function computeKenpomSpread(
  adjEm1: number,
  adjEm2: number,
  adjT1: number,
  adjT2: number,
): number {
  return ((adjEm1 - adjEm2) * ((adjT1 + adjT2) / 2)) / 100;
}

/**
 * Tally 2026 tournament wins/losses by seed from completed games.
 */
export function aggregateSeedRecords(
  completedGames: {
    team1: { id: string; seed: number } | null;
    team2: { id: string; seed: number } | null;
    winner_id: string | null;
  }[],
): Map<number, { wins: number; losses: number }> {
  const records = new Map<number, { wins: number; losses: number }>();

  for (const game of completedGames) {
    if (!game.team1 || !game.team2 || !game.winner_id) continue;

    for (const team of [game.team1, game.team2]) {
      if (!records.has(team.seed)) {
        records.set(team.seed, { wins: 0, losses: 0 });
      }
      const rec = records.get(team.seed)!;
      if (team.id === game.winner_id) {
        rec.wins++;
      } else {
        rec.losses++;
      }
    }
  }

  return records;
}
