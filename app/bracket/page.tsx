import { createServerClient } from "@/lib/supabase/server";
import { getAllGames } from "@/lib/queries/games";
import { BracketView } from "@/components/bracket/BracketView";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function BracketPage() {
  const supabase = createServerClient();
  const games = await getAllGames(supabase);

  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Tournament Bracket
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          2026 NCAA March Madness
        </p>
      </div>
      <BracketView games={games} />
    </div>
  );
}
