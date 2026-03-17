import type { Player, KenpomRatings, Team } from "@/lib/types";

export interface UpsetFactor {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
  team1Value: string;
  team2Value: string;
}

export interface CoachProfile {
  tenure: number | null;
  tournamentApps: number | null;
  isFirstYear: boolean;
  label: string;
}

export interface TeamUpsetProfile {
  threePointReliance: {
    value: number | null;
    label: string;
    isHigh: boolean;
  };
  tempoProfile: {
    value: number | null;
    label: string;
    isExtreme: boolean;
  };
  experienceIndex: {
    value: number | null;
    label: string;
  };
  coachProfile: CoachProfile;
  isPowerConference: boolean;
  overallUpsetThreat: "low" | "medium" | "high";
}

const YEAR_CLASS_MAP: Record<string, number> = {
  Fr: 1,
  So: 2,
  Jr: 3,
  Sr: 4,
};

const POWER_CONFERENCES = new Set([
  "ACC",
  "Big 12",
  "Big Ten",
  "SEC",
  "Big East",
]);

export function computeExperienceIndex(players: Player[]): number | null {
  let weightedSum = 0;
  let totalMinutes = 0;

  for (const p of players) {
    const yearVal = p.year_class ? YEAR_CLASS_MAP[p.year_class] : null;
    if (yearVal == null || p.minutes_pct == null) continue;
    weightedSum += yearVal * p.minutes_pct;
    totalMinutes += p.minutes_pct;
  }

  if (totalMinutes < 0.5) return null;
  return weightedSum / totalMinutes;
}

export function getExperienceLabel(index: number): string {
  if (index < 1.8) return "Very Young";
  if (index < 2.2) return "Young";
  if (index < 2.8) return "Balanced";
  if (index < 3.3) return "Experienced";
  return "Very Experienced";
}

export function isPowerConference(conference: string): boolean {
  return POWER_CONFERENCES.has(conference);
}

export function getCoachLabel(
  tenure: number | null,
  tournamentApps: number | null,
): string {
  if (tenure === null) return "—";
  if (tenure <= 1) return "First Year";
  if ((tournamentApps ?? 0) >= 10) return "Tournament Veteran";
  if ((tournamentApps ?? 0) >= 5 || tenure >= 10) return "Experienced";
  if (tenure >= 4) return "Established";
  return "Developing";
}

