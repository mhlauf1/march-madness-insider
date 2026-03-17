import { SectionHeader } from "@/components/ui/SectionHeader";
import { D1_AVERAGES } from "@/lib/constants/d1-averages";
import type { TeamUpsetProfile } from "@/lib/utils/upset-factors";

interface UpsetProfileSectionProps {
  profile: TeamUpsetProfile;
  threesPerGame?: number | null;
}

export function UpsetProfileSection({ profile, threesPerGame }: UpsetProfileSectionProps) {
  const threeReliance = profile.threePointReliance.value != null
    ? profile.threePointReliance.value * 100
    : null;
  const threeDelta = threeReliance != null
    ? threeReliance - D1_AVERAGES.pct_3pt * 100
    : null;
  const tempoDelta = profile.tempoProfile.value != null
    ? profile.tempoProfile.value - D1_AVERAGES.adj_t
    : null;

  return (
    <section className="mb-8">
      <SectionHeader
        title="March Factors"
        subtitle="Upset-relevant profile traits"
      />
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-6 md:p-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* 3-Point Reliance */}
          <div>
            <p className="stat-label mb-1">3-Point Reliance</p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {threeReliance != null ? `${threeReliance.toFixed(1)}%` : "—"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {threesPerGame != null
                ? `${profile.threePointReliance.label} · ~${threesPerGame.toFixed(1)} made 3s/game`
                : profile.threePointReliance.label}
            </p>
            {threeDelta != null && (
              <p className={`mt-0.5 font-mono text-xs ${threeDelta > 0 ? "text-accent-green" : threeDelta < 0 ? "text-accent-red" : "text-text-muted"}`}>
                {threeDelta > 0 ? "+" : ""}{threeDelta.toFixed(1)}% vs D1 avg
              </p>
            )}
          </div>

          {/* Adj. Tempo */}
          <div>
            <p className="stat-label mb-1">Adj. Tempo</p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {profile.tempoProfile.value != null ? profile.tempoProfile.value.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {profile.tempoProfile.label}
            </p>
            {tempoDelta != null && (
              <p className={`mt-0.5 font-mono text-xs ${tempoDelta > 0 ? "text-accent-green" : tempoDelta < 0 ? "text-accent-red" : "text-text-muted"}`}>
                {tempoDelta > 0 ? "+" : ""}{tempoDelta.toFixed(1)} vs D1 avg
              </p>
            )}
          </div>

          {/* Experience Index */}
          <div>
            <p className="stat-label mb-1">Experience Index</p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {profile.experienceIndex.value != null ? profile.experienceIndex.value.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {profile.experienceIndex.label}
            </p>
          </div>

          {/* Coach Experience */}
          <div>
            <p className="stat-label mb-1">Coach Experience</p>
            {profile.coachProfile.tournamentApps != null ? (
              <>
                <p className="font-mono text-2xl font-bold text-text-primary">
                  {profile.coachProfile.tournamentApps}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {profile.coachProfile.tenure != null
                    ? `${profile.coachProfile.tenure}yr tenure`
                    : "Tournament apps"}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {profile.coachProfile.label}
                </p>
              </>
            ) : (
              <p className="font-mono text-2xl font-bold text-text-muted">—</p>
            )}
          </div>
        </div>

        {profile.overallUpsetThreat === "high" && (
          <div className="mt-6 rounded-[var(--radius-md)] border border-accent-amber/40 bg-accent-amber/5 px-5 py-4">
            <p className="text-sm font-medium text-accent-amber">
              High Upset Threat Profile
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              This team has multiple upset-relevant traits — a combination of
              three-point shooting, extreme tempo, or veteran experience that
              historically correlates with March Madness surprises.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
