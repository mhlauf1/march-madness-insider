import { SupabaseClient } from "@supabase/supabase-js";
import { computeExperienceScore } from "@/lib/utils/stats";
import type { TeamWithFullStats } from "@/lib/types";

export async function getAllTeamsWithFullStats(
  supabase: SupabaseClient,
): Promise<TeamWithFullStats[]> {
  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      *,
      kenpom_ratings(*),
      championship_futures(*),
      kenpom_players(*),
      team_season_stats(*)
    `,
    )
    .order("seed", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((team) => ({
    ...team,
    experience_score: computeExperienceScore(team.kenpom_players ?? []),
  }));
}
