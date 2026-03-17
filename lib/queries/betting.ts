import { SupabaseClient } from "@supabase/supabase-js";

export async function getLatestFutures(supabase: SupabaseClient) {
  const { data: latest } = await supabase
    .from("championship_futures")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return [];

  const cutoff = new Date(
    new Date(latest.fetched_at).getTime() - 5 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("championship_futures")
    .select(`*, team:teams(*)`)
    .gte("fetched_at", cutoff)
    .order("odds", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGameOdds(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("betting_odds")
    .select("*")
    .eq("game_id", gameId)
    .order("fetched_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFuturesHistory(
  supabase: SupabaseClient,
  teamId: string,
) {
  const { data, error } = await supabase
    .from("championship_futures")
    .select("*")
    .eq("team_id", teamId)
    .order("fetched_at", { ascending: true });

  if (error) throw error;
  return data;
}
