import { SupabaseClient } from "@supabase/supabase-js";

export async function getAllTeams(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("teams")
    .select(`*, kenpom_ratings(*), championship_futures(*)`)
    .neq("name", "TBD")
    .order("seed", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTeamBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      *,
      kenpom_ratings(*),
      kenpom_players(*),
      kenpom_program_history(*),
      team_travel(*, games(*))
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;

  // Fetch season stats separately — table may not exist yet
  const { data: seasonStats } = await supabase
    .from("team_season_stats")
    .select("*")
    .eq("team_id", data.id)
    .limit(1);

  return { ...data, team_season_stats: seasonStats ?? [] };
}
