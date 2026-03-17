import Link from "next/link";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { KenpomRatings, Team } from "@/lib/types";

interface PowerRankingsProps {
  ratings: (KenpomRatings & { teams: Team })[];
}

export function PowerRankings({ ratings }: PowerRankingsProps) {
  const top10 = ratings.slice(0, 10);

  if (top10.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Power Rankings" subtitle="KenPom top 10" />
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-elevated text-left text-xs text-text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 text-right font-medium">AdjEM</th>
              <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">AdjO</th>
              <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">AdjD</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border-subtle last:border-0 transition-colors hover:bg-bg-hover"
              >
                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                  {r.kenpom_rank}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/teams/${r.teams.slug}`} className="hover:underline">
                    <TeamBadge team={r.teams} size="sm" />
                  </Link>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-semibold">
                  {r.adj_em != null ? (r.adj_em > 0 ? `+${r.adj_em.toFixed(1)}` : r.adj_em.toFixed(1)) : "—"}
                </td>
                <td className="hidden px-3 py-2 text-right font-mono text-xs text-text-secondary sm:table-cell">
                  {r.adj_o?.toFixed(1) ?? "—"}
                </td>
                <td className="hidden px-3 py-2 text-right font-mono text-xs text-text-secondary sm:table-cell">
                  {r.adj_d?.toFixed(1) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