export function computeMatchupUpsetFactors(
  team1: Team & { kenpom_ratings: KenpomRatings[] },
  team2: Team & { kenpom_ratings: KenpomRatings[] },
  team1Players?: Player[],
  team2Players?: Player[],
): UpsetFactor[] {
  const factors: UpsetFactor[] = [];

  const r1 = team1.kenpom_ratings?.[0];
  const r2 = team2.kenpom_ratings?.[0];
  if (!r1 || !r2) return factors;

  // 3PT Variance
  const t1_3pt = r1.pct_3pt;
  const t2_3pt = r2.pct_3pt;
  if (t1_3pt != null && t2_3pt != null) {
    const max3pt = Math.max(t1_3pt, t2_3pt);
    if (max3pt > 0.38) {
      const severity = max3pt > 0.42 ? "high" : "medium";
      const hotTeam = t1_3pt > t2_3pt ? team1.name : team2.name;
      factors.push({
        id: "three-point-variance",
        title: "3-Point Variance",
        severity,
        description:
          severity === "high"
            ? `${hotTeam} shoots elite from three. On a hot night, they can beat anyone — but cold shooting makes them vulnerable.`
            : `${hotTeam} relies heavily on the three-ball. High-volume 3PT teams create variance that favors upsets.`,
        team1Value: `${(t1_3pt * 100).toFixed(1)}%`,
        team2Value: `${(t2_3pt * 100).toFixed(1)}%`,
      });
    }
  }

  // Tempo Mismatch
  const t1_tempo = r1.adj_t;
  const t2_tempo = r2.adj_t;
  if (t1_tempo != null && t2_tempo != null) {
    const tempoDiff = Math.abs(t1_tempo - t2_tempo);
    if (tempoDiff >= 5) {
      const severity = tempoDiff >= 8 ? "high" : "medium";
      const slowTeam =
        t1_tempo < t2_tempo ? team1.name : team2.name;
      const fastTeam =
        t1_tempo > t2_tempo ? team1.name : team2.name;
      factors.push({
        id: "tempo-mismatch",
        title: "Tempo Mismatch",
        severity,
        description:
          severity === "high"
            ? `Massive tempo gap — ${slowTeam} wants to grind while ${fastTeam} wants to run. The slow team can frustrate elite offenses by limiting possessions.`
            : `${slowTeam} plays significantly slower than ${fastTeam}. Tempo control can neutralize talent advantages in March.`,
        team1Value: t1_tempo.toFixed(1),
        team2Value: t2_tempo.toFixed(1),
      });
    }
  }

  // Coaching Mismatch
  const t1_tenure = team1.coach_tenure_years;
  const t2_tenure = team2.coach_tenure_years;
  const t1_apps = team1.coach_tournament_apps;
  const t2_apps = team2.coach_tournament_apps;
  if (t1_apps != null && t2_apps != null) {
    const appsDiff = Math.abs(t1_apps - t2_apps);
    const firstYearMismatch =
      (t1_apps === 0 && t2_apps >= 5) ||
      (t2_apps === 0 && t1_apps >= 5);

    if (appsDiff >= 5 || firstYearMismatch) {
      const severity = firstYearMismatch || appsDiff >= 10 ? "high" : "medium";
      const t1Label = `${team1.coach ?? "Coach"} (${t1_tenure ?? "?"}yr, ${t1_apps} tourney)`;
      const t2Label = `${team2.coach ?? "Coach"} (${t2_tenure ?? "?"}yr, ${t2_apps} tourney)`;

      const vetTeam = t1_apps > t2_apps ? team1.name : team2.name;
      const newTeam = t1_apps > t2_apps ? team2.name : team1.name;

      factors.push({
        id: "coaching-mismatch",
        title: "Coaching Mismatch",
        severity,
        description:
          firstYearMismatch
            ? `A first-year head coach faces a seasoned veteran. First-time coaches in March often struggle with in-game adjustments and tournament pressure.`
            : `${vetTeam}'s coach has significantly more tournament experience than ${newTeam}'s. Veteran coaches with deep tournament resumes historically outperform in tight games.`,
        team1Value: t1Label,
        team2Value: t2Label,
      });
    }
  }

  // Experience Gap
  if (team1Players?.length && team2Players?.length) {
    const exp1 = computeExperienceIndex(team1Players);
    const exp2 = computeExperienceIndex(team2Players);
    if (exp1 != null && exp2 != null) {
      const expDelta = Math.abs(exp1 - exp2);
      if (expDelta >= 0.5) {
        const severity = expDelta >= 0.8 ? "high" : "medium";
        const expTeam = exp1 > exp2 ? team1 : team2;
        const youngTeam = exp1 > exp2 ? team2 : team1;
        const expIdx = exp1 > exp2 ? exp1 : exp2;
        const youngIdx = exp1 > exp2 ? exp2 : exp1;

        const isMidMajorVsBlueBlood =
          !isPowerConference(expTeam.conference) &&
          isPowerConference(youngTeam.conference);

        let description =
          severity === "high"
            ? `Major experience gap — ${expTeam.name} (${getExperienceLabel(expIdx)}) vs ${youngTeam.name} (${getExperienceLabel(youngIdx)}). Tournament experience is a proven edge in close games.`
            : `${expTeam.name} has a notable experience advantage over ${youngTeam.name}. Veteran teams tend to handle March pressure better.`;

        if (isMidMajorVsBlueBlood) {
          description += ` ${expTeam.name}'s experienced mid-major roster could exploit ${youngTeam.name}'s youth under tournament pressure.`;
        }

        factors.push({
          id: "experience-gap",
          title: "Experience Gap",
          severity,
          description,
          team1Value: `${exp1.toFixed(1)} (${getExperienceLabel(exp1)})`,
          team2Value: `${exp2.toFixed(1)} (${getExperienceLabel(exp2)})`,
        });
      }
    }
  }

  return factors;
}

export function computeTeamUpsetProfile(
  team: Team,
  rating: KenpomRatings | null,
  players: Player[],
): TeamUpsetProfile {
  const pct3pt = rating?.pct_3pt ?? null;
  const adjT = rating?.adj_t ?? null;
  const expIdx = players.length > 0 ? computeExperienceIndex(players) : null;
  const power = isPowerConference(team.conference);

  const coachLabel = getCoachLabel(
    team.coach_tenure_years,
    team.coach_tournament_apps,
  );

  const isHigh3pt = pct3pt != null && pct3pt > 0.38;
  const isExtremeTempo =
    adjT != null && (adjT < 64.0 || adjT > 71.0);

  let threatCount = 0;
  if (isHigh3pt) threatCount++;
  if (isExtremeTempo) threatCount++;
  if (expIdx != null && expIdx >= 2.8 && !power) threatCount++;
  // Veteran mid-major coach (5+ tournament apps, non-power conf) is an upset indicator
  if ((team.coach_tournament_apps ?? 0) >= 5 && !power) threatCount++;

  const overallUpsetThreat: "low" | "medium" | "high" =
    threatCount >= 2 ? "high" : threatCount === 1 ? "medium" : "low";

  return {
    threePointReliance: {
      value: pct3pt,
      label:
        pct3pt == null
          ? "—"
          : pct3pt > 0.42
            ? "Elite"
            : pct3pt > 0.38
              ? "High"
              : pct3pt > 0.34
                ? "Average"
                : "Low",
      isHigh: isHigh3pt,
    },
    tempoProfile: {
      value: adjT,
      label:
        adjT == null
          ? "—"
          : adjT < 64.0
            ? "Very Slow"
            : adjT < 66.0
              ? "Slow"
              : adjT < 69.0
                ? "Average"
                : adjT < 71.0
                  ? "Fast"
                  : "Very Fast",
      isExtreme: isExtremeTempo,
    },
    experienceIndex: {
      value: expIdx,
      label: expIdx != null ? getExperienceLabel(expIdx) : "—",
    },
    coachProfile: {
      tenure: team.coach_tenure_years,
      tournamentApps: team.coach_tournament_apps,
      isFirstYear: team.coach_is_first_year,
      label: coachLabel,
    },
    isPowerConference: power,
    overallUpsetThreat,
  };
}
