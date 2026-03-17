import type { Game } from "@/lib/types";

const ROUND_NAMES: Record<number, string> = {
  0: "First Four",
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};

export function getRoundName(round: number): string {
  return ROUND_NAMES[round] ?? "Unknown";
}

export function getCurrentRound(games: Game[]): number {
  const incomplete = games.filter((g) => !g.is_completed);
  if (incomplete.length === 0) return 6;
  return Math.min(...incomplete.map((g) => g.round));
}

export function getRoundShortName(round: number): string {
  const short: Record<number, string> = {
    0: "FF",
    1: "R64",
    2: "R32",
    3: "S16",
    4: "E8",
    5: "F4",
    6: "NCG",
  };
  return short[round] ?? "?";
}
