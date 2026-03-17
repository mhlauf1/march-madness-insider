/**
 * D1 men's basketball averages for the 2025-26 season.
 * Used as baselines for BigStatCard delta calculations.
 */
export const D1_AVERAGES = {
  // Scoring
  ppg: 73.0,
  opp_ppg: 73.0,
  first_half_ppg: 35.5,
  second_half_ppg: 37.5,
  opp_first_half_ppg: 35.5,
  opp_second_half_ppg: 37.5,
  avg_margin: 0.0,

  // Four Factors — Defense (KenPom)
  def_efg_pct: 50.0,

  // Counting Stats (ESPN)
  avg_turnovers: 12.5,
  avg_off_rebounds: 10.0,
  avg_assists: 14.5,
  avg_steals: 7.0,
  avg_blocks: 3.5,
  ft_pct: 70.0,
  efg_pct: 50.0,
  avg_3pa: 22.0,
  avg_3pm: 7.9,
  three_pt_pct: 35.0,

  // Upset factor baselines (KenPom)
  pct_3pt: 0.36,
  adj_t: 67.5,
} as const;
