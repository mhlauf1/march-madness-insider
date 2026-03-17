import type { Game } from "@/lib/types";

/**
 * Given a game in rounds 1-4 (regional rounds), returns the next game slot
 * that the winner feeds into.
 *
 * Within a region, game N in round R feeds into game ceil(N/2) in round R+1.
 * Final Four and Championship have fixed cross-region mapping.
 */

// Final Four mapping: which regions feed into which F4 game
// F4 game 1: East vs Midwest (left side)
// F4 game 2: West vs South (right side)
const F4_REGION_MAP: Record<string, number> = {
  East: 1,
  Midwest: 1,
  West: 2,
  South: 2,
};

// Treat placeholder teams (seed 99 or name "TBD") as absent
const isTBD = (team?: { name?: string; seed?: number } | null) =>
  !team || team.name === "TBD" || team.seed === 99;

/**
 * Find the next game that the winner of this game advances to.
 */
export function getNextGame(
  game: Game,
  allGames: Game[],
): Game | null {
  if (game.round === 6) return null; // Championship has no next game

  // First Four → R64: find the R64 game in the same region with a matching slot
  if (game.round === 0) {
    const ffTeam = game.team1 ?? game.team2;
    if (!ffTeam) return null;
    const oppSeed = 17 - ffTeam.seed; // 16→1, 11→6
    return (
      allGames.find(
        (g) =>
          g.round === 1 &&
          g.region === ffTeam.region &&
          (g.team1?.seed === oppSeed || g.team2?.seed === oppSeed) &&
          (isTBD(g.team1) || isTBD(g.team2)),
      ) ?? null
    );
  }

  // Final Four → Championship
  if (game.round === 5) {
    return allGames.find((g) => g.round === 6) ?? null;
  }

  // Elite 8 → Final Four
  if (game.round === 4) {
    const f4GameNumber = F4_REGION_MAP[game.region ?? ""];
    if (!f4GameNumber) return null;
    return (
      allGames.find(
        (g) => g.round === 5 && g.game_number === f4GameNumber,
      ) ?? null
    );
  }

  // Regional rounds (1-3): game N feeds into game ceil(N/2) in next round
  if (game.round >= 1 && game.round <= 3 && game.game_number != null) {
    const nextGameNumber = Math.ceil(game.game_number / 2);
    return (
      allGames.find(
        (g) =>
          g.round === game.round + 1 &&
          g.region === game.region &&
          g.game_number === nextGameNumber,
      ) ?? null
    );
  }

  return null;
}

/**
 * Determine which slot (team1 or team2) the winner fills in the next game.
 * Odd game numbers fill team1 slot, even fill team2 slot.
 */
export function getNextGameSlot(
  game: Game,
): "team1" | "team2" {
  // First Four winners fill the TBD slot (team2) in R64
  if (game.round === 0) return "team2";

  if (game.game_number == null) return "team1";

  // For F4→NCG: F4 game 1 winner is team1, game 2 is team2
  if (game.round === 5) {
    return game.game_number === 1 ? "team1" : "team2";
  }

  // For E8→F4: region determines slot
  if (game.round === 4) {
    const region = game.region ?? "";
    // East/West are team1, Midwest/South are team2 in their F4 game
    if (region === "East" || region === "West") return "team1";
    return "team2";
  }

  // Regional rounds: odd game numbers fill team1, even fill team2
  return game.game_number % 2 === 1 ? "team1" : "team2";
}

/**
 * Get all downstream games that depend on a specific team advancing past a given game.
 * Used for cascade deletion when a pick changes.
 */
export function getDownstreamGameIds(
  game: Game,
  allGames: Game[],
): string[] {
  const downstream: string[] = [];
  let current: Game | null = game;

  while (current) {
    const next = getNextGame(current, allGames);
    if (next) {
      downstream.push(next.id);
    }
    current = next;
  }

  return downstream;
}
