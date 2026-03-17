import { createServerClient } from "@/lib/supabase/server";
import { getAllTeamsWithFullStats } from "@/lib/queries/stats";
import { StatsExplorer } from "@/components/stats/StatsExplorer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function StatsPage() {
  const supabase = createServerClient();
  const teams = await getAllTeamsWithFullStats(supabase);

  return (
    <div className="mx-auto max-w-400 px-4 py-8">
      <SectionHeader
        title="Stats Explorer"
        subtitle="Deep statistical breakdowns for all 68 tournament teams"
      />
      <StatsExplorer teams={teams} />
    </div>
  );
}
