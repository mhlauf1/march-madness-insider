import { SupabaseClient } from "@supabase/supabase-js";
import type { UserPick } from "@/lib/types";

export async function getUserPicks(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPick[]> {
  const { data, error } = await supabase
    .from("user_picks")
    .select("*")
    .eq("user_id", userId)
    .order("round", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertPick(
  supabase: SupabaseClient,
  pick: {
    user_id: string;
    game_id: string;
    picked_team_id: string;
    round: number;
    region: string | null;
  },
): Promise<UserPick> {
  const { data, error } = await supabase
    .from("user_picks")
    .upsert(pick, { onConflict: "user_id,game_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePicksByGameIds(
  supabase: SupabaseClient,
  userId: string,
  gameIds: string[],
): Promise<void> {
  if (gameIds.length === 0) return;

  const { error } = await supabase
    .from("user_picks")
    .delete()
    .eq("user_id", userId)
    .in("game_id", gameIds);

  if (error) throw error;
}

export async function deleteAllPicks(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_picks")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}
