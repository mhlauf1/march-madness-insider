import { SupabaseClient } from "@supabase/supabase-js";

export async function getAllGames(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*),
      team2:teams!games_team2_id_fkey(*),
      winner:teams!games_winner_id_fkey(*)
    `,
    )
    .order("round", { ascending: true })
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGameById(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*, kenpom_ratings(*), kenpom_players(*)),
      team2:teams!games_team2_id_fkey(*, kenpom_ratings(*), kenpom_players(*)),
      betting_odds(*)
    `,
    )
    .eq("id", gameId)
    .single();

  if (error) throw error;
  return data;
}

export async function getLiveGames(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*),
      team2:teams!games_team2_id_fkey(*)
    `,
    )
    .eq("status", "in_progress")
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getUpcomingGames(supabase: SupabaseClient, limit = 8) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*),
      team2:teams!games_team2_id_fkey(*)
    `,
    )
    .eq("is_completed", false)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getTeamSeasonStats(supabase: SupabaseClient, teamId: string) {
  const { data } = await supabase
    .from("team_season_stats")
    .select("*")
    .eq("team_id", teamId)
    .limit(1);

  return data?.[0] ?? null;
}

export async function getRecentResults(supabase: SupabaseClient, limit = 3) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*),
      team2:teams!games_team2_id_fkey(*),
      winner:teams!games_winner_id_fkey(*)
    `,
    )
    .eq("is_completed", true)
    .order("scheduled_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUpcomingGamesWithOdds(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      team1:teams!games_team1_id_fkey(*, kenpom_ratings(*)),
      team2:teams!games_team2_id_fkey(*, kenpom_ratings(*)),
      betting_odds(*)
    `,
    )
    .eq("is_completed", false)
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCompletedGamesWithSeeds(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      winner_id,
      team1:teams!games_team1_id_fkey(id, seed),
      team2:teams!games_team2_id_fkey(id, seed)
    `,
    )
    .eq("is_completed", true);

  if (error) throw error;
  return data;
}
