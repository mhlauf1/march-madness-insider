import { SupabaseClient } from "@supabase/supabase-js";

export async function getAllSeedData(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("historical_seed_data")
    .select("*")
    .order("seed", { ascending: true })
    .order("round", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getSeedPerformance(
  supabase: SupabaseClient,
  seed: number,
) {
  const { data, error } = await supabase
    .from("historical_seed_data")
    .select("*")
    .eq("seed", seed)
    .order("round", { ascending: true });

  if (error) throw error;
  return data;
}
