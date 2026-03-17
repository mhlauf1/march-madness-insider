import { createServerClient } from "@/lib/supabase/server";
import { getAllTeams } from "@/lib/queries/teams";
import { TeamGrid } from "@/components/teams/TeamGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { TeamWithRatings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function TeamsPage() {
  const supabase = createServerClient();
  const teams = (await getAllTeams(supabase)) as TeamWithRatings[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SectionHeader
        title="All Teams"
        subtitle="68 teams competing in March Madness 2026"
      />
      <TeamGrid teams={teams} />
    </div>
  );
}
