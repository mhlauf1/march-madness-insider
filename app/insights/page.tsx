import { createServerClient } from "@/lib/supabase/server";
import { getAllRatings } from "@/lib/queries/kenpom";
import { getLatestFutures } from "@/lib/queries/betting";
import {
  getUpcomingGamesWithOdds,
  getCompletedGamesWithSeeds,
} from "@/lib/queries/games";
import { getAllSeedData } from "@/lib/queries/historical";
import { InsightsCharts } from "@/components/insights/InsightsCharts";
import { PowerRankings } from "@/components/home/PowerRankings";
import { ChampionshipOdds } from "@/components/home/ChampionshipOdds";
import { UpsetWatch } from "@/components/home/UpsetWatch";
import { SeedPerformance } from "@/components/home/SeedPerformance";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function InsightsPage() {
  const supabase = createServerClient();

  const [ratings, futures, gamesWithOdds, seedData, completedWithSeeds] =
    await Promise.all([
      getAllRatings(supabase),
      getLatestFutures(supabase),
      getUpcomingGamesWithOdds(supabase),
      getAllSeedData(supabase),
      getCompletedGamesWithSeeds(supabase),
    ]);

  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Insights
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Advanced analytics across all 68 tournament teams
        </p>
      </div>

      {/* Row 1: Power Rankings + Championship Odds */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <PowerRankings ratings={ratings} />
        <ChampionshipOdds futures={futures} />
      </div>

      {/* Row 2: Upset Watch + Seed Performance */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <UpsetWatch games={gamesWithOdds} />
        <SeedPerformance
          seedData={seedData}
          completedGames={completedWithSeeds.map((g) => ({
            winner_id: g.winner_id,
            team1: Array.isArray(g.team1) ? (g.team1[0] ?? null) : g.team1,
            team2: Array.isArray(g.team2) ? (g.team2[0] ?? null) : g.team2,
          }))}
        />
      </div>

      <InsightsCharts data={ratings} />
    </div>
  );
}
