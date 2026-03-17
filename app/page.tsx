import { createServerClient } from "@/lib/supabase/server";
import {
  getLiveGames,
  getUpcomingGames,
  getRecentResults,
} from "@/lib/queries/games";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ScoreboardCard } from "@/components/home/ScoreboardCard";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function HomePage() {
  const supabase = createServerClient();

  let liveGames: Awaited<ReturnType<typeof getLiveGames>> = [];
  let upcomingGames: Awaited<ReturnType<typeof getUpcomingGames>> = [];
  let recentResults: Awaited<ReturnType<typeof getRecentResults>> = [];
  let upsetCount = 0;
  let gamesPlayed = 0;

  try {
    [liveGames, upcomingGames, recentResults] = await Promise.all([
      getLiveGames(supabase),
      getUpcomingGames(supabase, 36),
      getRecentResults(supabase, 8),
    ]);

    const [{ count: upsets }, { count: played }] = await Promise.all([
      supabase
        .from("games")
        .select("*", { count: "exact", head: true })
        .eq("is_upset", true)
        .eq("is_completed", true),
      supabase
        .from("games")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", true),
    ]);
    upsetCount = upsets ?? 0;
    gamesPlayed = played ?? 0;
  } catch {
    // fallback to empty arrays (already initialized)
  }

  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      {/* Tournament Progress */}
      <div className="mb-8 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-5 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-text-primary">
            Tournament Progress
          </span>
          <span className="text-text-muted">
            {gamesPlayed}/67 games · {upsetCount} upset
            {upsetCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg-hover">
          <div
            className="h-full rounded-full bg-accent-blue transition-all"
            style={{ width: `${Math.min((gamesPlayed / 67) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Live Now" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveGames.map((game) => (
              <ScoreboardCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Upcoming" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingGames.map((game) => (
              <ScoreboardCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Results" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentResults.map((game) => (
              <ScoreboardCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
