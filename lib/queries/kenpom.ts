import { SupabaseClient } from "@supabase/supabase-js";

export async function getTeamRatings(
  supabase: SupabaseClient,
  teamId: string,
) {
  const { data, error } = await supabase
    .from("kenpom_ratings")
    .select("*")
    .eq("team_id", teamId)
    .order("season", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllRatings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("kenpom_ratings")
    .select("*, teams(*)")
    .eq("season", 2026)
    .order("kenpom_rank", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProgramHistory(
  supabase: SupabaseClient,
  teamId: string,
) {
  const { data, error } = await supabase
    .from("kenpom_program_history")
    .select("*")
    .eq("team_id", teamId)
    .order("season", { ascending: true });

  if (error) throw error;
  return data;
}
